import json, sys

tools = json.load(open(sys.argv[1]))
frag = open(sys.argv[2]).read()
dest = sys.argv[3]

from collections import Counter, OrderedDict
by = OrderedDict()
for t in tools:
    by.setdefault(t['toolset'], []).append(t)

INTRO = {
    'account': ('Account tools (account)', 'The `account` toolset tells the agent who it is acting as and what things cost. Start a session with `whoami`: it says which account the token belongs to, the role, and whether the token can only read. Members and API tokens can be listed but not changed: adding members, changing roles and creating or revoking tokens are dashboard only, see [Access control](/account/access-control) and [API tokens](/account/api-tokens).'),
    'clusters': ('Kubernetes cluster tools (clusters)', 'The `clusters` toolset creates, pauses, resumes and deletes [Kubernetes clusters](/kubernetes/overview), hands out their kubeconfig, lists the Services they expose, and runs commands in the cluster\'s terminal, where `kubectl` and `helm` are already connected. A cluster takes a few minutes to create: pass `wait: true`, or poll `get_cluster`.'),
    'databases': ('Database tools (databases)', 'The `databases` toolset manages [PostgreSQL, MySQL, MongoDB and Redis databases](/databases/overview): create, resize, pause, rename, back up and restore, change SSL and trusted sources, read connection details, the password and the CA certificate, and run queries with `database_exec`. `get_database` returns the connection details without the password; the password comes from `get_database_password`, so a client can ask before revealing it.'),
    'buckets': ('Object storage tools (buckets)', 'The `buckets` toolset manages [S3 compatible buckets](/object-storage/overview) and what is in them: create and delete buckets, change visibility, versioning, policies and lifecycle rules, list, upload, download and delete files, restore earlier versions, and manage S3 access keys. Uploads go through the API one file at a time; for large syncs, have the agent create a key with `create_bucket_key` and use an S3 tool.'),
    'registry': ('Container registry tools (registry)', 'The `registry` toolset manages [container registry](/container-registry/overview) projects, their repositories and images, registry tokens, retention policies and tag immutability rules. Images live at `registry.cloider.com/<project>/<repository>:<tag>`.'),
    'apps': ('App tools (apps)', 'The `apps` toolset deploys and runs [apps](/apps/overview): deploy a directory from the machine the MCP server runs on, create an app from a GitHub, GitLab or Bitbucket repository, follow builds, read logs, manage environment variables, build args and build environments, run commands in the app\'s container, and pause, resume or delete apps. `deploy_app` and `create_app_from_git` follow the build until the app is up, reporting progress as they go, unless `detach` is set.'),
    'domains': ('Domain, DNS and target tools (domains)', 'The `domains` toolset claims free `cloider.app` subdomains, adds custom domains, manages a custom domain\'s [DNS records](/domains/dns-records), and routes paths of a domain to an app or a cluster Service with [targets](/domains/targets). A custom domain comes with an ALIAS record for the domain itself that points at Cloider, but a target doesn\'t add records, so routing a subdomain such as www usually takes a `create_dns_record` too, see [Add a custom domain](/domains/add-a-custom-domain).\n\nThere is no tool that lists a domain\'s targets. Keep the id from `create_domain_target`\'s answer, or list them with `cloider target list <domain> -o wide`.'),
    'support': ('Support tools (support)', 'The `support` toolset reads and writes [support requests](/account/support): list and read them, open a new one, reply, and download attachments. Attachments are read from and saved to the machine the MCP server runs on.'),
}

head = '''---
title: Cloider MCP tools reference
sidebar_label: Tools reference
sidebar_position: 3
description: Every tool of the Cloider MCP server, by toolset, with its parameters, types, required fields, effect, idempotency, annotations and the CLI command it runs.
keywords: [cloider mcp tools, mcp tool reference, cloider mcp server tools, mcp tool annotations, readOnlyHint, destructiveHint, cluster_exec, deploy_app, create_database mcp]
---

This page lists every tool the Cloider MCP server (`cloider mcp`) offers, grouped by toolset. For each tool you get the description the AI agent sees, its parameters with their types and whether they are required, what kind of change it makes, whether repeating it is safe, the MCP annotations your client uses to decide when to ask you first, and the [`cloider` CLI](/cli/overview) command it runs. Setting the server up is covered in [Set up the MCP server](/mcp/setup).

## At a glance

| Toolset | Tools | Read only | Changes resources | Destructive |
| --- | --- | --- | --- | --- |
@@COUNTS@@

- **Read only** tools change nothing. They are the only tools `cloider mcp --read-only` offers.
- **Changes resources** tools create or update something but don't delete anything.
- **Destructive** tools delete or replace something, or run arbitrary commands (the three exec tools), and carry `destructiveHint`.
- Pick toolsets with `cloider mcp --toolsets account,apps,...`. See [Safety and permissions](/mcp/safety-and-permissions).

## How to read this reference

Each tool has a table like this:

| Column | Meaning |
| --- | --- |
| **Effect** | **Read only**, **Changes resources** or **Destructive** |
| **Idempotent** | **Yes** when calling it again with the same arguments changes nothing more, so a client may retry it safely |
| **Annotations** | The MCP tool annotations set to `true`: `readOnlyHint`, `destructiveHint`, `idempotentHint`. `openWorldHint` is `false` on every tool, because the tools only reach your Cloider account |
| **Runs** | The CLI command the tool runs, linked to its reference |

And a parameter table. Parameter names are the exact JSON keys of the tool's arguments. Types are JSON schema types: `object` parameters take `{"KEY": "value"}` maps of strings, and the JSON parameters (`policy`, `rules`) take a JSON document. The server is lenient where models tend to slip: a number sent as a string, `"true"` for a boolean, or one string where a list is expected are all accepted. An unknown parameter fails with `unknown argument "<name>", <tool> takes: ...`, and a missing required one with `<name> is required`.

## Behavior every tool shares

- **Names or ids.** Every resource parameter (`cluster`, `database`, `bucket`, `project`, `app`) takes the resource's name or its id, the same as the CLI.
- **Answers are JSON.** A tool answers with the command's JSON output, compacted, followed by anything the command printed as notes (its success line and any warnings). Output over 1 MiB is cut, keeping the start, or for logs the end. A tool whose command prints nothing answers `Done.`
- **Errors** come back as a failed tool call with the command's error message, for example the API's validation message, so the agent can correct its arguments and try again.
- **Waiting.** Tools that create, pause, resume or delete something take `wait`. Without it they return while the change is under way, and the matching `get_*` tool shows the status. With `wait: true` they wait up to 15 minutes.
- **Progress.** When the client asks for progress (by sending a `progressToken` with the call), the lines the command prints while it runs are sent as MCP progress notifications, at most one a second, with a heartbeat every 15 seconds when nothing is printed. A client can then show a deploy's build as it happens.
- **No prompts.** Commands run with `--yes`, so nothing asks for confirmation inside the tool. Asking you is your MCP client's job, guided by the annotations.
- **Local files.** Paths (`dir`, `paths`, `dest`, `file`, `attachments`) are on the machine the MCP server runs on, which is usually your computer.
- **Concurrency.** At most 4 tool commands run at once, to stay inside the API's rate limit of 100 requests a minute.
- **Cancelling** a tool call from the client stops its command, as Ctrl-C would.
'''

counts = []
total = Counter()
for ts, items in by.items():
    c = Counter(t['effect'] for t in items)
    total.update(c)
    counts.append('| [`%s`](#%s) | %d | %d | %d | %d |' % (ts, None, len(items), c['read'], c['write'], c['delete']))
anchor = {
    'account': 'account-tools-account', 'clusters': 'kubernetes-cluster-tools-clusters', 'databases': 'database-tools-databases',
    'buckets': 'object-storage-tools-buckets', 'registry': 'container-registry-tools-registry', 'apps': 'app-tools-apps',
    'domains': 'domain-dns-and-target-tools-domains', 'support': 'support-tools-support',
}
counts = [c.replace('(#None)', '(#%s)' % anchor[ts]) for c, ts in zip(counts, by.keys())]
counts.append('| **All** | **%d** | **%d** | **%d** | **%d** |' % (len(tools), total['read'], total['write'], total['delete']))
head = head.replace('@@COUNTS@@', '\n'.join(counts))

body = frag
for ts in by:
    title, text = INTRO[ts]
    names = ', '.join('`%s`' % t['name'] for t in by[ts])
    body = body.replace('@@TOOLSET:%s@@' % ts, '## %s\n\n%s\n\nTools: %s.\n' % (title, text, names))

tail = '''
## Commands that have no tool

Some CLI commands are interactive or only make sense in a terminal, so `cloider mcp` doesn't offer them: `cloider cluster shell`, `cloider db shell`, `cloider app shell`, `cloider db connect`, `cloider login`, `cloider logout`, `cloider profile`, `cloider update`, `cloider app open`, `cloider app link` and `cloider registry login`. Adding members, changing roles and creating or revoking API tokens aren't tools either, because the API only takes those from the dashboard.

## Next steps

- [Set up the MCP server](/mcp/setup) in your AI client
- [Safety and permissions](/mcp/safety-and-permissions): read only tokens, `--read-only`, toolsets and annotations
- [Example prompts](/mcp/example-prompts) and which tools each one calls
- [`cloider mcp` command reference](/cli/commands/mcp)

<FAQ items={[
  {q: 'How many tools does the Cloider MCP server have?', a: '119 tools in 8 toolsets: account, clusters, databases, buckets, registry, apps, domains and support. 51 of them only read, 41 create or change resources, and 27 are destructive, which includes the three exec tools.'},
  {q: 'Which Cloider MCP tools are destructive?', a: 'Every delete tool, the tools that replace a whole setting (bucket policy, lifecycle rules, retention rules), uploads (which overwrite files with the same key), unsetting app variables, untagging and running retention, disconnecting a git account, and the exec tools app_exec, cluster_exec and database_exec. They all carry destructiveHint, so clients ask before running them.'},
  {q: 'Can the MCP server show a database password?', a: 'Yes, with get_database_password, which is read only. get_database returns the connection details without the password, so a client can let the agent read connection details freely and still ask before it reads the password.'},
  {q: 'Can the agent deploy code from my computer?', a: 'Yes. deploy_app uploads a directory on the machine the MCP server runs on, given as an absolute path in dir, detects the language and port, and follows the build until the app is up.'},
  {q: 'How does an agent list a domain\\'s targets?', a: 'There is no MCP tool for that, and get_domain doesn\\'t include targets. create_domain_target answers with the new target and its id; to list existing ones, run cloider target list <domain> -o wide.'},
]} />
'''

open(dest, 'w').write(head + body + tail)
