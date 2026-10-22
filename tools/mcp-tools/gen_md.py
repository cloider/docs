import json, re, sys

tools = json.load(open(sys.argv[1]))
out = open(sys.argv[2], 'w')

CLI_PAGE = {'cluster': 'cluster', 'db': 'db', 'bucket': 'bucket', 'registry': 'registry', 'app': 'app', 'deploy': 'deploy',
            'git': 'git', 'domain': 'domain', 'dns': 'dns', 'target': 'target', 'support': 'support',
            'whoami': 'account', 'usage': 'account', 'billing': 'account', 'pricing': 'account', 'member': 'account', 'token': 'account'}

# What the docs add to a tool, where its own description doesn't tell the whole story
NOTES = {
    'get_domain': 'The answer holds the domain\'s name, type, status and creation date, and its targets, each with the `hashed_id` that `update_domain_target` and `delete_domain_target` take.',
    'get_usage': 'Without `kind` and `name` it runs `cloider usage`. With both it runs `cloider <kind> usage <name>`. Giving only one of them fails with `kind and name go together`.',
    'get_billing': 'With `month` it runs `cloider billing show <month>`.',
    'database_exec': 'Give either `query` or `script`, not both (`give either query or script`).',
    'upload_bucket_objects': 'Give either `paths` or `content`. `content` needs `key`, and is written to a temporary file named after the key, so the content type comes from the key\'s extension.',
    'download_bucket_objects': 'Without `dest`, exactly one key and no `recursive`: the file comes back as text, up to 1 MiB. A binary or larger file fails with `The file is binary or over 1 MiB, give dest to download it to a path instead.`',
    'update_database_trusted_sources': 'Give at least one of `set`, `add`, `remove` or `add_my_ip`, or the call fails with `nothing to change, give set, add, remove or add_my_ip`.',
    'list_registry_retention_runs': '`task_id` needs `run_id`.',
    'deploy_app': '`dir` is required unless `git` is true, and `git` needs `app`. `dir` must be an absolute path on the machine the MCP server runs on.',
    'set_app_variables': '`variables` can\'t be empty.',
}

def mdx(text):
    text = text.replace('{exit_code, stdout, stderr, timed_out}', '`{exit_code, stdout, stderr, timed_out}`')
    text = text.replace('{"KEY": "value"}', '`{"KEY": "value"}`')
    text = text.replace('\\"GET key\\"', '"GET key"')
    def wrap(m):
        tok = m.group(0)
        trail = ''
        while tok and tok[-1] in '.,;:)':
            trail = tok[-1] + trail
            tok = tok[:-1]
        lead = ''
        while tok and tok[0] in '(':
            lead += tok[0]
            tok = tok[1:]
        return lead + '`' + tok + '`' + trail
    parts = re.split(r'(`[^`]*`)', text)
    for i, p in enumerate(parts):
        if not p.startswith('`'):
            p = re.sub(r'\S*[<{}]\S*', wrap, p)
            p = p.replace('|', '\\|')
            parts[i] = p
    return ''.join(parts)

EFFECT = {
    'read': ('Read only', '`readOnlyHint`, `idempotentHint`'),
    'write': ('Changes resources', None),
    'delete': ('Destructive', '`destructiveHint`'),
}

current = None
for t in tools:
    if t['toolset'] != current:
        current = t['toolset']
        out.write('\n@@TOOLSET:%s@@\n' % current)
    effect, hints = EFFECT[t['effect']]
    if t['effect'] == 'write':
        hints = '`idempotentHint`' if t['idempotent'] else 'none'
    if t['effect'] == 'delete' and t['idempotent']:
        hints = '`destructiveHint`, `idempotentHint`'
    cmd = 'cloider ' + ' '.join(t['cmd'])
    page = CLI_PAGE[t['cmd'][0]]
    out.write('\n### %s\n\n' % t['name'])
    out.write(mdx(t['desc']) + '\n\n')
    if t['name'] in NOTES:
        out.write(':::note\n' + NOTES[t['name']] + '\n:::\n\n')
    out.write('| Effect | Idempotent | Annotations | Runs |\n| --- | --- | --- | --- |\n')
    out.write('| %s | %s | %s | [`%s`](/cli/commands/%s) |\n\n' % (effect, 'Yes' if t['idempotent'] else 'No', hints, cmd, page))
    if not t['params']:
        out.write('No parameters.\n')
        continue
    out.write('| Parameter | Type | Required | Description |\n| --- | --- | --- | --- |\n')
    for p in t['params']:
        typ = p['type']
        if p['name'] == 'policy':
            typ = 'object (JSON)'
        if p['name'] == 'rules':
            typ = 'array of objects (JSON)'
        desc = mdx(p['desc'])
        if p.get('enum'):
            if not desc.endswith('.'):
                desc += '.'
            desc += ' One of ' + ', '.join('`%s`' % v for v in p['enum']) + '.'
        if not desc.endswith('.'):
            desc += '.'
        out.write('| `%s` | %s | %s | %s |\n' % (p['name'], typ, 'Yes' if p['required'] else 'No', desc[0].upper() + desc[1:] if not desc.startswith('`') else desc))
out.close()
