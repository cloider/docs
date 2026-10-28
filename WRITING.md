# Writing the Cloider docs

The rules every page in `docs/` follows. The bar is [docs.k3s.io](https://docs.k3s.io/): complete, exact,
and full of examples a reader can paste. Pages are written for three readers at once:

1. **Beginners**, who have never used Kubernetes, S3 or Terraform. Explain a term the first time it is used on a page,
   or link it to [the glossary](docs/reference/glossary.mdx).
2. **Experienced engineers**, who want the exact flag, field, limit or error and nothing else. Tables and reference
   sections are for them.
3. **AI assistants and answer engines** (ChatGPT, Claude, Perplexity, Google AI Overviews), which quote pages to answer
   questions. They need self-contained sentences, explicit names and numbers, and question shaped headings.

## Accuracy comes first

- Every fact is checked against the code in this repo before it is written: routes in `api/routes/routes.go` and
  `api/controllers/`, request and response shapes in `web/composables/api/**`, CLI commands and flags in `cli/cmd/`,
  MCP tools in `cli/cmd/mcp_tools.go`, Terraform schemas in `terraform/docs/` and `terraform/internal/provider/`,
  dashboard behaviour in `web/pages/dashboard/**` and `web/components/dashboard/**`, limits and enums in `common/`.
- Never invent a flag, field, endpoint, limit, price, version or error message. If the code doesn't say it, leave it out
  or describe it generally.
- Prices change. Describe how something is billed and link to [pricing](https://cloider.com/#pricing) or
  `/reference/pricing`; don't hard code amounts unless they are constants in the code.
- Staff only features are not documented: the CRM (support agent, users, prices), impersonation, internal hostnames,
  the platform's own cluster topology, backup storage vendors, secrets.
- Underlying open source projects are named only when it helps the reader (for example "S3 compatible", "standard
  Kubernetes API", "Docker Registry HTTP API V2 compatible"), never internal service names.
- Describe what the user sees and gets, never how Cloider is built: no platform stack or distribution names, source
  paths, platform namespaces or internal script names, internal schedules and sampling intervals, allocation schemes
  (such as port ranges), how passwords or tokens are stored, or how firewalls, isolation and rate limits are enforced.
  Exact error messages, validation rules and anything the dashboard itself shows are fine.

## Style

- Second person, present tense, active voice: "Create a bucket", "Cloider creates...". US English.
- **No em dashes or en dashes as punctuation, anywhere** (prose, tables, code comments, front matter). Use a comma, a
  colon, parentheses or a full stop. Hyphens inside words (pay-as-you-go, read-only) are fine.
- No emojis. No marketing superlatives ("blazing", "seamless"). Be concrete instead.
- Short paragraphs (1 to 4 sentences). One idea per paragraph.
- Sentence case headings. Prefer headings a person would type into a search box: "How is a paused cluster billed?",
  "Connect to PostgreSQL with psql".
- The first sentence under a heading answers it on its own, so it can be quoted without context.
- Name things exactly as the dashboard does (button labels in **bold**: click **Create cluster**).
- Use real looking, fictional examples rather than `<placeholders>` where it reads better. The shared example universe:

  | Thing | Example names |
  | --- | --- |
  | Account | Acme Inc |
  | Apps | `blog`, `api`, `web`, and `admin` (runs the Docker image `ghcr.io/acme/admin`) |
  | Kubernetes clusters | `staging`, `production` |
  | Databases | `orders-db` (PostgreSQL), `shop-db` (MySQL), `catalog-db` (MongoDB), `cache` (Redis) |
  | Buckets | `acme-assets`, `acme-backups` |
  | Registry project | `acme` |
  | Domains | `example.com`, `blog.cloider.app` |
  | API token | `cldr_xxxxxxxxxxxxxxxxxxxxxxxx` (never a real one) |

  When a placeholder is unavoidable, write it as `<cluster-name>` in prose and `CLUSTER_NAME` in shell variables.

## Page anatomy

Every page is an `.mdx` file in kebab-case with this front matter:

```yaml
---
title: Create a Kubernetes cluster          # 60 characters or fewer, contains the main search term
sidebar_label: Create a cluster              # short, for the sidebar
sidebar_position: 2
description: Create a serverless Kubernetes cluster on Cloider from the dashboard, CLI, Terraform, REST API or an AI agent, and connect to it with kubectl.
keywords: [cloider kubernetes, create kubernetes cluster, kubectl, kubeconfig, serverless kubernetes]
---
```

- `description` is 120 to 160 characters, a complete sentence that says what the reader gets. It becomes the search
  snippet, the `llms.txt` summary and the social preview.
- Don't write an `# H1` in the body: the title comes from front matter and the page actions bar is placed under it.
- **Opening paragraph**: one to three sentences that say what the thing is or what the page does, before any heading.
- Concept and overview pages: then an **At a glance** list or table (what it is, what it costs, limits, which tools
  manage it).
- How-to pages: **Before you begin** (prerequisites with links), numbered **steps**, **Verify** (how to tell it worked),
  **Troubleshooting** for the errors people actually hit, **Next steps** (2 to 4 links).
- Overview pages and big how-tos end with an `<FAQ>` of 3 to 8 questions.

## Doing a task with every tool

Any task that more than one tool can do is shown in tabs, always in this order and with these values, so that a
reader's choice sticks across the whole site:

````mdx
<Tabs groupId="interface" queryString>
<TabItem value="dashboard" label="Dashboard" default>

1. Open **Kubernetes** in the sidebar and click **Create cluster**.
2. ...

</TabItem>
<TabItem value="cli" label="CLI">

```bash
cloider cluster create staging --wait
```

</TabItem>
<TabItem value="terraform" label="Terraform">

```hcl title="main.tf"
resource "cloider_cluster" "staging" {
  name = "staging"
}
```

</TabItem>
<TabItem value="api" label="API">

```bash
curl -X POST https://cloider.com/api/clusters \
  -H "Authorization: Bearer $CLOIDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "staging"}'
```

</TabItem>
<TabItem value="mcp" label="MCP">

Ask your agent:

```text title="Prompt"
Create a Kubernetes cluster called staging and wait until it is ready.
```

It calls the `create_cluster` tool:

```json title="Tool call: create_cluster"
{"name": "staging", "wait": true}
```

</TabItem>
</Tabs>
````

- Keep all five tabs. When a tool can't do the task, keep its tab with one sentence saying so and pointing at the tool
  that can (for example API tokens are created in the dashboard only).
- **Dashboard**: numbered steps with the exact labels, plus a screenshot where it helps.
- **CLI**: the command, then realistic output in a separate `text` block titled `Output`. Flags must exist in
  `cli/cmd/`. Show `--wait`, `-o json` and similar where useful.
- **Terraform**: a complete, valid resource with attribute names from `terraform/docs/`. Show outputs where useful.
- **API**: `curl` against `https://cloider.com/api/...` with `$CLOIDER_TOKEN`, then the response in a `json` block titled
  `Response`. Field names must match the controller and `web/composables/api/**`. Trim long responses with a
  realistic subset, never invent fields.
- **MCP**: the natural language prompt, then the tool call with arguments exactly as `cli/cmd/mcp_tools.go` defines them.
- Don't indent the content of a `TabItem`, and leave a blank line after `<TabItem ...>` and before `</TabItem>`,
  otherwise MDX doesn't parse the Markdown inside it.

## Screenshots

Dashboard screenshots live in `static/img/screenshots/<section>/<name>.webp` and are captured by
`tools/screenshots/` from the real dashboard rendered against demo data. Use the component, which draws the browser frame:

```mdx
<Screenshot
  src="/img/screenshots/kubernetes/list.webp"
  url="/dashboard/clusters"
  alt="The Kubernetes page listing two clusters, staging and production, both running"
  caption="Your clusters, with their status, plan and creation date."
/>
```

- `alt` describes what is in the picture (it is what search engines and screen readers get).
- Use the names in `tools/screenshots/shots.json`. A screenshot that isn't listed there yet is added to
  `tools/screenshots/manifest/<section>.json` as `{"file", "route", "state", "actions"}` so it can be captured.
- Never use a screenshot of real customer data.

## Components available in every page

| Component | Use it for |
| --- | --- |
| `<Tabs>` / `<TabItem>` | Interface tabs above, or alternatives (for example macOS, Linux, Windows with `groupId="os"`) |
| `<Screenshot>` | Dashboard screenshots |
| `<FAQ items={[{q: '...', a: '...'}]} />` | Questions and answers, with FAQPage structured data. Answers are plain text, `\n\n` splits paragraphs |
| `<Cards cols={2}>` / `<Card title href icon>` | Link grids on overview pages. `icon` is a name from `src/components/Icon/icons.ts` |
| `<Logos items={[{src: '/img/logos/redis.svg', alt: 'Redis'}]} />` | A row of small product logos. Never use a plain Markdown image for a logo, the SVGs render hundreds of pixels wide |
| `<DocCardList />` | Cards for every page in the current category, on index pages |
| Admonitions | `:::tip`, `:::note`, `:::info`, `:::warning`, `:::danger`, with a title: `:::warning[Deleting is permanent]` |
| Mermaid | ```` ```mermaid ```` diagrams for flows and architecture |
| `<details><summary>` | Long output or optional detail |

## Links

- Link with site absolute paths and no extension: `[create a cluster](/kubernetes/create-cluster)`. The build fails on a
  broken link or anchor, so link only to pages and headings that exist.
- Link the first mention of another product, tool or concept on a page.

## MDX pitfalls

- `{`, `}` and `<` in prose must be in code spans or escaped (`\{`), or MDX reads them as JSX.
- Comments are `{/* ... */}`, not `<!-- -->`.
- JSX props take JavaScript strings: escape `'` inside `'...'`, or use double quotes.
- Tables can't contain fenced code blocks; use inline code.

## Section layout

| Folder | URL | Contents |
| --- | --- | --- |
| `get-started/` | `/get-started` | account, dashboard tour, first app, installing the CLI, API tokens for tools |
| `concepts/` | `/concepts` | how Cloider works, accounts and roles, billing model, resource lifecycle, regions, security |
| `apps/` | `/apps` | App Engine |
| `kubernetes/` | `/kubernetes` | Serverless Kubernetes clusters, load balancers, volumes |
| `databases/` | `/databases` | PostgreSQL, MySQL, MongoDB, Redis |
| `object-storage/` | `/object-storage` | S3 compatible buckets |
| `container-registry/` | `/container-registry` | registry projects, tokens, policies |
| `domains/` | `/domains` | subdomains, custom domains, DNS records, targets |
| `account/` | `/account` | access control, API tokens, billing, usage, notifications, support |
| `cli/` | `/cli` | CLI install, auth, configuration, full command reference |
| `terraform/` | `/terraform` | provider, every resource and data source, guides |
| `api/` | `/api` | REST API: auth, errors, rate limits, every endpoint |
| `mcp/` | `/mcp` | the MCP server, client setup, tool reference, prompts |
| `guides/` | `/guides` | end to end tutorials |
| `reference/` | `/reference` | pricing model, limits, glossary, FAQ, troubleshooting, status values |
