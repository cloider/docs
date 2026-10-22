// Captures the docs screenshots: copies and builds the dashboard, starts it in a
// container pointed at the mock API, drives headless Chrome through every shot
// listed in shots.json and manifest/*.json, and writes WebP files to
// static/img/screenshots. See README.md.
//
//   npm run shots                     every shot
//   npm run shots -- apps/            only files whose name contains "apps/"
//   npm run shots -- --keep           leave the container running afterwards
//   npm run shots -- --no-build       reuse the last build even if web/ changed

import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import sharp from 'sharp'
import { startServer, unhandled } from './mock/server.mjs'
import { NOW } from './mock/fixtures.mjs'
import { actions, params } from './shots.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.resolve(here, '..', '..')
const webSrc = path.resolve(docsDir, '..', 'web')
const outDir = path.join(docsDir, 'static', 'img', 'screenshots')

const config = {
  port: Number(process.env.SHOTS_PORT ?? 3210),
  nuxtPort: Number(process.env.SHOTS_NUXT_PORT ?? 3211),
  tlsPort: Number(process.env.SHOTS_TLS_PORT ?? 3443),
  webDir: path.resolve(process.env.SHOTS_WEB_DIR ?? path.join(here, 'out', 'web')),
  container: process.env.SHOTS_CONTAINER ?? 'cloider-docs-shots-web',
  chrome: process.env.SHOTS_CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  maxBytes: 450 * 1024,
}

const args = process.argv.slice(2)
const flags = new Set(args.filter(a => a.startsWith('--')))
const filters = args.filter(a => !a.startsWith('--'))

const log = (...m) => console.log('[shots]', ...m)
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ---------- the dashboard ----------

// A copy of web/, never the original: the build writes .nuxt and .output into it,
// and the config is patched to drop the devtools button and the typecheck.
function prepareWeb() {
  fs.mkdirSync(config.webDir, { recursive: true })
  const rsync = spawnSync('rsync', [
    '-a', '--delete', '--itemize-changes',
    '--exclude', '.nuxt', '--exclude', '.output', '--exclude', '.env', '--exclude', '.DS_Store',
    // jiti's cache moves whenever the dev server reloads, and means nothing to a build
    '--exclude', 'nuxt.config.ts', '--exclude', 'node_modules/.cache',
    `${webSrc}/`, `${config.webDir}/`,
  ], { encoding: 'utf8' })
  if (rsync.status != 0) throw new Error(`rsync failed: ${rsync.stderr}`)

  const configSrc = fs.readFileSync(path.join(webSrc, 'nuxt.config.ts'), 'utf8')
  const patched = configSrc
    .replace(/devtools:\s*\{\s*enabled:\s*true\s*\}/, 'devtools: { enabled: false }')
    .replace(/typeCheck:\s*'build'/, 'typeCheck: false')
  const configDst = path.join(config.webDir, 'nuxt.config.ts')
  const configChanged = !fs.existsSync(configDst) || fs.readFileSync(configDst, 'utf8') != patched
  if (configChanged) fs.writeFileSync(configDst, patched)

  const changed = configChanged || rsync.stdout.split('\n').some(line => /^[<>ch*]/.test(line))
  return changed || !fs.existsSync(path.join(config.webDir, '.output', 'server', 'index.mjs'))
}

function docker(...dockerArgs) {
  return execFileSync('docker', dockerArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

function removeContainer() {
  spawnSync('docker', ['rm', '-f', config.container], { stdio: 'ignore' })
}

// A production build rather than `nuxt dev`: no devtools, no HMR client that
// reloads the page mid capture, and pages load as fast as they do for users.
function build() {
  log('building the dashboard (a few minutes)...')
  removeContainer()
  const res = spawnSync('docker', [
    'run', '--rm', '--name', config.container, '-v', `${config.webDir}:/app`, '-w', '/app',
    'node:22-alpine', 'npx', 'nuxt', 'build',
  ], { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' })
  if (res.status != 0) throw new Error('nuxt build failed')
}

function startNuxt() {
  removeContainer()
  const env = {
    HOST: '0.0.0.0',
    PORT: '3000',
    NUXT_INTERNAL_API_URL: `http://host.docker.internal:${config.port}/api`,
    // prod, so addresses read cloider.app and db.cloider.com
    NUXT_PUBLIC_ENV: 'prod',
    NUXT_PUBLIC_SHOW_DATABASES: 'true',
    NUXT_PUBLIC_SHOW_DOMAINS: 'true',
    NUXT_PUBLIC_SHOW_APPS: 'true',
    NUXT_PUBLIC_SHOW_BUCKETS: 'true',
    NUXT_PUBLIC_SHOW_REGISTRIES: 'true',
  }
  docker('run', '-d', '--name', config.container,
    '-v', `${config.webDir}:/app`, '-w', '/app',
    '-p', `127.0.0.1:${config.nuxtPort}:3000`,
    '--add-host', 'host.docker.internal:host-gateway',
    ...Object.entries(env).flatMap(([k, v]) => ['-e', `${k}=${v}`]),
    'node:22-alpine', 'node', '.output/server/index.mjs')
}

async function waitForNuxt() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${config.nuxtPort}/`)
      if (res.status < 500) return
    } catch {}
    await sleep(500)
  }
  throw new Error('the dashboard container did not come up, see `docker logs ' + config.container + '`')
}

// ---------- the cloider.com origin ----------

const SITE_HOST = 'cloider.com'

// A throwaway self-signed certificate for the mock's HTTPS listener, made once
// with the system openssl and kept in out/
function certificate() {
  const dir = path.join(here, 'out', 'tls')
  const key = path.join(dir, 'key.pem')
  const cert = path.join(dir, 'cert.pem')
  if (!fs.existsSync(cert)) {
    fs.mkdirSync(dir, { recursive: true })
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert,
      '-days', '3650', '-subj', `/CN=${SITE_HOST}`], { stdio: 'ignore' })
  }
  return { key: fs.readFileSync(key), cert: fs.readFileSync(cert) }
}

// Refuses to go on unless cloider.com really resolves to the mock, so a run can
// never send a request to the real site
async function checkResolver(browser) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true })
  try {
    const page = await context.newPage()
    const res = await page.goto(`https://${SITE_HOST}/__mock/ping`, { timeout: 10000 })
    if ((await res?.text()) != 'cloider-docs-mock') throw new Error('unexpected answer')
  } catch (err) {
    throw new Error(`${SITE_HOST} does not resolve to the mock, stopping (${err.message})`)
  } finally {
    await context.close()
  }
}

// ---------- the list of shots ----------

function loadShots() {
  const main = JSON.parse(fs.readFileSync(path.join(here, 'shots.json'), 'utf8'))
  const shots = main.shots.map(s => ({ ...s, source: 'shots.json' }))
  const manifestDir = path.join(here, 'manifest')
  if (fs.existsSync(manifestDir)) {
    for (const file of fs.readdirSync(manifestDir).filter(f => f.endsWith('.json')).sort()) {
      const extra = JSON.parse(fs.readFileSync(path.join(manifestDir, file), 'utf8'))
      for (const s of extra.shots ?? []) {
        if (!shots.some(other => other.file == s.file)) shots.push({ ...s, source: `manifest/${file}` })
      }
    }
  }
  return { viewport: main.viewport, shots }
}

function resolveRoute(route) {
  return route.replace(/:(\w+)/g, (m, key) => params[key] ?? m)
}

// ---------- the browser ----------

// Applied to every page before it renders: no transitions or animations, so a
// dialog is fully open the moment it is, spinners hold still, and the tab caret,
// scrollbars, toasts and the route loading bar never make it into a picture.
const stillCss = `
*, *::before, *::after {
  animation-duration: 0s !important; animation-delay: 0s !important;
  transition-duration: 0s !important; transition-delay: 0s !important;
  caret-color: transparent !important;
}
::-webkit-scrollbar { display: none !important; }
* { scrollbar-width: none !important; }
.p-toast, .nuxt-loading-indicator { display: none !important; }
`

async function newPage(browser, viewport, shot) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor,
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'dark',
    // the mock's own self-signed certificate for cloider.com
    ignoreHTTPSErrors: true,
  })
  const session = shot.session ?? 'jane'
  if (session != 'anonymous') {
    await context.addCookies([{ name: 'shots_session', value: session, domain: SITE_HOST, path: '/' }])
  }
  await context.addInitScript((css) => {
    const add = () => {
      const style = document.createElement('style')
      style.textContent = css
      document.documentElement.appendChild(style)
    }
    if (document.documentElement) add()
    else document.addEventListener('DOMContentLoaded', add)
  }, stillCss)
  // Seeded, so the random parts of the UI (the suggested subdomain suffix) come
  // out the same every run
  await context.addInitScript(() => {
    let seed = 20261020
    Math.random = () => {
      seed = (seed + 0x6d2b79f5) | 0
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  })
  const page = await context.newPage()
  // The clock starts at the fixtures' "now" and runs from there. A frozen one
  // (setFixedTime) would hold Chart.js animations at their first frame.
  await page.clock.install({ time: NOW })
  return { context, page }
}

// Waits for what a person would wait for: the page's own loading states gone,
// fonts in, and a beat for charts to draw.
async function settle(page, { extra = 600 } = {}) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  // visible ones only, a tab panel that isn't open can hold a spinner of its own
  await page.waitForFunction(() => ![...document.querySelectorAll('.i-mdi-loading, .p-progressspinner, .p-skeleton')]
    .some(el => el.getClientRects().length), null, { timeout: 15000 })
    .catch(() => log('  still loading after 15s, capturing anyway'))
  await sleep(extra)
}

const helpers = (page) => ({
  settle: (opts) => settle(page, opts),
  sleep,
  // clicks the first element with exactly this text, of the given role when set
  async clickText(text, opts = {}) {
    const locator = opts.role
      ? page.getByRole(opts.role, { name: text, exact: opts.exact ?? true })
      : page.getByText(text, { exact: opts.exact ?? true })
    await locator.first().click()
  },
  async tab(name) {
    await page.getByRole('tab', { name, exact: true }).first().click()
    await settle(page)
  },
  // the action menu button (three dots) of the table row holding text
  async rowMenu(text) {
    const row = page.locator('tr', { hasText: text }).filter({ has: page.locator('.i-mdi-dots-vertical') }).first()
    await row.locator('button:has(.i-mdi-dots-vertical)').click()
    await page.locator('.p-menu').first().waitFor()
  },
  async menuItem(label) {
    await page.locator('.p-menu .p-menu-item', { hasText: label }).first().click()
  },
  // picks an option of the PrimeVue Select under the field label, inside scope
  async select(label, option, scope = page) {
    const field = scope.locator('label', { has: page.locator(`span.font-medium:text-is("${label}")`) }).first()
    await field.locator('.p-select').click()
    await page.locator('.p-select-overlay .p-select-option', { hasText: option }).first().click()
    await sleep(300)
  },
  // scrolls the dashboard's content pane so the element with this text is at the top
  async scrollTo(text, offset = 0) {
    await page.getByText(text, { exact: true }).first().evaluate((el, offset) => {
      el.scrollIntoView({ block: 'start' })
      // the content pane is the scrolling ancestor, not the window
      let pane = el.parentElement
      while (pane && pane.scrollHeight <= pane.clientHeight) pane = pane.parentElement
      pane?.scrollBy(0, -offset)
    }, offset)
    await sleep(300)
  },
  async dialog() {
    const dialog = page.locator('.p-dialog').last()
    await dialog.waitFor()
    await sleep(300)
    return dialog
  },
})

async function capture(browser, viewport, shot) {
  const action = actions[shot.file]
  if (action === null) return { skipped: 'not feasible, see shots.mjs' }
  if (!action && shot.actions) return { skipped: 'no action script in shots.mjs' }

  const spec = { session: action?.session, route: action?.route ?? shot.route }
  // a shot can ask for a taller page when what it has to show doesn't fit in 900px
  viewport = { ...viewport, ...action?.viewport }
  const { context, page } = await newPage(browser, viewport, spec)
  try {
    page.on('pageerror', (err) => log(`  page error: ${err.message}`))
    await page.goto(`https://${SITE_HOST}${resolveRoute(spec.route)}`, { waitUntil: 'load', timeout: 60000 })
    await settle(page)
    if (action?.run) await action.run(page, helpers(page))
    // a dialog focuses its close button on open, which draws a focus ring around it
    await page.evaluate(() => {
      const el = document.activeElement
      if (el instanceof HTMLElement && el.closest('.p-dialog-header-actions, .p-dialog-close-button')) el.blur()
    })
    // park the pointer where it hovers nothing
    await page.mouse.move(viewport.width - 2, viewport.height - 2)
    await sleep(action?.wait ?? 200)

    const png = await page.screenshot({ type: 'png', animations: 'disabled', caret: 'hide' })
    let quality = 80
    let webp
    do {
      webp = await sharp(png).webp({ quality, effort: 6 }).toBuffer()
      quality -= 6
    } while (webp.length > config.maxBytes && quality >= 50)

    const file = path.join(outDir, shot.file)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, webp)
    return { bytes: webp.length, quality: quality + 6 }
  } finally {
    await context.close()
  }
}

// ---------- main ----------

async function main() {
  const { viewport, shots } = loadShots()
  const selected = filters.length ? shots.filter(s => filters.some(f => s.file.includes(f))) : shots
  if (!selected.length) throw new Error(`no shot matches ${filters.join(', ')}`)

  const needsBuild = prepareWeb()
  if (needsBuild && !flags.has('--no-build')) build()

  const server = await startServer({
    port: config.port, nuxtUrl: `http://127.0.0.1:${config.nuxtPort}`, tls: certificate(), tlsPort: config.tlsPort,
  })
  startNuxt()
  // The pages are opened as https://cloider.com, resolved to the mock: the dashboard
  // prints its own origin into commands (the API token's curl example), and that
  // should read like production rather than localhost
  const browser = await chromium.launch({
    executablePath: config.chrome,
    headless: true,
    args: [`--host-resolver-rules=MAP ${SITE_HOST} 127.0.0.1:${config.tlsPort}`],
  })

  const results = []
  try {
    await waitForNuxt()
    await checkResolver(browser)
    for (const shot of selected) {
      process.stdout.write(`[shots] ${shot.file} ... `)
      try {
        const result = await capture(browser, viewport, shot)
        results.push({ shot, ...result })
        console.log(result.skipped ? `skipped (${result.skipped})` : `${Math.round(result.bytes / 1024)} KB, q${result.quality}`)
      } catch (err) {
        results.push({ shot, error: err.message.split('\n')[0] })
        console.log(`FAILED: ${err.message.split('\n')[0]}`)
      }
    }
  } finally {
    await browser.close()
    server.close()
    if (!flags.has('--keep')) removeContainer()
  }

  const captured = results.filter(r => r.bytes).length
  log(`${captured} captured, ${results.filter(r => r.skipped).length} skipped, ${results.filter(r => r.error).length} failed`)
  for (const r of results.filter(r => r.skipped || r.error)) log(`  ${r.shot.file}: ${r.skipped ?? r.error}`)
  if (unhandled.size) {
    log('routes the mock has no fixture for:')
    for (const key of unhandled) log(`  ${key}`)
  }
  process.exitCode = results.some(r => r.error) ? 1 : 0
}

main().catch((err) => {
  console.error(err)
  removeContainer()
  process.exit(1)
})
