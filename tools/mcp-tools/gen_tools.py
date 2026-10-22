import os, re, sys, json

src = open(sys.argv[1]).read()
support = open(sys.argv[2]).read()
# the record types are the CLI's own, next to mcp_tools.go
domain = open(os.path.join(os.path.dirname(sys.argv[1]), 'domain.go')).read()

def str_list(name, text):
    m = re.search(name + r'\s*=\s*\[\]string\{([^}]*)\}', text)
    return re.findall(r'"([^"]*)"', m.group(1))

lists = {
    'dnsRecordTypes': str_list('dnsRecordTypes', domain),
    'supportTicketTypes': str_list('supportTicketTypes', support),
    'supportImpacts': str_list('supportImpacts', support),
    'supportServices': str_list('supportServices', support),
}

def unq(s):
    if s.startswith('`'): return s[1:-1]
    return json.loads(s)

def parse_args(text, i):
    # text[i] == '(' ; returns list of raw args and index after ')'
    depth = 0; args = []; cur = ''; j = i
    while j < len(text):
        c = text[j]
        if c == '"':
            k = j + 1
            while text[k] != '"':
                if text[k] == '\\': k += 1
                k += 1
            cur += text[j:k+1]; j = k + 1; continue
        if c == '`':
            k = text.index('`', j + 1); cur += text[j:k+1]; j = k + 1; continue
        if c in '({[':
            depth += 1
            if depth == 1: j += 1; continue
        if c in ')}]':
            depth -= 1
            if depth == 0:
                args.append(cur.strip()); return args, j + 1
        if c == ',' and depth == 1:
            args.append(cur.strip()); cur = ''; j += 1; continue
        cur += c; j += 1
    raise Exception('unbalanced')

KIND = {'kString': 'string', 'kInt': 'integer', 'kBool': 'boolean', 'kStrings': 'array of strings', 'kMap': 'object', 'kJSON': 'json'}

def ctor(name, args):
    if name == 'posArg': return dict(name=unq(args[0]), type='string', desc=unq(args[1]), required=True, positional=True)
    if name == 'optArg': return dict(name=unq(args[0]), type='string', desc=unq(args[1]), required=False, positional=True)
    if name == 'posArgs': return dict(name=unq(args[0]), type='array of strings', desc=unq(args[1]), required=False, positional=True)
    if name == 'posInt': return dict(name=unq(args[0]), type='integer', desc=unq(args[1]), required=True, positional=True)
    t = {'strFlag': 'string', 'intFlag': 'integer', 'boolFlag': 'boolean', 'listFlag': 'array of strings', 'mapFlag': 'object'}
    if name in t: return dict(name=unq(args[0]), type=t[name], desc=unq(args[2]), required=False, flag=unq(args[1]))
    if name == 'custom': return dict(name=unq(args[0]), type=KIND[args[1]], desc=unq(args[2]), required=False)
    raise Exception(name)

def modifiers(text, j, p):
    while True:
        m = re.match(r'\.(req|oneOf|explicitFalse|withSchema)\(', text[j:])
        if not m: return j
        mod = m.group(1)
        args, j2 = parse_args(text, j + m.end() - 1)
        if mod == 'req': p['required'] = True
        if mod == 'explicitFalse': p['explicit'] = True
        if mod == 'oneOf':
            vals = []
            for a in args:
                if a.endswith('...'): vals += lists[a[:-3]]
                elif a: vals.append(unq(a))
            p['enum'] = vals
        if mod == 'withSchema':
            p['schema'] = args[0][:40]
            p['type'] = 'object' if '"type": "object"' in args[0][:30] or args[0].startswith('map[string]any{"type": "object"') else 'array'
        j = j2

shared = {}
# shared single params in the var block
for m in re.finditer(r'\n\t(mcp[A-Za-z]+)\s*=\s*(posArg|optArg|posArgs|boolFlag|custom|strFlag)\(', src):
    args, j = parse_args(src, m.end() - 1)
    p = ctor(m.group(2), args)
    modifiers(src, j, p)
    shared[m.group(1)] = p

def parse_params(text):
    params = []; j = 0
    pat = re.compile(r'(posArg|optArg|posArgs|posInt|strFlag|intFlag|boolFlag|listFlag|mapFlag|custom)\(|(?<!\[\])mcpParam\{|mcpExecParams\((\w+)\)|(mcpAppCreateParams|mcpTargetParams)\.\.\.|\b(mcpWait|mcpCluster|mcpDatabase|mcpBucket|mcpProject|mcpApp|mcpDomain|mcpProvider|mcpVarKind)\b')
    while True:
        m = pat.search(text, j)
        if not m: return params
        if m.group(1):
            args, j2 = parse_args(text, m.end() - 1)
            p = ctor(m.group(1), args)
            j = modifiers(text, j2, p)
            params.append(p)
        elif m.group(0).startswith('mcpParam{'):
            k = text.index('}', m.end())
            body = text[m.end():k]
            p = dict(name=re.search(r'name: "([^"]*)"', body).group(1), type=KIND[re.search(r'kind: (\w+)', body).group(1)], desc=unq(re.search(r'desc: ("(?:[^"\\]|\\.)*")', body).group(1)), required=False)
            params.append(p); j = k + 1
        elif m.group(2):
            params.append(dict(shared[m.group(2)]))
            params += parse_params(EXEC_TAIL)
            j = m.end()
        elif m.group(3):
            params += parse_params(GROUPS[m.group(3)])
            j = m.end()
        else:
            params.append(dict(shared[m.group(4)])); j = m.end()

def block(name):
    i = src.index('var ' + name + ' = []mcpParam{')
    args, j = parse_args(src, src.index('{', i + len('var ' + name + ' = []mcpParam')))
    return src[i:j]

GROUPS = {'mcpAppCreateParams': block('mcpAppCreateParams'), 'mcpTargetParams': block('mcpTargetParams')}
ei = src.index('func mcpExecParams')
EXEC_TAIL = src[src.index('target,', ei) + 7: src.index('\n}', ei)]

start = src.index('var mcpTools = []mcpTool{')
body = src[start:]
entries = re.split(r'\n\t\{name: ', body)[1:]
tools = []
for e in entries:
    e = '{name: ' + e
    name = re.match(r'\{name: "([a-z_]+)"', e).group(1)
    toolset = re.search(r'toolset: "([a-z]+)"', e).group(1)
    cmd = re.findall(r'"([^"]*)"', re.search(r'cmd: \[\]string\{([^}]*)\}', e).group(1))
    effect = 'write' if 'effect: mcpWrite' in e else 'delete' if 'effect: mcpDelete' in e else 'read'
    idem = 'idempotent: true' in e
    desc = unq(re.search(r'desc:\s+("(?:[^"\\]|\\.)*")', e).group(1))
    params = []
    pm = re.search(r'params:\s', e)
    if pm:
        ptext = e[pm.end():]
        cut = re.search(r'\n\t\t(build|raw|tail|answerOnFailure|desc):', ptext)
        if cut: ptext = ptext[:cut.start()]
        params = parse_params(ptext)
    tools.append(dict(name=name, toolset=toolset, cmd=cmd, effect=effect, idempotent=idem or effect == 'read', desc=desc, params=params))

json.dump(tools, open(sys.argv[3], 'w'), indent=1)
from collections import Counter
print(len(tools), Counter(t['toolset'] for t in tools), Counter(t['effect'] for t in tools))
