// Demo data the mock API serves. Everything here is fictional: the Acme Inc
// universe the docs use (see docs/WRITING.md). Shapes follow web/composables/api/**.

// Every date is relative to this moment, and the browser clock is frozen on it too,
// so relative times ("3 days ago") and "today" in the charts stay put between runs.
export const NOW = new Date(process.env.SHOTS_NOW ?? '2026-10-20T15:30:00Z')

const DAY = 24 * 3600 * 1000

export function ago(days, hours = 0, minutes = 0) {
  // whole days get a time of day of their own, so a list doesn't read 3:30 PM on every row
  const jitter = days && !hours && !minutes ? ((days * 7919) % 540) * 60e3 : 0
  return new Date(NOW.getTime() - days * DAY - hours * 3600e3 - minutes * 60e3 - jitter).toISOString()
}

export function inDays(days) {
  return new Date(NOW.getTime() + days * DAY).toISOString()
}

// midnight UTC of a day relative to today, the way daily usage rows are dated
function dayDate(offset) {
  const d = new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), NOW.getUTCDate()) - offset * DAY)
  return d.toISOString()
}

// days of the current month so far, oldest first (1st .. today)
const monthDays = Array.from({ length: NOW.getUTCDate() }, (_, i) => NOW.getUTCDate() - 1 - i)

// a smooth but not flat series, deterministic so every run draws the same chart
function wave(i, base, spread, phase = 0) {
  return base + spread * (Math.sin(i * 0.9 + phase) * 0.6 + Math.sin(i * 0.37 + phase * 2) * 0.4)
}

const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d

// ---------- people ----------

export const avatar = (name) => `/__mock/avatar/${name}.svg`

export const jane = {
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@acme.example',
  picture: avatar('jane'),
}

export const people = {
  jane,
  sam: { first_name: 'Sam', last_name: 'Rivera', email: 'sam@acme.example', picture: avatar('sam') },
  priya: { first_name: 'Priya', last_name: 'Shah', email: 'priya@acme.example', picture: avatar('priya') },
  leo: { first_name: 'Leo', last_name: 'Martin', email: 'leo@acme.example', picture: avatar('leo') },
  acme: { first_name: 'Acme', last_name: 'Inc', email: 'ops@acme.example', picture: avatar('acme') },
  globex: { first_name: 'Globex', last_name: 'Labs', email: 'admin@globex.example', picture: avatar('globex') },
  agent: { first_name: 'Maya', last_name: 'Collins', picture: avatar('maya') },
}

// Avatar colours and initials, served as SVG by the mock
export const avatars = {
  jane: ['JD', '#0ea5e9'],
  sam: ['SR', '#8b5cf6'],
  priya: ['PS', '#f59e0b'],
  leo: ['LM', '#10b981'],
  acme: ['AI', '#ef4444'],
  globex: ['GL', '#14b8a6'],
  maya: ['MC', '#ec4899'],
  github: ['A', '#24292f'],
}

const userOf = (p, extra = {}) => ({
  ...p,
  plan: 'Paid',
  trial_end_date: null,
  suspended: false,
  ...extra,
})

// The signed in user is the owner of their own account. On the dashboard an
// account is the user that owns it, so it is Jane's account that holds the demo
// resources. She is also a member of two other accounts, which is what fills the
// account switcher.
export function session(variant) {
  if (variant == 'anonymous') {
    return { user: null, account: null, accounts: [], role: '', is_crm_agent: false, is_impersonating: false }
  }

  const user = userOf(jane, variant == 'trial' ? { plan: 'Free', trial_end_date: inDays(12).slice(0, 10) } : {})
  const accounts = [
    { ...people.acme, role: 'Admin', status: 'Active' },
    { ...people.globex, role: 'Restricted', status: 'Pending' },
  ]

  // "choose" is a session whose account is not picked yet: the Select an account screen
  return {
    user,
    account: variant == 'choose' ? null : user,
    accounts,
    role: 'Owner',
    is_crm_agent: false,
    is_impersonating: false,
  }
}

// ---------- access control ----------

export const members = [
  {
    account: jane, authorizer: jane, email: people.sam.email, user: people.sam,
    role: 'Admin', status: 'Active', created_at: ago(48), updated_at: ago(48),
  },
  {
    account: jane, authorizer: jane, email: people.priya.email, user: people.priya,
    role: 'Restricted', status: 'Active', created_at: ago(30), updated_at: ago(21),
  },
  {
    account: jane, authorizer: people.sam, email: people.leo.email, user: null,
    role: 'Restricted', status: 'Pending', created_at: ago(2, 3), updated_at: ago(2, 3),
  },
]

export const apiTokens = [
  {
    hashed_id: 't8k2m', description: 'GitHub Actions deploy', read_only: false, creator: jane,
    last_used_at: ago(0, 2, 14), created_at: ago(41),
  },
  {
    hashed_id: 't3p9x', description: 'Cloider CLI on janes-macbook', read_only: false, creator: jane,
    last_used_at: ago(0, 0, 38), created_at: ago(19),
  },
  {
    hashed_id: 't6w4r', description: 'Grafana dashboards', read_only: true, creator: people.sam,
    last_used_at: ago(0, 5), created_at: ago(33),
  },
  {
    hashed_id: 't1n7d', description: 'Terraform', read_only: false, creator: people.sam,
    last_used_at: null, created_at: ago(1, 4),
  },
]

// The value only ever shown once, right after it is generated (fictional)
export const newApiToken = 'cldr_xxxxxxxxxxxxxxxxxxxxxxxx'

// ---------- apps ----------

const blogImage = 'registry.cloider.com/jane-apps/blog-b7x2k:12'

export const apps = [
  {
    hashed_id: 'b7x2k', app_name: 'blog', app_label: 'blog', port: 3000, start_command: '',
    status: 'Ready', language: 'TypeScript', framework: 'Next.js',
    image_ref: blogImage, dockerfile_args: [], version: '12',
    url: 'https://blog-x7k2.cloider.app',
    domains: [
      { domain_name: 'blog-x7k2.cloider.app', domain_type: 'Subdomain' },
      { domain_name: 'example.com', domain_type: 'CustomDomain' },
    ],
    source_filename: 'blog.zip', source_size: 1843200, uploaded: true,
    repo_full_name: 'acme/blog', repo_url: 'https://github.com/acme/blog', repo_branch: 'main',
    git_provider: 'GitHub', auto_deploy: true, git_connected: true,
    created_at: ago(46),
  },
  {
    hashed_id: 'a9m4q', app_name: 'api', app_label: 'api', port: 8080, start_command: '',
    status: 'Building', language: 'Go', framework: '',
    image_ref: 'registry.cloider.com/jane-apps/api-a9m4q:7',
    dockerfile_args: [{ name: 'GO_VERSION', default: '1.25' }], version: '7',
    url: 'https://api-m2p9.cloider.app',
    domains: [{ domain_name: 'api-m2p9.cloider.app', domain_type: 'Subdomain' }],
    source_filename: 'api.zip', source_size: 524288, uploaded: true,
    repo_full_name: '', repo_url: '', repo_branch: '', git_provider: 'GitHub', auto_deploy: false, git_connected: false,
    created_at: ago(31),
  },
  {
    hashed_id: 'w3n8r', app_name: 'web', app_label: 'web', port: 8080, start_command: 'npm run start',
    status: 'Paused', language: 'JavaScript', framework: 'Express',
    image_ref: 'registry.cloider.com/jane-apps/web-w3n8r:5', dockerfile_args: [], version: '5',
    url: 'https://web-q4m8.cloider.app',
    domains: [{ domain_name: 'web-q4m8.cloider.app', domain_type: 'Subdomain' }],
    source_filename: 'web.zip', source_size: 3355443, uploaded: true,
    repo_full_name: '', repo_url: '', repo_branch: '', git_provider: 'GitHub', auto_deploy: false, git_connected: false,
    created_at: ago(24),
  },
]

const commits = [
  ['9f3c2a7d41e8b6f0c5a2d9e7b1f4a8c3d6e2b5f1', 'Add RSS feed for the engineering posts'],
  ['4b8e1d6a2c9f7e3b5d0a8c6f2e4b1d7a9c3e5f80', 'Fix pagination on the archive page'],
  ['e2a7c5f9b3d1e8a6c4f2b0d9e7a5c3f1b8d6e4a2', 'Update Next.js to 15.5'],
  ['7c1f4e9a2b6d8c3e5a0f7b9d1c4e6a8f2b5d3e97', 'New author pages'],
  ['a5d3b8e1c7f2a9d4e6b0c8f3a1d5e7b9c2f4a6d8', 'Tweak image sizes for faster loads'],
]

function build(i, fields) {
  return {
    hashed_id: `bd${i}`, attempt: 1, source_filename: 'blog.zip', source_size: 1843200,
    commit_sha: '', commit_message: '', image_ref: '', message: '',
    ...fields,
  }
}

export const builds = {
  b7x2k: [
    build(12, {
      version: '12', status: 'Ready', commit_sha: commits[0][0], commit_message: commits[0][1],
      image_ref: blogImage, started_at: ago(0, 3, 12), finished_at: ago(0, 3, 10), created_at: ago(0, 3, 12),
    }),
    build(11, {
      version: '11', status: 'Superseded', commit_sha: commits[1][0], commit_message: commits[1][1],
      image_ref: 'registry.cloider.com/jane-apps/blog-b7x2k:11', started_at: ago(2, 6), finished_at: ago(2, 5, 58), created_at: ago(2, 6),
    }),
    build(10, {
      version: '10', status: 'Failed', attempt: 2, commit_sha: commits[2][0], commit_message: commits[2][1],
      message: 'npm run build exited with code 1', started_at: ago(4, 1), finished_at: ago(4, 0, 59), created_at: ago(4, 1, 2),
    }),
    build(9, {
      version: '9', status: 'Superseded', commit_sha: commits[3][0], commit_message: commits[3][1],
      image_ref: 'registry.cloider.com/jane-apps/blog-b7x2k:9', started_at: ago(7, 2), finished_at: ago(7, 1, 57), created_at: ago(7, 2),
    }),
    build(8, {
      version: '8', status: 'Superseded', commit_sha: commits[4][0], commit_message: commits[4][1],
      image_ref: 'registry.cloider.com/jane-apps/blog-b7x2k:8', started_at: ago(11, 5), finished_at: ago(11, 4, 58), created_at: ago(11, 5),
    }),
  ],
  a9m4q: [
    build(28, {
      version: '8', status: 'Building', source_filename: 'api.zip', source_size: 530432,
      started_at: ago(0, 0, 1), finished_at: null, created_at: ago(0, 0, 2),
    }),
    build(27, {
      version: '7', status: 'Ready', source_filename: 'api.zip', source_size: 524288,
      image_ref: 'registry.cloider.com/jane-apps/api-a9m4q:7', started_at: ago(1, 4), finished_at: ago(1, 3, 58), created_at: ago(1, 4),
    }),
  ],
  w3n8r: [
    build(35, {
      version: '5', status: 'Ready', source_filename: 'web.zip', source_size: 3355443,
      image_ref: 'registry.cloider.com/jane-apps/web-w3n8r:5', started_at: ago(9, 2), finished_at: ago(9, 1, 57), created_at: ago(9, 2),
    }),
  ],
}

export const appEnv = {
  env: [
    { key: 'NODE_ENV', value: 'production', secret: false },
    { key: 'NEXT_PUBLIC_SITE_URL', value: 'https://example.com', secret: false },
    { key: 'DATABASE_URL', value: null, secret: true },
    { key: 'LOG_LEVEL', value: 'info', secret: false },
  ],
  'build-env': [
    { key: 'NEXT_TELEMETRY_DISABLED', value: '1', secret: false },
  ],
  'build-args': [],
}

export const buildLog = [
  '\x1b[1;36m==> Fetching acme/blog@9f3c2a7 (main)\x1b[0m',
  'Archive downloaded, 1.8 MB',
  '\x1b[1;36m==> Detected TypeScript (Next.js), building with buildpacks\x1b[0m',
  '===> ANALYZING',
  'Image with name "registry.cloider.com/jane-apps/blog-b7x2k:12" not found',
  '===> DETECTING',
  '3 of 5 buildpacks participating',
  'paketo-buildpacks/node-engine 4.1.12',
  'paketo-buildpacks/npm-install 1.5.4',
  'paketo-buildpacks/node-start  1.1.10',
  '===> RESTORING',
  'Restoring metadata for "paketo-buildpacks/npm-install:modules" from cache',
  '===> BUILDING',
  '',
  'Paketo Buildpack for Node Engine 4.1.12',
  '  Resolving Node Engine version',
  '    Selected Node Engine version (using package.json -> engines.node): 22.20.0',
  '  Reusing cached layer /layers/paketo-buildpacks_node-engine/node',
  '',
  'Paketo Buildpack for NPM Install 1.5.4',
  '  Resolving installation process',
  '    Process inputs:',
  '      package-lock.json -> Found',
  '    Selected NPM build process: \'npm ci\'',
  '  Executing launch environment install process',
  '    Running \'npm ci --unsafe-perm --cache /layers/paketo-buildpacks_npm-install/npm-cache\'',
  '      added 412 packages, and audited 413 packages in 9s',
  '      found 0 vulnerabilities',
  '',
  '> blog@1.0.0 build',
  '> next build',
  '',
  '   \x1b[1m▲ Next.js 15.5.4\x1b[0m',
  '',
  '   Creating an optimized production build ...',
  ' \x1b[32m✓\x1b[0m Compiled successfully in 21.4s',
  ' \x1b[32m✓\x1b[0m Linting and checking validity of types',
  ' \x1b[32m✓\x1b[0m Collecting page data',
  ' \x1b[32m✓\x1b[0m Generating static pages (48/48)',
  ' \x1b[32m✓\x1b[0m Finalizing page optimization',
  '',
  'Route (app)                              Size     First Load JS',
  '┌ ○ /                                    6.1 kB          112 kB',
  '├ ○ /archive                             2.3 kB          108 kB',
  '├ ● /posts/[slug]                        4.8 kB          111 kB',
  '└ ○ /rss.xml                             0 B                0 B',
  '',
  '===> EXPORTING',
  'Adding layer \'paketo-buildpacks/node-engine:node\'',
  'Adding layer \'paketo-buildpacks/npm-install:modules\'',
  'Saving registry.cloider.com/jane-apps/blog-b7x2k:12...',
  '*** Images (sha256:4c1d9e7a2b8f):',
  '      registry.cloider.com/jane-apps/blog-b7x2k:12',
  '\x1b[1;36m==> Deploying version 12\x1b[0m',
  'Rolling out 1 replica',
  'Waiting for the new version to pass its health check on port 3000',
  '\x1b[1;32m==> Version 12 is live at https://blog-x7k2.cloider.app\x1b[0m',
  '',
].join('\n')

// what the Logs tab tails off the running app
export function appLogLines(count = 40) {
  const paths = [
    ['GET', '/', 200, 18], ['GET', '/posts/shipping-faster-with-preview-deploys', 200, 34],
    ['GET', '/_next/static/chunks/app/page-4c1d9e7a.js', 200, 3], ['GET', '/rss.xml', 200, 12],
    ['GET', '/archive?page=2', 200, 27], ['GET', '/posts/postgres-tuning-notes', 200, 41],
    ['GET', '/favicon.ico', 200, 1], ['HEAD', '/', 200, 6], ['GET', '/api/health', 200, 2],
    ['GET', '/posts/we-moved-to-kubernetes', 200, 38], ['GET', '/wp-login.php', 404, 4],
    ['POST', '/api/newsletter', 201, 96], ['GET', '/authors/jane-doe', 200, 22],
  ]
  const lines = [
    '   \x1b[1m▲ Next.js 15.5.4\x1b[0m',
    '   - Local:        http://localhost:3000',
    '   - Network:      http://0.0.0.0:3000',
    '',
    ' \x1b[32m✓\x1b[0m Starting...',
    ' \x1b[32m✓\x1b[0m Ready in 412ms',
  ]
  let t = NOW.getTime() - count * 4100
  for (let i = 0; i < count; i++) {
    const [method, path, status, ms] = paths[(i * 7) % paths.length]
    t += 3000 + ((i * 1733) % 2400)
    const ts = new Date(t).toISOString()
    const colour = status >= 400 ? '\x1b[33m' : '\x1b[32m'
    lines.push(`${ts} ${method.padEnd(4)} ${path} ${colour}${status}\x1b[0m ${ms + (i % 5)}ms`)
  }
  return lines.join('\n') + '\n'
}

// ---------- git ----------

export const gitInstallations = {
  GitHub: {
    configured: true,
    install_url: 'https://github.com/apps/cloider/installations/new',
    installations: [{
      hashed_id: 'g4h7k', provider: 'GitHub', account_login: 'acme', account_type: 'Organization',
      avatar_url: avatar('github'), suspended_at: null, created_at: ago(60),
    }],
  },
  GitLab: { configured: true, install_url: 'https://gitlab.com/-/profile/applications', installations: [] },
  Bitbucket: { configured: true, install_url: 'https://bitbucket.org/account/settings/app-authorizations/', installations: [] },
}

export const gitRepos = {
  repos: [
    { id: 701, name: 'blog', full_name: 'acme/blog', html_url: 'https://github.com/acme/blog', private: false, default_branch: 'main', language: 'TypeScript', pushed_at: ago(0, 3) },
    { id: 702, name: 'storefront', full_name: 'acme/storefront', html_url: 'https://github.com/acme/storefront', private: true, default_branch: 'main', language: 'TypeScript', pushed_at: ago(1, 2) },
    { id: 703, name: 'api', full_name: 'acme/api', html_url: 'https://github.com/acme/api', private: true, default_branch: 'main', language: 'Go', pushed_at: ago(0, 6) },
    { id: 704, name: 'docs', full_name: 'acme/docs', html_url: 'https://github.com/acme/docs', private: false, default_branch: 'main', language: 'MDX', pushed_at: ago(3) },
    { id: 705, name: 'billing-worker', full_name: 'acme/billing-worker', html_url: 'https://github.com/acme/billing-worker', private: true, default_branch: 'main', language: 'Python', pushed_at: ago(8) },
    { id: 706, name: 'infra', full_name: 'acme/infra', html_url: 'https://github.com/acme/infra', private: true, default_branch: 'main', language: 'HCL', pushed_at: ago(12) },
  ],
  truncated: false,
}

export const gitBranches = [
  { name: 'main', commit: { sha: commits[0][0] } },
  { name: 'develop', commit: { sha: commits[1][0] } },
  { name: 'feature/newsletter', commit: { sha: commits[3][0] } },
]

// What a staged source turns into once "detected". An import carries the git half.
export function detection(kind) {
  if (kind == 'git') {
    return {
      status: 'Done', app_name: 'blog', language: 'TypeScript', framework: 'Next.js', port: 3000, message: '',
      build_args: [],
      git: {
        provider: 'GitHub', repo_full_name: 'acme/blog', repo_url: 'https://github.com/acme/blog', branch: 'main',
        commit_sha: commits[0][0], commit_message: commits[0][1],
      },
    }
  }
  return {
    status: 'Done', app_name: 'shop', language: 'JavaScript', framework: 'Express', port: 8080, message: '',
    build_args: [],
  }
}

// ---------- clusters ----------

export const clusters = [
  { hashed_id: 's4k9d', cluster_name: 'staging', cluster_label: 'staging', cluster_version: '1.34', is_ha: false, status: 'Ready', created_at: ago(52) },
  { hashed_id: 'p8t2v', cluster_name: 'production', cluster_label: 'production', cluster_version: '1.34', is_ha: false, status: 'Ready', created_at: ago(88) },
  { hashed_id: 'x5h7c', cluster_name: 'sandbox', cluster_label: 'sandbox', cluster_version: '1.33', is_ha: false, status: 'Paused', created_at: ago(140) },
]

export const clusterServices = [
  {
    id: 'p8t2v', name: 'production',
    services: [
      { service: 'storefront', namespace: 'shop', ports: [{ protocol: 'TCP', port: 80 }] },
      { service: 'api', namespace: 'shop', ports: [{ protocol: 'TCP', port: 80 }, { protocol: 'TCP', port: 9090 }] },
      { service: 'grafana', namespace: 'monitoring', ports: [{ protocol: 'TCP', port: 3000 }] },
    ],
  },
  {
    id: 's4k9d', name: 'staging',
    services: [
      { service: 'web', namespace: 'shop', ports: [{ protocol: 'TCP', port: 80 }] },
      { service: 'api', namespace: 'shop', ports: [{ protocol: 'TCP', port: 80 }] },
      { service: 'blog', namespace: 'blog', ports: [{ protocol: 'TCP', port: 80 }] },
    ],
  },
]

// ---------- databases ----------

const trusted = [
  { name: 'production', code: 'p8t2v', type: 'Cluster' },
  { name: 'blog', code: 'b7x2k', type: 'App' },
  { name: '203.0.113.24/32', code: '203.0.113.24/32', type: 'Custom' },
]
const anywhere = [{ name: 'Allow Everything', code: '*', type: 'Anywhere' }]

export const databases = [
  {
    hashed_id: 'o2r6p', database_name: 'orders-db', database_label: 'orders-db', database_user: 'orders',
    service: 'PostgreSQL', database_version: '18', database_plan: 'Standard', trusted_sources: trusted, ssl: true,
    status: 'Ready', created_at: ago(64), database_port: '5432',
  },
  {
    hashed_id: 'm7s3y', database_name: 'shop-db', database_label: 'shop-db', database_user: 'shop',
    service: 'MySQL', database_version: '9', database_plan: 'Basic', trusted_sources: anywhere, ssl: true,
    status: 'Ready', created_at: ago(40), database_port: '3306',
  },
  {
    hashed_id: 'c4g8z', database_name: 'catalog-db', database_label: 'catalog-db', database_user: 'catalog',
    service: 'MongoDB', database_version: '8', database_plan: 'Starter', trusted_sources: anywhere, ssl: false,
    status: 'Ready', created_at: ago(22), database_port: '27017',
  },
  {
    hashed_id: 'r9e5j', database_name: 'cache', database_label: 'cache', database_user: 'cache',
    service: 'Redis', database_version: '8', database_plan: 'Hobby', trusted_sources: anywhere, ssl: false,
    status: 'Paused', created_at: ago(15), database_port: '6379',
  },
]

// "YYYY-MM-DD_HH-MM" in UTC, newest first: one a day at 02:00 for two weeks
export function databaseBackups() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), NOW.getUTCDate() - i, 2, 0))
    return d.toISOString().slice(0, 16).replace('T', '_').replace(':', '-')
  })
}

// the range a fork can start from, earliest clamped to 14 days back like the api
export function pitrWindow() {
  const second = (iso) => iso.slice(0, 19) + 'Z'
  return { available: true, earliest: second(new Date(NOW.getTime() - 14 * DAY).toISOString()), latest: second(ago(0, 0, 1)) }
}

const insightStat = (avg, spread) => ({ avg: round(avg), max: round(avg + spread), min: round(Math.max(0, avg - spread)) })

export function databaseInsights(hashedId) {
  const daily = monthDays.map((offset, i) => {
    const date = dayDate(offset)
    return {
      date,
      stats: {
        cpu: insightStat(wave(i, 180, 60), 140),
        memory: insightStat(wave(i, 610, 80, 1), 120),
        storage: insightStat(1.6 + i * 0.03, 0.02),
        disk_read: insightStat(wave(i, 52000, 18000, 2), 90000),
        disk_write: insightStat(wave(i, 128000, 40000, 3), 210000),
        net_rx: insightStat(wave(i, 86000, 30000, 1.5), 160000),
        net_tx: insightStat(wave(i, 240000, 70000, 2.5), 420000),
        connections: insightStat(wave(i, 24, 8, 0.5), 18),
      },
    }
  })
  const monthStat = (key) => {
    const avg = daily.reduce((s, d) => s + d.stats[key].avg, 0) / daily.length
    const max = Math.max(...daily.map(d => d.stats[key].max))
    const min = Math.min(...daily.map(d => d.stats[key].min))
    return {
      avg: round(avg), max: round(max), min: round(min),
      max_date: daily.find(d => d.stats[key].max == max).date, min_date: daily.find(d => d.stats[key].min == min).date,
    }
  }
  const keys = ['cpu', 'memory', 'storage', 'disk_read', 'disk_write', 'net_rx', 'net_tx', 'connections']
  const last = daily.at(-1).stats
  return {
    date: NOW.toISOString(),
    month: NOW.toISOString().slice(0, 7),
    today: Object.fromEntries(keys.map(k => [k, last[k].avg])),
    connections_max: 100,
    month_stats: Object.fromEntries(keys.map(k => [k, monthStat(k)])),
    daily,
  }
}

// ---------- buckets ----------

// the one region there is (common/buckets)
export const bucketRegions = [
  { code: 'eu-central-2', name: 'Europe', endpoint: 'https://s3.eu-central-2.cloider.com' },
]

const s3Endpoint = bucketRegions[0].endpoint

// a bucket's own address is <bucket>.<endpoint host>, its website <bucket>.s3-website.<region>...
const bucketFields = (name, website) => ({
  region: 'eu-central-2', endpoint: s3Endpoint, url: `https://${name}.s3.eu-central-2.cloider.com`,
  website: !!website, website_index: website ? 'index.html' : '', website_error: website?.error ?? '',
  website_url: website ? `https://${name}.s3-website.eu-central-2.cloider.com` : '',
})

export const buckets = [
  {
    hashed_id: 'k6b2n', bucket_name: 'acme-assets', public: true, status: 'Ready',
    size_bytes: 4831838208, size_sampled_at: ago(0, 0, 4),
    ...bucketFields('acme-assets'),
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Sid: 'CiDeployWrite',
        Effect: 'Allow',
        Principal: { AWS: ['CLDRK7Q2M9X4P8VB3N6T'] },
        Action: ['s3:PutObject', 's3:DeleteObject'],
        Resource: ['arn:aws:s3:::acme-assets/releases/*'],
      }, {
        Sid: 'CiDeployOnlyFromOffice',
        Effect: 'Deny',
        Principal: { AWS: ['CLDRK7Q2M9X4P8VB3N6T'] },
        Action: ['s3:GetObject*', 's3:PutObject*', 's3:DeleteObject*', 's3:List*'],
        Resource: ['arn:aws:s3:::acme-assets', 'arn:aws:s3:::acme-assets/*'],
        Condition: { NotIpAddress: { 'aws:SourceIp': ['203.0.113.0/24'] } },
      }],
    }, null, 2),
    created_at: ago(70),
  },
  {
    hashed_id: 'q3w9d', bucket_name: 'acme-backups', public: false, status: 'Ready',
    size_bytes: 61203283968, size_sampled_at: ago(0, 0, 4),
    ...bucketFields('acme-backups'),
    policy: null, created_at: ago(58),
  },
  {
    hashed_id: 's3w8q', bucket_name: 'acme-site', public: true, status: 'Ready',
    size_bytes: 3355443, size_sampled_at: ago(0, 0, 4),
    ...bucketFields('acme-site', { error: '404.html' }),
    domains: [{ domain_name: 'acme-site.cloider.app', domain_type: 'Subdomain' }],
    policy: null, created_at: ago(12),
  },
]

// what GET /buckets/:id/website answers, off the bucket's own fields
export function bucketWebsite(bucket) {
  return { enabled: bucket.website, index_document: bucket.website_index, error_document: bucket.website_error, url: bucket.website_url }
}

// The rules as the dashboard lists them, the api leaves its own CloiderDashboard rule out
export const bucketCors = {
  k6b2n: [
    {
      id: 'app', allowed_origins: ['https://app.example.com'], allowed_methods: ['GET', 'PUT'],
      allowed_headers: ['Content-Type'], expose_headers: ['ETag'], max_age_seconds: 3600,
    },
    {
      id: 'local', allowed_origins: ['http://localhost:3000'], allowed_methods: ['GET', 'PUT'],
      allowed_headers: ['Content-Type'], expose_headers: [], max_age_seconds: 0,
    },
    {
      id: 'anyone-reads', allowed_origins: ['*'], allowed_methods: ['GET', 'HEAD'],
      allowed_headers: [], expose_headers: [], max_age_seconds: 0,
    },
  ],
}

export const bucketVersioning = { k6b2n: 'Enabled', q3w9d: 'Suspended', s3w8q: '' }

export const bucketLifecycle = {
  k6b2n: {
    rules: [
      { id: 'expire-old-releases', prefix: 'releases/', enabled: true, expire_days: 90, noncurrent_days: 30, abort_multipart_days: 7 },
    ],
    unsupported_rules: 0,
  },
  q3w9d: {
    rules: [
      { id: 'keep-30-days', prefix: '', enabled: true, expire_days: 30, noncurrent_days: 0, abort_multipart_days: 1 },
    ],
    unsupported_rules: 0,
  },
}

const MB = 1024 * 1024

// folder prefix -> listing
export const bucketObjects = {
  '': {
    folders: ['images/', 'fonts/', 'releases/', 'downloads/'],
    objects: [
      ['favicon.ico', 15086, 41], ['robots.txt', 312, 41], ['logo.svg', 4210, 12], ['manifest.json', 1288, 12],
      ['og-image.png', 284311, 6],
    ],
  },
  'images/': {
    folders: ['images/blog/', 'images/products/'],
    objects: [['images/hero.webp', 412300, 3], ['images/team.jpg', 1.9 * MB, 18], ['images/pattern.svg', 8610, 30]],
  },
  'releases/': {
    folders: [],
    objects: [
      ['releases/app-2.4.0.tar.gz', 38.2 * MB, 2], ['releases/app-2.3.1.tar.gz', 37.9 * MB, 16],
      ['releases/app-2.3.0.tar.gz', 37.6 * MB, 27], ['releases/checksums.txt', 712, 2],
    ],
  },
}

export function bucketListing(prefix) {
  const entry = bucketObjects[prefix] ?? { folders: [], objects: [] }
  return {
    prefix,
    folders: entry.folders.map(p => ({ prefix: p, name: p.slice(prefix.length, -1) })),
    objects: entry.objects.map(([key, size, days]) => ({
      key, name: key.slice(prefix.length), size: Math.round(size), last_modified: ago(days, 3, 12),
    })),
    next_token: '',
  }
}

export function bucketDeleted(prefix) {
  const list = {
    '': [['old-logo.png', 3, 'v-3f9a1c'], ['banner-2025.jpg', 9, 'v-8b2e4d']],
    'images/': [['images/hero-old.webp', 5, 'v-1c7f3a']],
  }[prefix] ?? []
  return {
    prefix,
    folders: prefix ? [] : [{ prefix: 'images/', name: 'images' }],
    objects: list.map(([key, days, marker]) => ({ key, name: key.slice(prefix.length), deleted_at: ago(days, 2), marker_version_id: marker })),
    next_token: '',
  }
}

export function bucketVersions(key) {
  const sizes = [284311, 279804, 301562, 276120]
  return {
    versions: sizes.map((size, i) => ({
      version_id: ['3HL4kqtJlcpXroDTDmJ+rmSpXd3dIbrHY', 'h7X9a2kq0Wv3uYcB5dE8fG1iJ4lM6nPq', 'Qm2v8Rk5Lp1sTz7Xb4Nc9Wd3Fh6Jy0Ga', 'Zt5Bn8Vc2Xm4Lk7Jh1Gf3Ds6Ap9Qw0Er'][i],
      size, last_modified: ago([6, 19, 33, 47][i], 4), is_latest: i == 0, delete_marker: false,
    })),
    truncated: false,
  }
}

export const bucketKeys = [
  {
    hashed_id: 'bk3m7', label: 'ci-deploy', all_buckets: false, buckets: ['k6b2n'], read_only: false,
    access_key: 'CLDRK7Q2M9X4P8VB3N6T', status: 'Ready', created_at: ago(44),
  },
  {
    hashed_id: 'bk8x2', label: 'nightly-backups', all_buckets: false, buckets: ['q3w9d'], read_only: false,
    access_key: 'CLDRP4W8Z2K6N1R5T9YM', status: 'Ready', created_at: ago(57),
  },
  {
    hashed_id: 'bk5q9', label: 'analytics-readonly', all_buckets: true, buckets: [], read_only: true,
    access_key: 'CLDRH2D6J9B3V7C1X5QL', status: 'Ready', created_at: ago(9),
  },
]

export const newBucketSecret = 'xXxxxXxxXXxxxXXxxxXxXXxxxxXXxxXXxxXXxxXx'

// ---------- registry ----------

export const registryOptions = { host: 'registry.cloider.com', default_storage_limit_gi: 10, max_storage_limit_gi: 100 }

export const registries = [
  {
    hashed_id: 'h5r2m', name: 'acme', public: false, storage_limit_gi: 20, immutable_tags: false, apps: false,
    status: 'Ready', size_bytes: 3328599654, size_sampled_at: ago(0, 0, 6),
    host: 'registry.cloider.com', url: 'registry.cloider.com/acme', username: 'jane',
    created_at: ago(36),
  },
  {
    hashed_id: 'y2j8f', name: 'jane-apps', public: false, storage_limit_gi: 20, apps: true,
    status: 'Ready', size_bytes: 1288490188, size_sampled_at: ago(0, 0, 6),
    host: 'registry.cloider.com', url: 'registry.cloider.com/jane-apps', username: 'jane',
    created_at: ago(46),
  },
]

export const registryRepositories = [
  { name: 'api', artifact_count: 14, pull_count: 312, created_at: ago(36), updated_at: ago(0, 5) },
  { name: 'web', artifact_count: 9, pull_count: 188, created_at: ago(35), updated_at: ago(1, 2) },
  { name: 'workers/mailer', artifact_count: 4, pull_count: 41, created_at: ago(20), updated_at: ago(6) },
]

const amd64 = { os: 'linux', architecture: 'amd64', variant: '' }
const arm64 = { os: 'linux', architecture: 'arm64', variant: 'v8' }

export function registryArtifacts(repository) {
  const tags = {
    api: [['v2.4.0', 'latest'], ['v2.3.1'], ['v2.3.0'], []],
    web: [['v1.9.2', 'latest'], ['v1.9.1'], ['v1.9.0']],
  }[repository] ?? [['v0.3.0', 'latest'], ['v0.2.0']]
  return {
    artifacts: tags.map((names, i) => ({
      digest: `sha256:${['4c1d9e7a2b8f6e3d0a5c9b7f1e4d8a2c6b0f3e9d7a1c5b8e2f4d6a0c9b3e7f1d', '9a7e3c1f5b8d2e6a0c4f7b9d1e3a5c8f2b6d0e4a7c9f1b3d5e8a2c6f0b4d7e9a', 'e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5', '2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a'][i]}`,
      tags: names.map(name => ({ name, pushed_at: ago(i * 6 + 1, 2), immutable: false })),
      size: [48.3, 47.9, 47.1, 46.8][i] * MB,
      pushed_at: ago(i * 6 + 1, 2),
      pulled_at: i < 3 ? ago(i * 2, 1) : null,
      type: 'IMAGE',
      platforms: i == 0 ? [amd64, arm64] : [amd64],
    })),
    total: tags.length,
  }
}

export const registryRetention = {
  rules: [
    {
      repositories: { match: 'matching', patterns: ['**'] }, tags: { match: 'matching', patterns: ['v*'] },
      untagged: false, keep: 'latest_pushed', count: 10, disabled: false,
    },
    {
      repositories: { match: 'matching', patterns: ['**'] }, tags: { match: 'matching', patterns: ['**'] },
      untagged: true, keep: 'pushed_within_days', count: 30, disabled: false,
    },
  ],
  schedule: { every: 'daily', minute: 0, hour: 3, weekday: 0, cron: '' },
}

export const registryRuns = {
  runs: [
    { id: 412, status: 'succeeded', trigger: 'schedule', dry_run: false, started_at: ago(0, 12, 30), finished_at: ago(0, 12, 29) },
    { id: 398, status: 'succeeded', trigger: 'schedule', dry_run: false, started_at: ago(1, 12, 30), finished_at: ago(1, 12, 29) },
    { id: 391, status: 'succeeded', trigger: 'manual', dry_run: true, started_at: ago(2, 4), finished_at: ago(2, 4) },
  ],
  total: 3,
}

export const registryImmutability = {
  rules: [
    { id: 7, repositories: { match: 'matching', patterns: ['api'] }, tags: { match: 'matching', patterns: ['v*'] }, disabled: false },
  ],
  immutable_tags: false,
}

export const registryTokens = [
  {
    hashed_id: 'rt4k8', label: 'ci-push', all_projects: false, projects: ['h5r2m'], read_only: false,
    username: 'jane', expires_at: inDays(71), status: 'Ready', created_at: ago(19),
  },
  {
    hashed_id: 'rt9m2', label: 'production-pull', all_projects: true, projects: [], read_only: true,
    username: 'jane', expires_at: null, status: 'Ready', created_at: ago(33),
  },
]

// ---------- domains ----------

export const domains = [
  { domain_name: 'example.com', domain_type: 'CustomDomain', status: 'Active', created_at: ago(80) },
  { domain_name: 'blog.cloider.app', domain_type: 'Subdomain', status: 'Active', created_at: ago(45) },
  { domain_name: 'blog-x7k2.cloider.app', domain_type: 'Subdomain', status: 'Active', created_at: ago(46) },
  { domain_name: 'api-m2p9.cloider.app', domain_type: 'Subdomain', status: 'Active', created_at: ago(31) },
  { domain_name: 'web-q4m8.cloider.app', domain_type: 'Subdomain', status: 'Active', created_at: ago(24) },
  { domain_name: 'acme-site.cloider.app', domain_type: 'Subdomain', status: 'Active', created_at: ago(11) },
]

const appTarget = (hashed_id, domain_name, app, path, days) => ({
  hashed_id, domain_name, target_type: 'App', cluster_id: '', cluster_name: '',
  app_id: app.hashed_id, app_name: app.app_name, app_label: app.app_label, bucket_id: '', bucket_name: '',
  namespace: `app-${app.app_name}-${app.hashed_id}`, service: 'app', port: app.port, protocol: 'TCP',
  path, target_path: '', created_at: ago(days),
})

const clusterTarget = (hashed_id, domain_name, cluster, namespace, service, port, path, days) => ({
  hashed_id, domain_name, target_type: 'Cluster', cluster_id: cluster.hashed_id, cluster_name: cluster.cluster_name,
  app_id: '', app_name: '', app_label: '', bucket_id: '', bucket_name: '', namespace, service, port, protocol: 'TCP',
  path, target_path: '', created_at: ago(days),
})

// always the whole domain, at /
const bucketTarget = (hashed_id, domain_name, bucket, days) => ({
  hashed_id, domain_name, target_type: 'Bucket', cluster_id: '', cluster_name: '',
  app_id: '', app_name: '', app_label: '', bucket_id: bucket.hashed_id, bucket_name: bucket.bucket_name,
  namespace: '', service: '', port: 0, protocol: 'TCP', path: '/', target_path: '/', created_at: ago(days),
})

export const targets = {
  'example.com': [
    appTarget('tg1a2', 'example.com', apps[0], '/', 44),
    clusterTarget('tg3b4', 'example.com', clusters[1], 'shop', 'storefront', 80, '/shop', 60),
  ],
  'blog.cloider.app': [
    clusterTarget('tg5c6', 'blog.cloider.app', clusters[0], 'blog', 'blog', 80, '/', 45),
  ],
  'blog-x7k2.cloider.app': [appTarget('tg7d8', 'blog-x7k2.cloider.app', apps[0], '/', 46)],
  'api-m2p9.cloider.app': [appTarget('tg9e0', 'api-m2p9.cloider.app', apps[1], '/', 31)],
  'web-q4m8.cloider.app': [appTarget('tg2f3', 'web-q4m8.cloider.app', apps[2], '/', 24)],
  'acme-site.cloider.app': [bucketTarget('tg4h5', 'acme-site.cloider.app', buckets[2], 11)],
}

let recordId = 4100
const record = (domain_name, record_type, record_name, record_value, ttl, days) => ({
  id: recordId++, domain_name, record_type, record_name, record_value, ttl,
  created_at: ago(days), updated_at: ago(days),
})

export const dnsRecords = {
  'example.com': [
    record('example.com', 'A', '@', '203.0.113.10', 3600, 80),
    record('example.com', 'CNAME', 'www', 'example.com', 3600, 80),
    record('example.com', 'CNAME', 'status', 'acme.statuspage.example', 3600, 40),
    record('example.com', 'MX', '@', '10 mail.example.com', 3600, 79),
    record('example.com', 'TXT', '@', 'v=spf1 include:_spf.mail.example ~all', 3600, 79),
    record('example.com', 'TXT', '_dmarc', 'v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com', 3600, 79),
  ],
}

// ---------- support ----------

const supportJane = { first_name: jane.first_name, last_name: jane.last_name, picture: jane.picture }

export const tickets = [
  {
    hashed_id: 'tk7m2', subject: 'Custom domain stuck on Pending after changing name servers',
    description: 'Hi, I added example.com yesterday and switched the name servers at our registrar to ns1 to ns4.cloider.com, but the domain still shows Pending. Is there anything else I need to do?',
    ticket_type: 'QuestionOrIssue', ticket_status: 'Resolved', business_impact: 'PartiallyBlocked', service: 'Domain',
    attachments: [], user: supportJane, agent: people.agent, created_at: ago(9, 5), updated_at: ago(8, 22),
  },
  {
    hashed_id: 'tk3p8', subject: 'Request: daily backups at a custom time for orders-db',
    description: 'Our nightly batch jobs run at 02:00 UTC. Could the daily backup of orders-db run at 04:00 UTC instead, so it captures the finished batch?',
    ticket_type: 'FeatureRequest', ticket_status: 'Open', business_impact: 'Question', service: 'Database',
    attachments: [], user: supportJane, agent: people.agent, created_at: ago(1, 6), updated_at: ago(0, 20),
  },
]

export const ticketReplies = {
  tk7m2: [
    {
      reply_text: 'Hi Jane, thanks for reaching out. Name server changes can take up to 48 hours to reach every resolver. I checked example.com and the .com registry already returns the Cloider name servers, so the domain should turn Active within the next hour. I will keep an eye on it.',
      attachments: [], user: people.agent, created_at: ago(9, 3), updated_at: ago(9, 3),
    },
    {
      reply_text: 'Thanks Maya, it shows Active now and the site loads on https://example.com.',
      attachments: [], user: supportJane, created_at: ago(8, 23), updated_at: ago(8, 23),
    },
    {
      reply_text: 'Great to hear! I am marking this request as resolved. Reply here any time if something comes up.',
      attachments: [], user: people.agent, created_at: ago(8, 22), updated_at: ago(8, 22),
    },
  ],
  tk3p8: [
    {
      reply_text: 'Hi Jane, good suggestion. Backup times are fixed per region today, but I have passed this on to the databases team. In the meantime you can restore from any of the last 14 daily backups from the Backups tab.',
      attachments: [], user: people.agent, created_at: ago(0, 20), updated_at: ago(0, 20),
    },
  ],
}

// ---------- pricing ----------

const plan = (price, cpu, ram, storage) => ({ price, cpu, ram, storage, paused_price: round(parseFloat(storage) * 0.5) })

export const pricing = {
  cluster: { compute_unit: 35, volume_gi: 0.5, loadbalancer: 10, cpu_to_mem_ratio: 3.072 },
  app: { compute_unit: 35, cpu_to_mem_ratio: 3.072 },
  bucket: { storage_gi: 0.5 },
  registry: { storage_gi: 0.5 },
  database: {
    PostgreSQL: {
      Hobby: plan(3.99, '0.25', '0.25 GB', '1 GB'), Starter: plan(6.99, '0.25', '0.5 GB', '2 GB'),
      Basic: plan(12.99, '0.5', '1 GB', '4 GB'), Standard: plan(14.99, '1', '1 GB', '6 GB'),
      Plus: plan(29.99, '1', '2 GB', '8 GB'), Pro: plan(59.99, '2', '4 GB', '16 GB'),
    },
    MySQL: {
      Hobby: plan(3.99, '0.25', '0.25 GB', '1 GB'), Starter: plan(6.99, '0.25', '0.5 GB', '2 GB'),
      Basic: plan(12.99, '0.5', '1 GB', '4 GB'), Standard: plan(14.99, '1', '1 GB', '6 GB'),
      Plus: plan(29.99, '1', '2 GB', '8 GB'), Pro: plan(59.99, '2', '4 GB', '16 GB'),
    },
    Redis: {
      Hobby: plan(3.99, '0.25', '0.25 GB', '1 GB'), Starter: plan(6.99, '0.25', '0.5 GB', '2 GB'),
      Basic: plan(11.99, '0.5', '1 GB', '4 GB'), Standard: plan(29.99, '1', '2 GB', '8 GB'),
      Plus: plan(59.99, '1', '4 GB', '16 GB'), Pro: plan(99.99, '2', '8 GB', '32 GB'),
    },
    MongoDB: {
      Hobby: plan(6.99, '0.25', '0.5 GB', '2 GB'), Starter: plan(12.99, '0.5', '1 GB', '4 GB'),
      Basic: plan(14.99, '1', '1 GB', '6 GB'), Standard: plan(29.99, '1', '2 GB', '8 GB'),
      Plus: plan(59.99, '2', '4 GB', '16 GB'), Pro: plan(89.99, '3', '6 GB', '24 GB'),
    },
  },
}

// what the CLI reads from /options, kept for completeness
export const options = {
  cluster_versions: ['1.34', '1.33', '1.32'],
  database_engines: [
    { service: 'PostgreSQL', versions: ['18'], ssl: true },
    { service: 'MySQL', versions: ['9'], ssl: true },
    { service: 'Redis', versions: ['8'], ssl: true },
    { service: 'MongoDB', versions: ['8'], ssl: true },
  ],
  database_plans: ['Hobby', 'Starter', 'Basic', 'Standard', 'Plus', 'Pro'],
  subdomain_roots: ['cloider.app'],
  nameservers: ['ns1.cloider.com', 'ns2.cloider.com', 'ns3.cloider.com', 'ns4.cloider.com'],
}

// ---------- usage ----------

const SECONDS_PER_DAY = 86400
const monthKey = NOW.toISOString().slice(0, 7)
const todayIndex = monthDays.length - 1

// Today is only part way through, so its row covers the hours so far
const dayFraction = (i) => i == todayIndex ? (NOW.getUTCHours() * 60 + NOW.getUTCMinutes()) / 1440 : 1

function clusterUsage(cluster, scale, lbs) {
  const computeUnit = pricing.cluster.compute_unit
  const daily = monthDays.map((offset, i) => {
    const f = dayFraction(i)
    const cpu = round(wave(i, 620 * scale, 140 * scale), 0)
    const memory = round(wave(i, 2300 * scale, 380 * scale, 1), 0)
    const volumes = round(12 * scale, 1)
    const compute_cost = round(Math.max(cpu, memory / 3.072) / 1000 * computeUnit / 30 * f, 4)
    const volumes_cost = round(volumes * 0.5 / 30 * f, 4)
    const loadbalancers_cost = round(lbs.length * 10 / 30 * f, 4)
    return {
      date: dayDate(offset), total_cost: round(compute_cost + volumes_cost + loadbalancers_cost, 4),
      total_time_seconds: Math.round(SECONDS_PER_DAY * f),
      metrics: { cpu, memory, volumes, compute_cost, volumes_cost, loadbalancers_cost, loadbalancers: [] },
    }
  })
  const total = daily.reduce((s, d) => s + d.total_cost, 0)
  const perDay = total / (monthDays.length - 1 + dayFraction(todayIndex))
  return {
    ...cluster,
    daily_usage: daily,
    monthly_usage: {
      avg_cpu_usage: round(daily.reduce((s, d) => s + d.metrics.cpu, 0) / daily.length, 0),
      avg_memory_usage: round(daily.reduce((s, d) => s + d.metrics.memory, 0) / daily.length, 0),
      avg_volumes_usage: round(12 * scale, 1),
      total_cost: round(total), days: daily.length,
      lb_total_cost: round(daily.reduce((s, d) => s + d.metrics.loadbalancers_cost, 0)),
      forecast_this_month: round(perDay * 31), forecast_next_month: round(perDay * 30),
    },
    loadbalancers: lbs,
    loadbalancers_prev: [],
    forecast_rest_of_day: round(perDay * (1 - dayFraction(todayIndex))),
    date: NOW.toISOString(),
    month: monthKey,
  }
}

function lb(name, ip, days) {
  const seconds = Math.round(NOW.getUTCDate() - 1 + dayFraction(todayIndex)) * SECONDS_PER_DAY
  return {
    name, ip, created_at: ago(days), is_active: true,
    total_time_seconds: seconds, cost: round(seconds / (30 * SECONDS_PER_DAY) * 10), recreations: 0,
  }
}

function appUsage(app, scale) {
  const daily = monthDays.map((offset, i) => {
    const f = dayFraction(i)
    const cpu = round(wave(i, 90 * scale, 30 * scale, 0.7), 0)
    const memory = round(wave(i, 310 * scale, 40 * scale, 1.7), 0)
    const compute_cost = round(Math.max(cpu, memory / 3.072) / 1000 * 35 / 30 * f, 4)
    const requests_by = {
      '2xx': Math.round(wave(i, 14200 * scale, 3600 * scale, 0.4) * f),
      '3xx': Math.round(wave(i, 1300 * scale, 300 * scale, 1.1) * f),
      '4xx': Math.round(wave(i, 420 * scale, 160 * scale, 2.2) * f),
      '5xx': Math.round(Math.max(0, wave(i, 18 * scale, 14 * scale, 0.9)) * f),
    }
    const requests = Object.values(requests_by).reduce((a, b) => a + b, 0)
    const bytes_out = Math.round(requests * wave(i, 46000, 6000, 1.3))
    return {
      date: dayDate(offset), total_cost: compute_cost, total_time_seconds: Math.round(SECONDS_PER_DAY * f),
      metrics: { cpu, memory, compute_cost, requests, requests_by, bytes_out },
    }
  })
  const total = daily.reduce((s, d) => s + d.total_cost, 0)
  const perDay = total / (monthDays.length - 1 + dayFraction(todayIndex))
  return {
    ...app,
    daily_usage: daily,
    monthly_usage: {
      avg_cpu_usage: round(daily.reduce((s, d) => s + d.metrics.cpu, 0) / daily.length, 0),
      avg_memory_usage: round(daily.reduce((s, d) => s + d.metrics.memory, 0) / daily.length, 0),
      compute_total_cost: round(total), total_cost: round(total), days: daily.length,
      forecast_this_month: round(perDay * 31), forecast_next_month: round(perDay * 30),
    },
    forecast_rest_of_day: round(perDay * (1 - dayFraction(todayIndex))),
    date: NOW.toISOString(),
    month: monthKey,
  }
}

function databaseUsage(db) {
  const price = pricing.database[db.service][db.database_plan].price
  const daily = monthDays.map((offset, i) => {
    const f = dayFraction(i)
    return { date: dayDate(offset), total_cost: round(price / 30 * f, 4), total_time_seconds: Math.round(SECONDS_PER_DAY * f), metrics: null }
  })
  const total = daily.reduce((s, d) => s + d.total_cost, 0)
  return {
    hashed_id: db.hashed_id, database_name: db.database_name, database_label: db.database_label,
    database_plan: db.database_plan, service: db.service, status: db.status, created_at: db.created_at,
    daily_usage: daily,
    monthly_usage: {
      total_time_seconds: daily.reduce((s, d) => s + d.total_time_seconds, 0), paused_time_seconds: 0,
      running_time_seconds: daily.reduce((s, d) => s + d.total_time_seconds, 0),
      total_cost: round(total), paused_storage_cost: 0, plan_cost: round(total), days: daily.length,
      forecast_this_month: round(price / 30 * 31), forecast_next_month: price,
    },
    forecast_rest_of_day: round(price / 30 * (1 - dayFraction(todayIndex))),
    month: monthKey,
    date: NOW.toISOString(),
  }
}

function storageUsage(resource, gi, growth) {
  const daily = monthDays.map((offset, i) => {
    const f = dayFraction(i)
    const storage = round(gi - growth * (monthDays.length - 1 - i), 2)
    const storage_cost = round(storage * 0.5 / 30 * f, 4)
    return { date: dayDate(offset), total_cost: storage_cost, total_time_seconds: Math.round(SECONDS_PER_DAY * f), metrics: { storage, storage_cost } }
  })
  const total = daily.reduce((s, d) => s + d.total_cost, 0)
  return {
    ...resource,
    daily_usage: daily,
    monthly_usage: {
      avg_storage_usage: round(daily.reduce((s, d) => s + d.metrics.storage, 0) / daily.length),
      storage_total_cost: round(total), total_cost: round(total), days: daily.length,
      forecast_this_month: round(gi * 0.5 * 31 / 30), forecast_next_month: round((gi + growth * 30) * 0.5),
    },
    forecast_rest_of_day: round(gi * 0.5 / 30 * (1 - dayFraction(todayIndex)), 4),
    date: NOW.toISOString(),
    month: monthKey,
  }
}

export function usage() {
  return {
    clusters: [
      clusterUsage(clusters[0], 1, [lb('iot/mqtt', '198.51.100.23', 30)]),
      clusterUsage(clusters[1], 2.6, [lb('shop/storefront', '198.51.100.41', 60), lb('ingress-nginx/ingress-nginx-controller', '198.51.100.42', 60)]),
    ],
    databases: databases.filter(d => d.status != 'Paused').map(databaseUsage),
    apps: [appUsage(apps[0], 1.4), appUsage(apps[1], 1)],
    buckets: [storageUsage(buckets[0], 4.5, 0.03), storageUsage(buckets[1], 57, 1.1), storageUsage(buckets[2], 0.01, 0)],
    registry_projects: [storageUsage(registries[0], 3.1, 0.02), storageUsage(registries[1], 1.2, 0.03)],
  }
}

// ---------- billing ----------
// Shaped the way scheduler/tasks/billing writes them: hourly rates off the monthly
// prices (30 * 24 hours), one item per resource with its subitems.

const HOURS = 720
const hourly = (monthly) => Math.round(monthly / HOURS * 1e6) / 1e6

function subitem(service, description, amount, unit, monthlyPrice) {
  const price = hourly(monthlyPrice)
  return { service, description, qty: round(amount / price), unit, price, amount: round(amount) }
}

const computeLine = (cores, gb, units) => subitem('Compute',
  `Avg. CPU usage: ${cores} cores\nAvg. memory usage: ${gb} GB\nUsage time: ${HOURS} Hours`,
  units * 35, 'Compute-Hour', 35)
const volumesLine = (gb) => subitem('Persistent Volumes', `Avg usage: ${gb} GB`, gb * 0.5, 'GB-Hour', 0.5)
const lbLine = (name, ip) => subitem('LoadBalancer', `Name: ${name}\nIP: ${ip}`, 10, 'Hour', 10)
const planLine = (engine, plan, price) => subitem(engine, `Plan: ${plan} ($${price}/mo)`, price, 'Hour', price)
const storedLine = (gb) => subitem('Object Storage', `Avg stored: ${gb} GB`, gb * 0.5, 'GB-Hour', 0.5)

function item(service_type, description, subitems) {
  return { service_type, description, subitems, amount: round(subitems.reduce((s, i) => s + i.amount, 0)) }
}

function bill(month, paid, items) {
  return { month, items, amount: round(items.reduce((s, i) => s + i.amount, 0)), paid }
}

export const bills = [
  bill('September 2026', false, [
    item('Kubernetes', 'Cluster: "production"', [
      computeLine(1.58, 4.86, 1.62), volumesLine(31.2),
      lbLine('shop/storefront', '198.51.100.41'), lbLine('ingress-nginx/ingress-nginx-controller', '198.51.100.42'),
    ]),
    item('Kubernetes', 'Cluster: "staging"', [
      computeLine(0.59, 2.21, 0.61), volumesLine(12), lbLine('iot/mqtt', '198.51.100.23'),
    ]),
    item('PostgreSQL', 'Database: "orders-db"', [planLine('PostgreSQL', 'Standard', 14.99)]),
    item('MySQL', 'Database: "shop-db"', [planLine('MySQL', 'Basic', 12.99)]),
    item('App', 'App: "blog"', [computeLine(0.13, 0.42, 0.13)]),
    item('Bucket', 'Bucket: "acme-backups"', [storedLine(34.6)]),
  ]),
  bill('August 2026', true, [
    item('Kubernetes', 'Cluster: "production"', [
      computeLine(1.44, 4.37, 1.48), volumesLine(28),
      lbLine('shop/storefront', '198.51.100.41'), lbLine('ingress-nginx/ingress-nginx-controller', '198.51.100.42'),
    ]),
    item('PostgreSQL', 'Database: "orders-db"', [planLine('PostgreSQL', 'Standard', 14.99)]),
    item('App', 'App: "blog"', [computeLine(0.11, 0.38, 0.11)]),
  ]),
  bill('July 2026', true, [
    item('Kubernetes', 'Cluster: "production"', [
      computeLine(1.27, 3.98, 1.31), volumesLine(24), lbLine('shop/storefront', '198.51.100.41'),
    ]),
    item('PostgreSQL', 'Database: "orders-db"', [planLine('PostgreSQL', 'Basic', 12.99)]),
  ]),
]
