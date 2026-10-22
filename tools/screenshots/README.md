# Docs screenshots

The dashboard screenshots in `static/img/screenshots/` are captured by this harness, so they can be taken again after
a UI change instead of by hand. It renders the real dashboard (`services/web`) against a mock API that serves the
fictional Acme Inc demo data, never a real account.

## Run it

Needs Docker, the `node:22-alpine` image and Google Chrome (the harness drives the installed Chrome, it downloads no
browser).

```sh
cd docs/tools/screenshots
npm install
npm run shots                         # every shot in shots.json and manifest/*.json
npm run shots -- apps/                # only files whose name contains "apps/"
npm run shots -- apps/list kubernetes/create.webp
npm run shots -- --keep               # leave the dashboard container running afterwards
```

A run:

1. copies `services/web` to `out/web` (rsync, the original is never touched) and patches the copy's `nuxt.config.ts`
   to turn off the devtools button and the build-time typecheck,
2. builds it with `nuxt build` in a `node:22-alpine` container when anything changed since the last build (a few
   minutes, skipped otherwise),
3. starts the mock (`mock/server.mjs`) on port 3210 (and 3443 for HTTPS) and the built dashboard in a container
   named `cloider-docs-shots-web` on port 3211,
4. opens each shot's route in headless Chrome at 1440x900, device scale factor 2, follows the steps in `shots.mjs`,
   and writes a WebP (quality 80, lowered until the file is under 450 KB) to
   `static/img/screenshots/<file>`. Pages are opened as `https://cloider.com/...`, which Chrome is told to resolve
   to the mock (`--host-resolver-rules`, with a self-signed certificate made by `openssl` into `out/tls`), so the
   origin the dashboard prints into commands reads like production. The run checks that the name really reaches
   the mock before it opens anything, so it never talks to the real site,
5. stops and removes the container, and lists any shot that failed or was skipped and any API route the dashboard
   asked for that the mock has no fixture for.

Environment variables: `SHOTS_PORT` (3210), `SHOTS_TLS_PORT` (3443), `SHOTS_NUXT_PORT` (3211), `SHOTS_WEB_DIR` (where the copy of web lives,
`out/web`), `SHOTS_CONTAINER`, `SHOTS_CHROME` (path to the Chrome binary), `SHOTS_NOW` (the demo "now", see below).

To click around the demo dashboard yourself, run `npm run shots -- --keep apps/list`, then `npm run mock` and open
<http://localhost:3210>. Without a `shots_session` cookie you are logged out; set `shots_session=jane` in the
browser's devtools to log in as Jane Doe.

## How it fits together

| File | What it is |
| --- | --- |
| `shots.json` | the canonical list: file, route, what must be on screen |
| `manifest/*.json` | extra shots added by docs writers, same fields |
| `shots.mjs` | how to reach each shot's state: route overrides, session, and the clicks to make |
| `capture.mjs` | the runner: copy, build, container, browser, WebP |
| `mock/server.mjs` | one origin for the browser, like nginx in production: `/api/*` is the mock API, `/__mock/*` serves avatars and fake terminals, everything else (websockets included) is proxied to the dashboard container |
| `mock/fixtures.mjs` | the demo data |
| `mock/terminal.mjs` | the canned cluster, app and database terminal sessions, drawn with xterm.js like ttyd does |

Server side rendering calls the same mock through `NUXT_INTERNAL_API_URL=http://host.docker.internal:3210/api`.
The session comes from a `shots_session` cookie: `jane` (default, Owner of her account, paid plan), `trial` (the
same account on the free trial), `choose` (logged in, no account picked yet) or none (logged out).

Dates in the fixtures are relative to `NOW` in `mock/fixtures.mjs` (October 20, 2026), and the browser's clock starts
at the same moment, so "3 days ago", the backups calendar and the usage charts come out the same on every run.
`Math.random` is seeded too, for the suggested subdomain suffix.

## Adding or fixing a shot

- A new shot only needs a line in `shots.json` or a `manifest/*.json`. If it is the page as it loads, that is
  enough. If it needs clicks, add an entry keyed by its file name to `actions` in `shots.mjs`; a shot whose
  `actions` text is not empty is skipped until it has one.
- Animations and transitions are switched off, toasts and the route loading bar are hidden, and the pointer is
  parked in a corner before each capture. A shot that has to show more than 900px can ask for a taller viewport.
- When a page shows "Not found", an error or an empty state, look at the end of the run for routes the mock has no
  fixture for, and add them to `mock/server.mjs` with data in `mock/fixtures.mjs`. Response shapes follow
  `web/composables/api/**`.
- Keep the data fictional: `example.com`, `*.example` emails, documentation IP ranges (`192.0.2.0/24`,
  `198.51.100.0/24`, `203.0.113.0/24`), `cldr_xxxxxxxxxxxxxxxxxxxxxxxx` for tokens.
- Look at the images you changed before committing them.
