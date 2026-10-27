// Front door for the screenshot run. One origin serves the whole dashboard the
// way nginx does in production:
//   /api/*     the mock API below, with the prefix stripped (SSR calls it too,
//              through NUXT_INTERNAL_API_URL=http://host.docker.internal:<port>/api)
//   /__mock/*  avatars, fake terminals and upload targets
//   anything else, websocket upgrades included, is proxied to the Nuxt container
//
// Run on its own with `npm run mock` to click around at http://localhost:3210.

import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as fx from './fixtures.mjs'
import { terminalPage } from './terminal.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))

// Routes the dashboard asked for that nothing below answers. Printed as they come
// and summed up at the end of a run, they are the gaps to fill in fixtures.mjs.
export const unhandled = new Set()

// ---------- helpers ----------

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}
const ok = (res, body) => json(res, 200, body)
const notFound = (res, msg = 'Not found!') => json(res, 404, { errors: { _: [msg] } })

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString()
      try { resolve(raw ? JSON.parse(raw) : {}) } catch { resolve({}) }
    })
  })
}

function cookies(req) {
  return Object.fromEntries((req.headers.cookie ?? '').split(';').map(s => s.trim().split('=')).filter(p => p[0]))
}

// "anonymous" without the cookie, so the sign in shots see the logged out site
function sessionVariant(req) {
  return cookies(req).shots_session ?? 'anonymous'
}

const byId = (list, id) => list.find(item => item.hashed_id == id)

// shots_ready=1 runs every database, for the engine the demo otherwise holds paused
const databasesFor = (req) => cookies(req).shots_ready ? fx.databases.map(d => ({ ...d, status: 'Ready' })) : fx.databases

// A server-sent events stream that sends the text in a few chunks and then ends,
// the way the api streams build and app logs (api/controllers/appsController.go)
function sse(res, text, { end = true } = {}) {
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' })
  const lines = text.split('\n')
  const step = Math.ceil(lines.length / 4)
  let i = 0
  const timer = setInterval(() => {
    const chunk = lines.slice(i, i + step).join('\n') + (i + step < lines.length ? '\n' : '')
    // one data line per text line, which EventSource joins back with \n
    res.write(chunk.split('\n').map(l => `data: ${l}`).join('\n') + '\n\n')
    i += step
    if (i >= lines.length) {
      clearInterval(timer)
      if (end) {
        res.write('event: end\ndata: \n\n')
        res.end()
      }
    }
  }, 60)
  res.on('close', () => clearInterval(timer))
}

// Staged app sources. An upload sits in Detecting for a while, so the upload shot
// can catch the drop zone at work, an import is detected straight away.
const sources = new Map()
let sourceSeq = 0

// ---------- routes ----------

const routes = []
const route = (method, pattern, handler) => {
  const keys = []
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)' }) + '$')
  routes.push({ method, re, keys, handler })
}

// session
route('GET', '/session', (req, res) => ok(res, fx.session(sessionVariant(req))))
route('GET', '/whoami', (req, res) => {
  const s = fx.session('jane')
  ok(res, { user: s.user, account: s.account, role: s.role, token: null })
})
route('POST', '/auth/select-account', (req, res) => ok(res, fx.session('jane')))
route('POST', '/auth/refresh', (req, res) => ok(res, {}))
route('POST', '/auth/logout', (req, res) => ok(res, {}))
route('GET', '/dashboard', (req, res) => ok(res, { clusters_count: fx.clusters.length }))
route('GET', '/pricing', (req, res) => ok(res, fx.pricing))
route('GET', '/options', (req, res) => ok(res, fx.options))

// access control
route('GET', '/members', (req, res) => ok(res, fx.members))
route('POST', '/members', (req, res) => ok(res, fx.members))
route('PUT', '/members/role', (req, res) => ok(res, fx.members))
route('PUT', '/members/active', (req, res) => ok(res, fx.members))
route('DELETE', '/members', (req, res) => ok(res, fx.members))
route('GET', '/api-tokens', (req, res) => ok(res, fx.apiTokens))
route('POST', '/api-tokens', async (req, res) => {
  const body = await readBody(req)
  ok(res, {
    api_token: {
      hashed_id: 't9z4c', description: body.description ?? '', read_only: !!body.read_only, creator: fx.jane,
      last_used_at: null, created_at: fx.NOW.toISOString(),
    },
    token: fx.newApiToken,
  })
})
route('PUT', '/api-tokens/:id', (req, res) => ok(res, fx.apiTokens))
route('DELETE', '/api-tokens/:id', (req, res) => ok(res, fx.apiTokens))

// apps
route('GET', '/apps', (req, res) => ok(res, fx.apps))
route('POST', '/apps', (req, res) => ok(res, { hashed_id: 'n4v7s', build_hashed_id: 'bd40', version: 'v1' }))
route('POST', '/apps/source', async (req, res) => {
  const token = `src${++sourceSeq}`
  sources.set(token, { kind: 'upload', at: Date.now() })
  ok(res, { token, presigned_url: `/__mock/upload/${token}` })
})
route('POST', '/apps/source/github', (req, res) => {
  const token = `src${++sourceSeq}`
  sources.set(token, { kind: 'git', at: Date.now() })
  ok(res, { token })
})
route('POST', '/apps/source/:token/detect', (req, res) => ok(res, {}))
route('GET', '/apps/source/:token', (req, res, p) => {
  const source = sources.get(p.token) ?? { kind: 'upload', at: 0 }
  const holdMs = Number(process.env.SHOTS_UPLOAD_DETECT_MS ?? 30000)
  if (source.kind == 'upload' && Date.now() - source.at < holdMs) {
    return ok(res, { ...fx.detection('upload'), status: 'Detecting', language: '', framework: '', port: 0, app_name: '' })
  }
  ok(res, fx.detection(source.kind))
})
route('GET', '/apps/:id', (req, res, p) => byId(fx.apps, p.id) ? ok(res, byId(fx.apps, p.id)) : notFound(res))
route('GET', '/apps/:id/status', (req, res, p) => ok(res, byId(fx.apps, p.id)?.status ?? 'Terminated'))
route('GET', '/apps/:id/usage', (req, res, p) => {
  const usage = fx.usage().apps.find(a => a.hashed_id == p.id)
  usage ? ok(res, usage) : notFound(res)
})
route('POST', '/apps/:id/pause', (req, res) => ok(res, fx.apps))
route('POST', '/apps/:id/resume', (req, res) => ok(res, fx.apps))
route('DELETE', '/apps/:id', (req, res) => ok(res, fx.apps))
route('PUT', '/apps/:id/settings', (req, res) => ok(res, { applied: 'none' }))
for (const kind of ['env', 'build-env', 'build-args']) {
  route('GET', `/apps/:id/${kind}`, (req, res) => ok(res, fx.appEnv[kind]))
  route('PUT', `/apps/:id/${kind}`, (req, res) => ok(res, kind == 'env' ? {} : { applied: 'none' }))
  route('GET', `/apps/:id/${kind}/value`, (req, res) => ok(res, 'postgresql://blog:••••••@orders-db-o2r6p.db.cloider.internal:5432/orders-db'))
}
route('GET', '/apps/:id/builds', (req, res, p) => ok(res, fx.builds[p.id] ?? []))
route('GET', '/apps/:id/builds/:build/logs', (req, res) => ok(res, fx.buildLog))
route('GET', '/apps/:id/builds/:build/logs/stream', (req, res) => sse(res, fx.buildLog.split('\n').slice(0, 30).join('\n'), { end: false }))
route('GET', '/apps/:id/logs/stream', (req, res) => sse(res, fx.appLogLines(), { end: false }))
route('GET', '/apps/:id/terminal', (req, res, p) => ok(res, { url: `/__mock/terminal/app/${byId(fx.apps, p.id)?.app_name ?? 'app'}` }))
route('POST', '/apps/:id/terminal/wake', (req, res) => ok(res, {}))
route('POST', '/apps/:id/terminal/heartbeat', (req, res) => ok(res, {}))
route('PUT', '/apps/:id/git', (req, res) => ok(res, {}))

// git
for (const [provider, slug] of [['GitHub', 'github'], ['GitLab', 'gitlab'], ['Bitbucket', 'bitbucket']]) {
  route('GET', `/git/${slug}/installations`, (req, res) => ok(res, fx.gitInstallations[provider]))
  route('GET', `/git/${slug}/installations/:id/repos`, (req, res) => ok(res, fx.gitRepos))
  route('GET', `/git/${slug}/installations/:id/branches`, (req, res) => ok(res, fx.gitBranches))
}

// clusters
route('GET', '/clusters', (req, res) => ok(res, fx.clusters))
route('POST', '/clusters', (req, res) => ok(res, { hashed_id: 's4k9d' }))
route('GET', '/clusters/services', (req, res) => ok(res, fx.clusterServices))
route('GET', '/clusters/:id/status', (req, res, p) => ok(res, byId(fx.clusters, p.id)?.status ?? 'Terminated'))
route('GET', '/clusters/:id/terminal', (req, res, p) => {
  const cluster = byId(fx.clusters, p.id)
  if (!cluster) return notFound(res)
  ok(res, { url: `/__mock/terminal/cluster/${cluster.cluster_name}`, cluster_slug: `${cluster.cluster_name}-${cluster.hashed_id}` })
})
route('POST', '/clusters/:id/pause', (req, res) => ok(res, fx.clusters))
route('POST', '/clusters/:id/resume', (req, res) => ok(res, fx.clusters))
route('DELETE', '/clusters/:id', (req, res) => ok(res, fx.clusters))
route('GET', '/usage', (req, res) => ok(res, fx.usage()))
route('GET', '/billing', (req, res) => ok(res, fx.bills))

// databases
const engineSlug = { PostgreSQL: 'postgresql', MySQL: 'mysql', Redis: 'redis', MongoDB: 'mongodb' }
route('GET', '/databases', (req, res) => ok(res, databasesFor(req)))
route('POST', '/databases', (req, res) => ok(res, { hashed_id: 'o2r6p' }))
route('GET', '/databases/:id', (req, res, p) => byId(databasesFor(req), p.id) ? ok(res, byId(databasesFor(req), p.id)) : notFound(res))
route('GET', '/databases/:id/status', (req, res, p) => ok(res, byId(databasesFor(req), p.id)?.status ?? 'Terminated'))
route('GET', '/databases/:id/insights', (req, res, p) => ok(res, fx.databaseInsights(p.id)))
route('GET', '/databases/:id/terminal', (req, res, p) => {
  const db = byId(fx.databases, p.id)
  if (!db) return notFound(res)
  ok(res, { url: `/__mock/terminal/database/${db.database_name}?engine=${engineSlug[db.service]}&user=${db.database_user}` })
})
route('POST', '/databases/:id/terminal/wake', (req, res) => ok(res, {}))
route('POST', '/databases/:id/terminal/heartbeat', (req, res) => ok(res, {}))
route('POST', '/databases/:id/pause', (req, res) => ok(res, fx.databases))
route('POST', '/databases/:id/resume', (req, res) => ok(res, fx.databases))
route('POST', '/databases/:id/restore', (req, res) => ok(res, { hashed_id: 'f6k1w', database_label: 'orders-db-fork' }))
route('DELETE', '/databases/:id', (req, res) => ok(res, fx.databases))
for (const field of ['trusted-sources', 'ssl', 'label', 'plan']) {
  route('PUT', `/databases/:id/${field}`, (req, res) => ok(res, {}))
}
route('GET', '/database/password', (req, res) => ok(res, 'demo-password-not-real'))
route('GET', '/database/cert', (req, res) => ok(res, '-----BEGIN CERTIFICATE-----\nDEMO\n-----END CERTIFICATE-----\n'))
route('GET', '/database/backups', (req, res) => ok(res, fx.databaseBackups()))
route('GET', '/databases/:id/pitr-window', (req, res) => ok(res, fx.pitrWindow()))

// buckets
route('GET', '/buckets', (req, res) => ok(res, fx.buckets))
route('GET', '/buckets/regions', (req, res) => ok(res, fx.bucketRegions))
route('POST', '/buckets', (req, res) => ok(res, { hashed_id: 'k6b2n' }))
route('GET', '/buckets/:id', (req, res, p) => byId(fx.buckets, p.id) ? ok(res, byId(fx.buckets, p.id)) : notFound(res))
route('GET', '/buckets/:id/status', (req, res, p) => ok(res, byId(fx.buckets, p.id)?.status ?? 'Terminated'))
route('GET', '/buckets/:id/usage', (req, res, p) => {
  const usage = fx.usage().buckets.find(b => b.hashed_id == p.id)
  usage ? ok(res, usage) : notFound(res)
})
route('DELETE', '/buckets/:id', (req, res) => ok(res, fx.buckets))
route('PUT', '/buckets/:id/visibility', (req, res) => ok(res, {}))
route('PUT', '/buckets/:id/policy', async (req, res) => ok(res, { policy: (await readBody(req)).policy ?? null }))
route('DELETE', '/buckets/:id/policy', (req, res) => ok(res, { policy: null }))
route('GET', '/buckets/:id/versioning', (req, res, p) => ok(res, { status: fx.bucketVersioning[p.id] ?? '' }))
route('PUT', '/buckets/:id/versioning', (req, res, p) => ok(res, { status: fx.bucketVersioning[p.id] ?? '' }))
route('GET', '/buckets/:id/lifecycle', (req, res, p) => ok(res, fx.bucketLifecycle[p.id] ?? { rules: [], unsupported_rules: 0 }))
route('PUT', '/buckets/:id/lifecycle', (req, res, p) => ok(res, fx.bucketLifecycle[p.id]))
route('GET', '/buckets/:id/objects', (req, res, p, q) => ok(res, fx.bucketListing(q.get('prefix') ?? '')))
route('GET', '/buckets/:id/objects/deleted', (req, res, p, q) => ok(res, fx.bucketDeleted(q.get('prefix') ?? '')))
route('GET', '/buckets/:id/objects/versions', (req, res, p, q) => ok(res, fx.bucketVersions(q.get('key'))))
route('GET', '/buckets/:id/objects/download', (req, res) => ok(res, { url: '/__mock/download' }))
route('POST', '/buckets/:id/objects/upload', (req, res) => ok(res, { url: '/__mock/upload/object' }))
route('POST', '/buckets/:id/objects/delete', (req, res) => ok(res, { failed: [] }))
route('POST', '/buckets/:id/objects/restore', (req, res) => ok(res, {}))
route('POST', '/buckets/:id/objects/versions/delete', (req, res) => ok(res, { failed: [] }))
route('POST', '/buckets/:id/folders', (req, res) => ok(res, {}))
route('GET', '/buckets/:id/cors', (req, res, p) => ok(res, { rules: fx.bucketCors[p.id] ?? [] }))
route('PUT', '/buckets/:id/cors', async (req, res) => ok(res, { rules: (await readBody(req)).rules ?? [] }))
route('GET', '/buckets/:id/website', (req, res, p) => byId(fx.buckets, p.id) ? ok(res, fx.bucketWebsite(byId(fx.buckets, p.id))) : notFound(res))
route('PUT', '/buckets/:id/website', async (req, res, p) => {
  const body = await readBody(req)
  const name = byId(fx.buckets, p.id)?.bucket_name ?? 'bucket'
  ok(res, { ...body, url: body.enabled ? `https://${name}.s3-website.eu-central-2.cloider.com` : '' })
})
route('GET', '/bucket-keys', (req, res) => ok(res, fx.bucketKeys))
route('POST', '/bucket-keys', async (req, res) => {
  const body = await readBody(req)
  ok(res, {
    key: {
      hashed_id: 'bk7z1', label: body.label ?? '', all_buckets: !!body.all_buckets, buckets: body.buckets ?? [],
      read_only: !!body.read_only, access_key: 'CLDRZ5N8Q1W4E7R2T6YU', status: 'Ready', created_at: fx.NOW.toISOString(),
    },
    secret_key: fx.newBucketSecret,
  })
})
route('PUT', '/bucket-keys/:id', (req, res) => ok(res, fx.bucketKeys))
route('DELETE', '/bucket-keys/:id', (req, res) => ok(res, fx.bucketKeys))

// registry
route('GET', '/registry/projects', (req, res) => ok(res, fx.registries))
route('GET', '/registry/projects/options', (req, res) => ok(res, fx.registryOptions))
route('POST', '/registry/projects', (req, res) => ok(res, { hashed_id: 'h5r2m' }))
route('GET', '/registry/projects/:id', (req, res, p) => byId(fx.registries, p.id) ? ok(res, byId(fx.registries, p.id)) : notFound(res))
route('GET', '/registry/projects/:id/status', (req, res, p) => ok(res, byId(fx.registries, p.id)?.status ?? 'Terminated'))
route('GET', '/registry/projects/:id/usage', (req, res, p) => {
  const usage = fx.usage().registry_projects.find(r => r.hashed_id == p.id)
  usage ? ok(res, usage) : notFound(res)
})
route('GET', '/registry/projects/:id/summary', (req, res, p) => {
  const registry = byId(fx.registries, p.id)
  ok(res, { repository_count: fx.registryRepositories.length, used_bytes: registry?.size_bytes ?? 0, limit_bytes: (registry?.storage_limit_gi ?? 10) * 1024 ** 3 })
})
route('DELETE', '/registry/projects/:id', (req, res) => ok(res, fx.registries))
route('PUT', '/registry/projects/:id/settings', (req, res, p) => ok(res, byId(fx.registries, p.id)))
route('GET', '/registry/projects/:id/repositories', (req, res) => ok(res, { repositories: fx.registryRepositories, total: fx.registryRepositories.length }))
route('GET', '/registry/projects/:id/artifacts', (req, res, p, q) => ok(res, fx.registryArtifacts(q.get('repository'))))
route('GET', '/registry/projects/:id/retention', (req, res) => ok(res, fx.registryRetention))
route('PUT', '/registry/projects/:id/retention/rules', (req, res) => ok(res, fx.registryRetention))
route('PUT', '/registry/projects/:id/retention/schedule', (req, res) => ok(res, fx.registryRetention))
route('GET', '/registry/projects/:id/retention/runs', (req, res) => ok(res, fx.registryRuns))
route('GET', '/registry/projects/:id/immutability', (req, res) => ok(res, fx.registryImmutability))
route('GET', '/registry/tokens', (req, res) => ok(res, fx.registryTokens))
route('POST', '/registry/tokens', async (req, res) => {
  const body = await readBody(req)
  ok(res, {
    token: { ...fx.registryTokens[0], hashed_id: 'rt2x7', label: body.label ?? '', created_at: fx.NOW.toISOString() },
    secret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  })
})

// domains
route('GET', '/domains', (req, res) => ok(res, fx.domains.map(d => ({ ...d, targets: fx.targets[d.domain_name] ?? [] }))))
route('POST', '/domains', async (req, res) => {
  const body = await readBody(req)
  ok(res, { domain_name: body.domain_name, domain_type: body.domain_type, status: 'Pending', created_at: fx.NOW.toISOString() })
})
route('GET', '/domains/availability', (req, res, p, q) => ok(res, { domain_name: q.get('domain_name'), available: true, reason: '' }))
route('GET', '/domains/:name', (req, res, p) => {
  const domain = fx.domains.find(d => d.domain_name == decodeURIComponent(p.name))
  domain ? ok(res, { ...domain, targets: fx.targets[domain.domain_name] ?? [] }) : notFound(res, 'Domain not found!')
})
route('DELETE', '/domains/:name', (req, res) => ok(res, fx.domains))
route('GET', '/domains/:name/dns-records', (req, res, p) => ok(res, fx.dnsRecords[decodeURIComponent(p.name)] ?? []))
route('POST', '/domains/:name/dns-records', async (req, res, p) => ok(res, { id: 4999, domain_name: p.name, ...(await readBody(req)) }))
route('GET', '/targets', (req, res, p, q) => ok(res, fx.targets[q.get('domain_name')] ?? []))
route('POST', '/targets', (req, res) => ok(res, { hashed_id: 'tg8z9', domain_name: '', message: 'Target created' }))

// support
route('GET', '/support', (req, res) => ok(res, fx.tickets))
route('GET', '/support/tickets/:id', (req, res, p) => {
  const ticket = byId(fx.tickets, p.id)
  ticket ? ok(res, { ticket, replies: fx.ticketReplies[p.id] ?? [] }) : notFound(res)
})
route('POST', '/support/tickets', (req, res) => ok(res, { request_id: 'tk9q4' }))

async function handleApi(req, res, pathname, query) {
  for (const r of routes) {
    if (r.method != req.method) continue
    const m = pathname.match(r.re)
    if (!m) continue
    const params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]))
    return r.handler(req, res, params, query)
  }
  const key = `${req.method} ${pathname}`
  if (!unhandled.has(key)) {
    unhandled.add(key)
    console.error(`\x1b[1;31m[mock] UNHANDLED ${key}\x1b[0m`)
  }
  notFound(res, `mock: no fixture for ${key}`)
}

// ---------- /__mock ----------

function avatarSvg(name) {
  const [initials, colour] = fx.avatars[name] ?? ['?', '#64748b']
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
<rect width="96" height="96" fill="${colour}"/>
<text x="48" y="50" dy=".35em" text-anchor="middle" font-family="Roboto, Helvetica, Arial, sans-serif" font-size="38" font-weight="500" fill="#fff">${initials}</text>
</svg>`
}

const xtermDir = path.join(here, '..', 'node_modules', '@xterm', 'xterm')

function handleMock(req, res, pathname, query) {
  let m
  if ((m = pathname.match(/^\/__mock\/avatar\/(\w+)\.svg$/))) {
    res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'max-age=3600' })
    return res.end(avatarSvg(m[1]))
  }
  if ((m = pathname.match(/^\/__mock\/terminal\/(cluster|app|database)\/([\w-]+)$/))) {
    // Late on purpose: the dashboard only sees an iframe's load event once it has
    // hydrated, and a real ttyd behind the terminal service is never this quick
    setTimeout(() => {
      res.writeHead(200, { 'content-type': 'text/html' })
      res.end(terminalPage(m[1], m[2], query))
    }, 1500)
    return
  }
  if (pathname == '/__mock/xterm/xterm.js' || pathname == '/__mock/xterm/xterm.css') {
    const file = pathname.endsWith('.js') ? 'lib/xterm.js' : 'css/xterm.css'
    res.writeHead(200, { 'content-type': pathname.endsWith('.js') ? 'text/javascript' : 'text/css' })
    return fs.createReadStream(path.join(xtermDir, file)).pipe(res)
  }
  // the capture checks this before anything else, see capture.mjs
  if (pathname == '/__mock/ping') {
    res.writeHead(200, { 'content-type': 'text/plain' })
    return res.end('cloider-docs-mock')
  }
  if (pathname.startsWith('/__mock/upload/')) {
    // drain the body so the browser sees a finished upload
    req.on('data', () => {})
    req.on('end', () => { res.writeHead(200); res.end() })
    return
  }
  res.writeHead(404)
  res.end()
}

// ---------- proxy to Nuxt ----------

function proxy(req, res, nuxt) {
  const upstream = http.request({
    host: nuxt.hostname, port: nuxt.port, method: req.method, path: req.url,
    headers: { ...req.headers, host: req.headers.host },
  }, (up) => {
    res.writeHead(up.statusCode ?? 502, up.headers)
    up.pipe(res)
  })
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502)
    res.end('Nuxt is not reachable')
  })
  req.pipe(upstream)
}

function proxyUpgrade(req, socket, head, nuxt) {
  const upstream = net.connect(Number(nuxt.port), nuxt.hostname, () => {
    const headers = Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n')
    upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${headers}\r\n\r\n`)
    if (head?.length) upstream.write(head)
    upstream.pipe(socket)
    socket.pipe(upstream)
  })
  upstream.on('error', () => socket.destroy())
  socket.on('error', () => upstream.destroy())
}

// tls: { key, cert } also serves the same thing over HTTPS on tlsPort, which is
// what the capture uses: Chrome resolves cloider.com to it, so the page's own
// origin, the one the dashboard prints into commands, reads https://cloider.com
export async function startServer({ port = 3210, nuxtUrl = 'http://127.0.0.1:3211', log = false, tls, tlsPort = 3443 } = {}) {
  const nuxt = new URL(nuxtUrl)
  const handler = async (req, res) => {
    const url = new URL(req.url, 'http://mock')
    if (log) console.log(`[mock] ${req.method} ${url.pathname}${url.search}`)
    try {
      if (url.pathname == '/api' || url.pathname.startsWith('/api/')) {
        return await handleApi(req, res, url.pathname.slice(4) || '/', url.searchParams)
      }
      if (url.pathname.startsWith('/__mock/')) return handleMock(req, res, url.pathname, url.searchParams)
      // routeRules redirects /oauth/** to the api, which would leave the demo
      if (url.pathname.startsWith('/oauth/')) return notFound(res)
      proxy(req, res, nuxt)
    } catch (err) {
      console.error('[mock] error', err)
      if (!res.headersSent) json(res, 500, { errors: { _: ['mock error'] } })
    }
  }

  const servers = [http.createServer(handler)]
  if (tls) servers.push(https.createServer(tls, handler))
  for (const server of servers) server.on('upgrade', (req, socket, head) => proxyUpgrade(req, socket, head, nuxt))

  await new Promise((resolve) => servers[0].listen(port, '0.0.0.0', resolve))
  if (tls) await new Promise((resolve) => servers[1].listen(tlsPort, '127.0.0.1', resolve))
  return { close: () => servers.forEach(s => s.close()) }
}

if (process.argv[1] && fileURLToPath(import.meta.url) == path.resolve(process.argv[1])) {
  const port = Number(process.env.SHOTS_PORT ?? 3210)
  await startServer({ port, nuxtUrl: process.env.SHOTS_NUXT_URL ?? 'http://127.0.0.1:3211', log: !!process.env.SHOTS_LOG })
  console.log(`mock listening on http://localhost:${port}`)
}
