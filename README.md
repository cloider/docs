# Cloider docs

The public documentation at https://docs.cloider.com, a [Docusaurus](https://docusaurus.io/) 3 site.
Dark mode is the default, with a light mode switch, and the theme follows the cloider.com design system
(`src/css/custom.css` mirrors `web/assets/homepage.css`, `dashboard.css` and `primevue.config.ts`).

```sh
cd services/docs
npm install
npm start          # http://localhost:3000, reloads on save
npm run build      # static site in build/, fails on any broken link or anchor
npm run serve      # serve build/ (search and the .md twins only work in a build)
node tools/check-docs.mjs   # writing rules, missing screenshots, SITEMAP.md coverage
```

## Writing

Read [WRITING.md](WRITING.md) before writing a page. In short: every fact is checked against the code in this
repo, tasks are shown in Dashboard, CLI, Terraform, API and MCP tabs, there are no em dashes, and every page has a
`description` and `keywords` in its front matter. [SITEMAP.md](SITEMAP.md) is the page map.

When an api route, CLI command, MCP tool or Terraform schema changes, the page that documents it changes in the
same merge request, like the CLI and the Terraform provider do.

| Path | What it is |
| --- | --- |
| `docs/` | The pages, one folder per sidebar section |
| `sidebars.ts` | The sidebar: one section per folder, ordered by `sidebar_position` |
| `src/pages/index.tsx` | The landing page |
| `src/components/` | `Screenshot`, `FAQ`, `Cards`, `Icon`, `PageActions`, available in every page without an import |
| `src/theme/` | Swizzled theme parts: the page actions under each title and TechArticle structured data |
| `static/img/screenshots/` | Dashboard screenshots, captured by `tools/screenshots` |
| `tools/screenshots/` | Renders the real dashboard against a mock api with demo data and captures `shots.json` |
| `tools/social-card.html` | Source of `static/img/social-card.png`, render it at 1200x630 |
| `tools/mcp-tools/generate.sh` | Regenerates `docs/mcp/tools.mdx` from `cli/cmd/mcp_tools.go`; run it when an MCP tool changes |
| `tools/check-docs.mjs` | Writing rules, front matter YAML, missing screenshots and SITEMAP.md coverage |

## SEO and AI readiness

- `sitemap.xml`, canonical URLs, Open Graph and Twitter cards, and `robots.txt` that welcomes search and AI crawlers.
- Structured data: Organization and WebSite (with SearchAction) on every page, BreadcrumbList and TechArticle on
  doc pages, FAQPage wherever a page has an `<FAQ>`.
- [docusaurus-plugin-llms](https://github.com/rachfop/docusaurus-plugin-llms) writes `llms.txt`, `llms-full.txt` and a
  Markdown twin of every page at its URL plus `.md`. The buttons under each title copy that Markdown or open the page
  in Claude or ChatGPT.
- Local search (no third party service) with a `/search` page.

## Deploying

This directory is its own git repository, [github.com/cloider/docs](https://github.com/cloider/docs), checked out
inside the services repo (which ignores it) so `tools/mcp-tools/generate.sh` can still read `../cli`.

Every push to `main` runs `.github/workflows/deploy.yml`: it builds the `Dockerfile` (the site served by nginx on
port 80), pushes `registry.cloider.com/cloider/docs:<sha8>` and sets it on the `docs` Deployment in the `docs`
namespace of the prod cluster, behind the `docs.cloider.com` Ingress. The Deployment, Service and Ingress were
applied by hand and aren't kept in any repo.

The workflow's only secret is `KUBECONFIG`, for the `github-deployer` ServiceAccount in `k8s/`, which can only
update that Deployment and read the namespace's pull secret `regcred`, the registry.cloider.com login the image is
pushed and pulled with. One-time setup:

```sh
kubectl --context prod apply -f k8s/github-deployer.yaml
k8s/kubeconfig.sh | gh secret set KUBECONFIG -R cloider/docs
```

To build the image locally:

```sh
docker build -t cloider-docs . && docker run --rm -p 8080:80 cloider-docs
```
