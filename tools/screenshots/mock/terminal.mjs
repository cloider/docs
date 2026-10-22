// Stand-ins for the ttyd sessions the dashboard frames in an iframe. The real ones
// are xterm.js pages served by ttyd (fontSize 16, background #050d1b, see
// resource/apps/terminal/Dockerfile), so these are xterm.js too, printing a canned
// session instead of talking to a shell.

const ESC = '\x1b['
const c = (code, text) => `${ESC}${code}m${text}${ESC}0m`

const zshPrompt = (cmd = '') => `${c('1;32', '➜')}  ${c('1;36', '~')} ${cmd}`

const logo = [
  '      _       _     _           ',
  '  ___| | ___ (_) __| | ___ _ __ ',
  ' / __| |/ _ \\| |/ _` |/ _ \\ \'__|',
  '| (__| | (_) | | (_| |  __/ |   ',
  ' \\___|_|\\___/|_|\\__,_|\\___|_|   ',
]
const rainbow = ['31', '33', '32', '36', '34', '35']

function clusterSession() {
  const pad = ' '.repeat(18)
  const lines = [
    '',
    `${pad}Welcome to Cloider. Truly pay-as-you-go Kubernetes.`,
    ...logo.map((line, i) => pad + '         ' + c(`1;${rainbow[i % rainbow.length]}`, line)),
    `${pad}                All rights reserved`,
    '',
    zshPrompt('kubectl get nodes'),
    'NAME                 STATUS   ROLES    AGE   VERSION',
    'virtual-node-sk9d1   Ready    <none>   52d   v1.34.1',
    '',
    zshPrompt('kubectl get pods -n shop'),
    'NAME                          READY   STATUS    RESTARTS   AGE',
    'api-7d9c6b8f5-4kq2m           1/1     Running   0          3d2h',
    'api-7d9c6b8f5-x8vtn           1/1     Running   0          3d2h',
    'redis-0                       1/1     Running   0          12d',
    'web-6f4b9d7c8-2hmwp           1/1     Running   0          26h',
    'web-6f4b9d7c8-p9rzl           1/1     Running   0          26h',
    'worker-5c8d7f6b9-jx4nq        1/1     Running   1          5d7h',
    '',
    zshPrompt('kubectl get svc -n shop'),
    'NAME     TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)        AGE',
    'api      ClusterIP      10.43.112.18    <none>          80/TCP         21d',
    'redis    ClusterIP      10.43.40.207    <none>          6379/TCP       21d',
    'web      LoadBalancer   10.43.198.51    198.51.100.23   80:31480/TCP   21d',
    '',
    zshPrompt(''),
  ]
  return lines.join('\r\n')
}

function appSession(name) {
  const host = `${name}-6c9f7d8b5-q2xkp`
  const prompt = (cmd = '') => `${c('1;32', `app@${host}`)}:${c('1;34', '/workspace')}$ ${cmd}`
  return [
    prompt('ls'),
    `${c('1;34', 'app')}  ${c('1;34', 'node_modules')}  next.config.mjs  package.json  ${c('1;34', 'public')}  server.js`,
    prompt('node --version'),
    'v22.20.0',
    prompt('env | grep -E "^(NODE_ENV|PORT)="'),
    'NODE_ENV=production',
    'PORT=3000',
    prompt('curl -s localhost:3000/api/health'),
    '{"status":"ok","uptime":11523}',
    prompt(''),
  ].join('\r\n')
}

function databaseSession(engine, db, user) {
  if (engine == 'mysql') {
    return [
      'Welcome to the MySQL monitor.  Commands end with ; or \\g.',
      'Server version: 9.4.0 MySQL Community Server - GPL',
      '',
      'Type \'help;\' or \'\\h\' for help. Type \'\\c\' to clear the current input statement.',
      '',
      `mysql> SHOW TABLES;`,
      '+-------------------+',
      `| Tables_in_${db.replace('-', '_').padEnd(7)} |`,
      '+-------------------+',
      '| customers         |',
      '| order_items       |',
      '| orders            |',
      '| products          |',
      '+-------------------+',
      '4 rows in set (0.00 sec)',
      '',
      'mysql> ',
    ].join('\r\n')
  }
  if (engine == 'redis') {
    return ['127.0.0.1:6379> PING', 'PONG', '127.0.0.1:6379> DBSIZE', '(integer) 1284', '127.0.0.1:6379> '].join('\r\n')
  }
  if (engine == 'mongodb') {
    return [`${db}> show collections`, 'categories', 'products', 'reviews', `${db}> db.products.countDocuments()`, '4182', `${db}> `].join('\r\n')
  }
  return [
    'psql (18.0)',
    'Type "help" for help.',
    '',
    `${db}=> \\dt`,
    `          List of relations`,
    ' Schema |    Name     | Type  | Owner',
    '--------+-------------+-------+--------',
    ` public | customers   | table | ${user}`,
    ` public | order_items | table | ${user}`,
    ` public | orders      | table | ${user}`,
    ` public | payments    | table | ${user}`,
    '(4 rows)',
    '',
    `${db}=> SELECT status, count(*) FROM orders GROUP BY status;`,
    '  status   | count',
    '-----------+-------',
    ' delivered | 18342',
    ' pending   |    57',
    ' shipped   |   412',
    '(3 rows)',
    '',
    `${db}=> `,
  ].join('\r\n')
}

export function terminalSession(kind, name, query) {
  if (kind == 'cluster') return clusterSession()
  if (kind == 'app') return appSession(name)
  return databaseSession(query.get('engine') ?? 'postgresql', name, query.get('user') ?? name)
}

export function terminalPage(kind, name, query) {
  const session = JSON.stringify(terminalSession(kind, name, query))
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>ttyd - Terminal</title>
<link rel="stylesheet" href="/__mock/xterm/xterm.css">
<style>
  html, body { margin: 0; height: 100%; background: #050d1b; overflow: hidden; }
  #terminal { position: absolute; inset: 5px; }
</style>
</head>
<body>
<div id="terminal"></div>
<script src="/__mock/xterm/xterm.js"></script>
<script>
  const term = new Terminal({
    fontSize: 16,
    fontFamily: 'Consolas, Liberation Mono, Menlo, Courier, monospace',
    cursorBlink: false,
    theme: { background: '#050d1b', foreground: '#d2d2d2', cursor: '#adadad' },
  })
  term.open(document.getElementById('terminal'))
  // fit by hand: the addon would be one more file to serve for two lines of maths
  const cell = term._core._renderService.dimensions.css.cell
  const box = document.getElementById('terminal').getBoundingClientRect()
  term.resize(Math.max(20, Math.floor(box.width / cell.width)), Math.max(5, Math.floor(box.height / cell.height)))
  term.write(${session})
  term.focus()
</script>
</body>
</html>`
}
