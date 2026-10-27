// How to reach the state each shot describes. Keyed by file name, as listed in
// shots.json and manifest/*.json. A shot with no entry here and no actions is
// captured as its route loads; `null` marks one that can't be captured faithfully.
//
//   route    overrides the listed route (query strings, a different demo resource)
//   session  shots_session cookie: jane (default), trial, choose, anonymous
//   ready    true serves every database as Ready, for a running engine the demo holds paused
//   run      (page, h) => steps after the page settles, h is the helpers in capture.mjs
//   viewport { height } for a page taller than the listed viewport
//   wait     ms to wait after run, before the screenshot

// Values for the :placeholders in the listed routes
export const params = {
  app: 'blog-b7x2k',
  cluster: 'staging-s4k9d',
  database: 'orders-db-o2r6p',
  bucket: 'acme-assets-k6b2n',
  project: 'acme-h5r2m',
  domain: 'example.com',
  ticket: 'tk7m2',
}

export const actions = {
  // ---------- get started ----------
  'get-started/sign-in.webp': {
    session: 'anonymous',
    async run(page, h) {
      await page.getByRole('button', { name: 'Login / Register' }).click()
      await h.dialog()
    },
  },
  'get-started/account-menu.webp': {
    async run(page) {
      await page.locator('.profile-btn').click()
      await page.locator('.p-menu').waitFor()
    },
  },
  'get-started/search.webp': {
    async run(page, h) {
      await page.locator('header input').first().click()
      await page.keyboard.type('blog', { delay: 40 })
      await h.sleep(600)
    },
  },
  'get-started/cli-login.webp': {
    // what `cloider login` opens: a local callback port and a state
    route: '/cli/login?port=53682&state=Zx8kPq2Lm4Nv7Rt1Yw3Bc6Df&host=janes-macbook',
  },
  'get-started/trial-banner.webp': { session: 'trial' },

  // ---------- apps ----------
  'apps/actions-menu.webp': {
    async run(page, h) {
      await h.rowMenu('blog')
    },
  },
  'apps/pause-dialog.webp': {
    async run(page, h) {
      await h.rowMenu('blog')
      await h.menuItem('Pause')
      await h.dialog()
    },
  },
  'apps/delete-dialog.webp': {
    async run(page, h) {
      await h.rowMenu('blog')
      await h.menuItem('Delete')
      await h.dialog()
    },
  },
  'apps/new-app-git.webp': {
    async run(page, h) {
      await page.getByRole('button', { name: 'GitHub' }).click()
      const dialog = await h.dialog()
      await dialog.getByText('acme/blog', { exact: true }).click()
      await h.settle()
    },
  },
  'apps/new-app-upload.webp': {
    async run(page, h) {
      // a zip is uploaded as it is, the mock then holds the source in Detecting
      await page.locator('input[type=file][multiple]').setInputFiles({
        name: 'shop.zip', mimeType: 'application/zip', buffer: Buffer.alloc(2_516_582, 1),
      })
      await page.getByText('Analyzing your code').waitFor({ timeout: 15000 })
    },
  },
  'apps/new-app-configure.webp': {
    async run(page, h) {
      await page.getByRole('button', { name: 'GitHub' }).click()
      const dialog = await h.dialog()
      await dialog.getByText('acme/blog', { exact: true }).click()
      await h.settle()
      await dialog.getByRole('button', { name: 'Import' }).click()
      await page.getByText('We had a look at your code').waitFor({ timeout: 20000 })
      await page.getByText('is available').waitFor({ timeout: 10000 })
      await page.evaluate(() => document.activeElement?.blur())
    },
  },
  'apps/detail-overview.webp': { run: (page, h) => h.tab('Overview') },
  'apps/detail-insights.webp': { run: (page, h) => h.tab('Insights'), wait: 1200 },
  'apps/insights-traffic.webp': {
    async run(page, h) {
      await h.tab('Insights')
      await h.scrollTo('Requests (Today)', 24)
    },
    // the four traffic cards and both traffic charts
    viewport: { height: 1000 },
    wait: 1200,
  },
  'apps/resume-dialog.webp': {
    async run(page, h) {
      await h.rowMenu('web')
      await h.menuItem('Resume')
      await h.dialog()
    },
  },
  'apps/detail-builds.webp': { run: (page, h) => h.tab('Builds') },
  'apps/build-logs.webp': {
    async run(page, h) {
      await h.tab('Builds')
      await page.getByRole('button', { name: 'Logs' }).first().click()
      const dialog = await h.dialog()
      await dialog.locator('pre').waitFor()
    },
  },
  'apps/detail-environment.webp': { run: (page, h) => h.tab('Environment') },
  'apps/detail-settings.webp': { run: (page, h) => h.tab('Settings') },
  'apps/detail-logs.webp': {
    async run(page, h) {
      await h.tab('Logs')
      await page.getByText('/api/newsletter').first().waitFor()
    },
    wait: 800,
  },
  'apps/detail-terminal.webp': {
    async run(page, h) {
      await h.tab('Terminal')
      await page.locator('iframe.opacity-100').waitFor()
    },
    wait: 1200,
  },

  // ---------- kubernetes ----------
  'kubernetes/create.webp': {
    async run(page) {
      await page.locator('input[name=cluster_name]').fill('staging')
    },
  },
  'kubernetes/terminal.webp': {
    async run(page) {
      await page.locator('iframe.opacity-100').waitFor()
    },
    wait: 1200,
  },
  'kubernetes/actions-menu.webp': { run: (page, h) => h.rowMenu('staging') },
  'kubernetes/pause-dialog.webp': {
    async run(page, h) {
      await h.rowMenu('staging')
      await h.menuItem('Pause')
      await h.dialog()
    },
  },
  'kubernetes/delete-dialog.webp': {
    async run(page, h) {
      await h.rowMenu('staging')
      await h.menuItem('Delete')
      const dialog = await h.dialog()
      await dialog.getByRole('button', { name: 'I want to delete the cluster' }).click()
    },
  },
  'kubernetes/resume-dialog.webp': {
    async run(page, h) {
      await h.rowMenu('sandbox')
      await h.menuItem('Resume')
      await h.dialog()
    },
  },
  'kubernetes/usage-loadbalancers.webp': {
    async run(page, h) {
      await page.getByRole('tab', { name: 'staging' }).click()
      await h.settle()
    },
    // the stats, the charts and the load balancers table at once
    viewport: { height: 1260 },
    wait: 1200,
  },
  'kubernetes/target-form.webp': {
    route: '/dashboard/domains/blog.cloider.app',
    async run(page, h) {
      await page.getByRole('button', { name: 'Add target' }).click()
      const dialog = await h.dialog()
      await dialog.locator('.p-selectbutton').getByText('Cluster', { exact: true }).click()
      await h.select('Cluster', 'staging', dialog)
      await h.select('Namespace', 'shop', dialog)
      await h.select('Service', 'web', dialog)
      await h.select('Port', '80', dialog)
      await dialog.locator('input[name=path]').fill('/')
    },
  },

  // ---------- databases ----------
  'databases/create.webp': {
    async run(page, h) {
      await page.locator('input[name=database_name]').fill('orders-db')
      await page.locator('input[name=database_user]').fill('orders')
      await h.select('Database Engine', 'PostgreSQL v18')
    },
  },
  'databases/detail-overview.webp': { run: (page, h) => h.tab('Overview') },
  'databases/detail-insights.webp': { run: (page, h) => h.tab('Insights'), wait: 1200 },
  'databases/detail-backups.webp': { run: (page, h) => h.tab('Backups') },
  'databases/detail-resize.webp': { run: (page, h) => h.tab('Resize') },
  'databases/detail-settings.webp': { run: (page, h) => h.tab('Settings') },
  'databases/detail-terminal.webp': {
    async run(page, h) {
      await h.tab('Terminal')
      await page.locator('iframe.opacity-100').waitFor()
    },
    wait: 1200,
  },
  'databases/pause-dialog.webp': {
    async run(page, h) {
      await h.rowMenu('orders-db')
      await h.menuItem('Pause')
      await h.dialog()
    },
  },
  'databases/delete-dialog.webp': {
    async run(page, h) {
      await h.tab('Settings')
      await page.getByRole('button', { name: 'Delete database' }).click()
      const dialog = await h.dialog()
      await dialog.getByRole('button', { name: 'I want to delete the database' }).click()
      await page.evaluate(() => document.activeElement?.blur())
    },
  },
  'databases/backups-pick-time.webp': { run: pickRestoreTime },
  'databases/restore-dialog-time.webp': {
    async run(page, h) {
      await pickRestoreTime(page, h)
      await page.getByRole('button', { name: 'Restore', exact: true }).click()
      await page.locator('.p-confirmdialog').waitFor()
    },
  },
  'databases/resume-dialog.webp': {
    async run(page, h) {
      await h.rowMenu('cache')
      await h.menuItem('Resume')
      await h.dialog()
    },
  },
  'databases/overview-mysql.webp': { run: (page, h) => h.tab('Overview') },
  'databases/overview-mongodb.webp': { run: (page, h) => h.tab('Overview') },
  'databases/overview-redis.webp': { ready: true, run: (page, h) => h.tab('Overview') },
  'databases/restore-dialog.webp': {
    async run(page, h) {
      await h.tab('Backups')
      await page.getByRole('button', { name: 'Restore', exact: true }).click()
      await page.locator('.p-confirmdialog').waitFor()
    },
  },

  // ---------- object storage ----------
  'object-storage/detail-overview.webp': {
    async run(page, h) {
      await h.tab('Overview')
      // the connection details and the code snippets under them
      await h.scrollTo('Connection Details', 24)
    },
  },
  'object-storage/detail-files.webp': { run: (page, h) => h.tab('Files') },
  'object-storage/file-versions.webp': {
    async run(page, h) {
      await h.tab('Files')
      await page.locator('tr', { hasText: 'og-image.png' }).locator('button:has(.i-mdi-history)').click()
      const dialog = await h.dialog()
      await h.settle()
    },
  },
  'object-storage/detail-usage.webp': { run: (page, h) => h.tab('Usage'), wait: 1200 },
  'object-storage/detail-policy.webp': {
    async run(page, h) {
      await h.tab('Permissions')
      // the editor opens scrolled to the end of a long policy
      await page.locator('textarea').first().evaluate(el => { el.scrollTop = 0 })
    },
  },
  'object-storage/policy-examples.webp': {
    async run(page, h) {
      await h.tab('Permissions')
      await page.getByRole('button', { name: 'Examples' }).click()
      await page.locator('.p-menu, .p-tieredmenu').first().waitFor()
    },
  },
  'object-storage/cors.webp': {
    async run(page, h) {
      await h.tab('Permissions')
      await h.tab('CORS')
    },
  },
  'object-storage/cors-rule-form.webp': {
    async run(page, h) {
      await h.tab('Permissions')
      await h.tab('CORS')
      await page.getByRole('button', { name: 'Add rule' }).click()
      const dialog = await h.dialog()
      const field = (label) => dialog.locator('label', { has: page.locator(`span.font-medium:text-is("${label}")`) })
      await dialog.locator('input').first().fill('uploads')
      await field('Allowed origins').locator('textarea').fill('https://app.example.com')
      await dialog.locator('label:has(input[value=HEAD])').click()
      await dialog.locator('label:has(input[value=PUT])').click()
      await dialog.locator('textarea').nth(1).fill('Content-Type')
      await dialog.locator('textarea').nth(2).fill('ETag')
      // InputNumber formats as it is typed, fill() leaves it empty
      await dialog.locator('.p-inputnumber input').pressSequentially('3600')
      await dialog.locator('.p-dialog-title').click()
      await dialog.locator('.p-dialog-content').evaluate(el => { el.scrollTop = 0 })
    },
    // the whole form, ID to Max age
    viewport: { height: 1100 },
  },
  'object-storage/cors-json.webp': {
    async run(page, h) {
      await h.tab('Permissions')
      await h.tab('CORS')
      await page.getByRole('button', { name: 'Edit JSON' }).click()
      await h.dialog()
      await page.evaluate(() => document.activeElement?.blur())
    },
  },
  'object-storage/website-settings.webp': {
    async run(page, h) {
      await h.tab('Settings')
      await h.scrollTo('Static Website', 24)
    },
  },
  'object-storage/create-website.webp': {
    async run(page) {
      await page.locator('input[name=bucket_name]').fill('acme-site')
      // ToggleSwitch drops its name, so the switches are found by their labels
      const toggle = (label) => page.locator('label', { has: page.getByText(label, { exact: true }) }).locator('.p-toggleswitch')
      await toggle('Public read access').click()
      await toggle('Static website').click()
      await page.evaluate(() => document.activeElement?.blur())
    },
  },
  'object-storage/detail-lifecycle.webp': { run: (page, h) => h.tab('Lifecycle') },
  'object-storage/detail-settings.webp': { run: (page, h) => h.tab('Settings') },
  'object-storage/access-keys.webp': { route: '/dashboard/access-control?tab=s3-credentials' },
  'object-storage/key-create.webp': {
    async run(page, h) {
      await page.getByRole('button', { name: 'Create Access Key' }).click()
      const dialog = await h.dialog()
      await dialog.locator('input').first().fill('ci-deploy')
      await dialog.getByText('Only specific buckets').click()
      await dialog.locator('.p-multiselect').click()
      await page.locator('.p-multiselect-overlay .p-multiselect-option', { hasText: 'acme-assets' }).click()
      // Escape would close the dialog with the overlay
      await dialog.locator('.p-dialog-title').click()
      await h.sleep(300)
    },
  },
  'object-storage/key-created.webp': {
    async run(page, h) {
      await page.getByRole('button', { name: 'Create Access Key' }).click()
      const dialog = await h.dialog()
      await dialog.locator('input').first().fill('ci-deploy')
      await dialog.getByText('Only specific buckets').click()
      await dialog.locator('.p-multiselect').click()
      await page.locator('.p-multiselect-overlay .p-multiselect-option', { hasText: 'acme-assets' }).click()
      // Escape would close the dialog with the overlay
      await dialog.locator('.p-dialog-title').click()
      await dialog.getByRole('button', { name: 'Create access key' }).click()
      await page.getByRole('button', { name: "I've saved the secret key" }).waitFor()
      await h.sleep(300)
    },
  },
  'object-storage/deleted-files.webp': {
    async run(page, h) {
      await h.tab('Files')
      await page.getByText('Show deleted files').click()
      await h.settle()
    },
  },
  'object-storage/lifecycle-rule-form.webp': {
    async run(page, h) {
      await h.tab('Lifecycle')
      await page.getByRole('button', { name: 'Add rule' }).click()
      const dialog = await h.dialog()
      const inputs = dialog.locator('input')
      await inputs.nth(0).fill('expire-tmp')
      await inputs.nth(1).fill('tmp/')
      await dialog.locator('.p-inputnumber input').nth(0).fill('7')
      await dialog.locator('.p-inputnumber input').nth(2).fill('1')
      await dialog.locator('.p-dialog-title').click()
    },
  },
  'object-storage/delete-dialog.webp': {
    async run(page, h) {
      await h.tab('Settings')
      await page.getByRole('button', { name: 'Delete bucket' }).click()
      await h.dialog()
    },
  },

  // ---------- container registry ----------
  'container-registry/detail-overview.webp': { run: (page, h) => h.tab('Overview') },
  'container-registry/detail-repositories.webp': {
    async run(page, h) {
      await h.tab('Repositories')
      await page.getByRole('link', { name: 'api', exact: true }).click()
      await h.settle()
    },
  },
  'container-registry/detail-policy.webp': {
    // retention rules, schedule, runs and immutability rules, top to bottom
    viewport: { height: 1240 },
    run: (page, h) => h.tab('Policy'),
  },
  'container-registry/detail-usage.webp': { run: (page, h) => h.tab('Usage'), wait: 1200 },
  'container-registry/detail-settings.webp': { run: (page, h) => h.tab('Settings') },
  'container-registry/tokens.webp': { route: '/dashboard/access-control?tab=registry-tokens' },
  'container-registry/token-create.webp': { run: fillRegistryToken },
  'container-registry/token-created.webp': {
    async run(page, h) {
      const dialog = await fillRegistryToken(page, h)
      await dialog.getByRole('button', { name: 'Create token' }).click()
      await page.getByRole('button', { name: "I've saved the secret" }).waitFor()
      await h.sleep(300)
    },
  },
  'container-registry/delete-dialog.webp': {
    async run(page, h) {
      await h.tab('Settings')
      await page.getByRole('button', { name: 'Delete project' }).click()
      const dialog = await h.dialog()
      await dialog.getByRole('button', { name: 'I want to delete the project' }).click()
      await dialog.locator('input').fill('acme')
      await page.evaluate(() => document.activeElement?.blur())
    },
  },
  'container-registry/retention-rule-form.webp': {
    async run(page, h) {
      await h.tab('Policy')
      await page.getByRole('button', { name: 'Add rule' }).first().click()
      const dialog = await h.dialog()
      await dialog.locator('input.font-mono').nth(1).fill('v*')
      await dialog.getByText('Untagged images too').click()
      await page.evaluate(() => document.activeElement?.blur())
    },
  },
  'container-registry/immutability-rule-form.webp': {
    async run(page, h) {
      await h.tab('Policy')
      await page.getByRole('button', { name: 'Add rule' }).last().click()
      const dialog = await h.dialog()
      await dialog.locator('input.font-mono').nth(0).fill('api')
      await dialog.locator('input.font-mono').nth(1).fill('v*')
      await page.evaluate(() => document.activeElement?.blur())
    },
  },
  'container-registry/overview-kubernetes.webp': {
    async run(page, h) {
      await h.tab('Overview')
      await h.tab('Kubernetes')
    },
  },

  // ---------- domains ----------
  // scrolled to the DNS records, the name servers card is right under them
  'domains/detail.webp': { run: (page, h) => h.scrollTo('DNS records (6)', 16) },
  'domains/dns-record-form.webp': {
    async run(page, h) {
      await page.getByRole('button', { name: 'Add DNS record' }).first().click()
      await h.dialog()
    },
  },
  'domains/targets.webp': {},
  'domains/custom-domain-nameservers.webp': {
    async run(page, h) {
      await page.locator('input[name=domain_name]').fill('example.com')
      await page.getByRole('button', { name: 'Check Availability' }).click()
      await page.getByRole('button', { name: 'Continue' }).first().waitFor()
      await h.settle()
      await page.getByRole('button', { name: 'Continue' }).first().click()
      await page.getByText('ns1.cloider.com').waitFor()
    },
  },
  'domains/target-form.webp': {
    async run(page, h) {
      await page.getByRole('button', { name: 'Add target' }).click()
      const dialog = await h.dialog()
      await dialog.locator('.p-selectbutton').getByText('Cluster', { exact: true }).click()
      await h.select('Cluster', 'production', dialog)
      await h.select('Namespace', 'shop', dialog)
      await h.select('Service', 'api', dialog)
      await h.select('Port', '80', dialog)
      await dialog.locator('input[name=path]').fill('/api')
    },
  },
  'domains/dns-record-alias.webp': {
    async run(page, h) {
      await page.getByRole('button', { name: 'Add DNS record' }).first().click()
      const dialog = await h.dialog()
      await h.select('Record type', 'ALIAS', dialog)
      await dialog.locator('input[name=record_name]').fill('@')
      await dialog.locator('[name=record_value]').fill('blog-x7k2.cloider.app')
      await dialog.locator('.p-dialog-title').click()
    },
  },
  'domains/target-form-bucket.webp': {
    async run(page, h) {
      await h.rowMenu('acme-site')
      await h.menuItem('Edit')
      await h.dialog()
      await h.settle()
      await page.evaluate(() => document.activeElement?.blur())
    },
  },
  'domains/bucket-target.webp': {},
  'domains/delete-dialog.webp': {
    async run(page, h) {
      await page.getByRole('button', { name: 'Delete domain' }).click()
      const dialog = await h.dialog()
      await dialog.getByRole('button', { name: 'I want to delete the domain' }).click()
      await dialog.locator('input').fill('example.com')
      await page.evaluate(() => document.activeElement?.blur())
    },
  },

  // ---------- account ----------
  'account/members.webp': {},
  'account/invite-member.webp': {
    async run(page, h) {
      await page.getByRole('button', { name: 'Add New Member' }).click()
      const dialog = await h.dialog()
      await dialog.locator('input').first().fill('alex@acme.example')
      await dialog.locator('.p-select').click()
      await page.locator('.p-select-overlay').waitFor()
    },
  },
  'account/change-role.webp': {
    async run(page, h) {
      await h.rowMenu('sam@acme.example')
      await h.menuItem('Change role')
      const dialog = await h.dialog()
      await dialog.locator('.p-select').click()
      await page.locator('.p-select-overlay').waitFor()
    },
  },
  'account/access-roles-info.webp': {
    async run(page, h) {
      await page.getByRole('button', { name: 'Add New Member' }).click()
      await h.dialog()
      await page.getByRole('button', { name: 'Information about access roles' }).click()
      await h.sleep(300)
    },
  },
  'account/api-tokens.webp': { route: '/dashboard/access-control?tab=api-tokens' },
  'account/api-token-create.webp': {
    route: '/dashboard/access-control?tab=api-tokens',
    async run(page, h) {
      await page.getByRole('button', { name: 'Generate API token' }).first().click()
      const dialog = await h.dialog()
      await dialog.locator('input').first().fill('GitHub Actions deploy')
    },
  },
  'account/api-token-created.webp': {
    async run(page, h) {
      await page.getByRole('button', { name: 'Generate API token' }).first().click()
      const dialog = await h.dialog()
      await dialog.locator('input').first().fill('GitHub Actions deploy')
      await dialog.getByRole('button', { name: 'Generate API token' }).click()
      await page.getByRole('button', { name: "I've saved the token" }).waitFor()
      await h.sleep(300)
    },
  },
  'account/invoice.webp': {
    async run(page, h) {
      await page.locator('tr', { hasText: 'September 2026' }).first().click()
      await h.dialog()
    },
  },
  'account/usage-resource.webp': {
    async run(page, h) {
      await page.getByRole('tab', { name: 'production' }).click()
      await h.settle()
    },
    wait: 1200,
  },
  'account/usage.webp': { wait: 1200 },
  'account/select-account.webp': { session: 'choose' },

  // ---------- cli ----------
  'cli/login-token.webp': {
    async run(page) {
      await page.getByRole('button', { name: /Authorize/ }).click()
      await page.getByText('Copy your token').waitFor()
    },
  },
}

// Backups tab, Specific date & time: October 17 at 09:41:00 UTC
async function pickRestoreTime(page, h) {
  await h.tab('Backups')
  await page.getByText('Specific date & time', { exact: true }).click()
  await page.locator('.p-datepicker-panel-inline td:not(.p-datepicker-other-month) span', { hasText: /^17$/ }).first().click()
  const time = page.locator('.p-datepicker-input').last()
  await time.fill('09:41:00')
  await time.press('Tab')
  await page.evaluate(() => document.activeElement?.blur())
  await h.sleep(300)
}

// Registry Tokens tab, Create Token: ci-push, only acme, pull and push, 90 days
async function fillRegistryToken(page, h) {
  await page.getByRole('button', { name: 'Create Token' }).click()
  const dialog = await h.dialog()
  await dialog.locator('input').first().fill('ci-push')
  await dialog.getByText('Only specific projects').click()
  await dialog.locator('.p-multiselect').click()
  await page.locator('.p-multiselect-overlay .p-multiselect-option', { hasText: 'acme' }).first().click()
  await dialog.locator('.p-dialog-title').click()
  await h.select('Expires', '90 days', dialog)
  await dialog.locator('.p-dialog-title').click()
  return dialog
}
