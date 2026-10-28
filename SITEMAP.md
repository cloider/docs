# Docs page map

Every page below must exist with exactly this path, so pages can link to each other before all of them are written.
Link to them as `/<path without .mdx>` (an `index.mdx` is its folder: `/guides`). A section may add pages, but not
rename or drop these. Link only to pages on this list or pages you create yourself, and don't link to anchors in other
sections' pages.

## Root
- `introduction.mdx`: what Cloider is, products, tools, how to read the docs
- `quick-start.mdx`: sign up, deploy an app, create a cluster, in 5 minutes

## get-started/
- `index.mdx`: overview of the getting started path
- `create-an-account.mdx`: sign up with Google or GitHub, the free trial and credit, verifying, first login
- `dashboard-tour.mdx`: the dashboard layout, sidebar, search, account menu, notifications
- `choose-a-tool.mdx`: dashboard vs CLI vs Terraform vs API vs MCP, when to use which
- `deploy-your-first-app.mdx`: first app, step by step
- `create-your-first-cluster.mdx`: first Kubernetes cluster and kubectl, step by step
- `install-the-cli.mdx`: install and log in, short, links to the CLI section

## concepts/
- `index.mdx`
- `how-cloider-works.mdx`: the platform, serverless model, how each product runs, regions
- `accounts-and-roles.mdx`: users, accounts, members, roles and what each can do
- `billing-model.mdx`: pay as you go, metering, trial, credit, invoices, what paused resources cost
- `resource-lifecycle.mdx`: create, provisioning, ready, paused, deleting; names, labels and ids
- `security.mdx`: isolation, TLS, tokens, trusted sources, shared responsibility

## apps/
- `overview.mdx`
- `deploy-from-git.mdx`: GitHub, GitLab, Bitbucket, auto deploy on push
- `deploy-from-your-computer.mdx`: `cloider deploy` and uploading source
- `deploy-an-image.mdx`: run a prebuilt Docker image from any registry, private logins, the Deploy button and the deploy hook
- `cron-jobs.mdx`: an app run on a cron schedule, its schedule syntax, runs, Run now, logs per run, the terminal between runs and per-run billing
- `build-configuration.mdx`: detection, Dockerfile vs buildpacks, port, build args and build env
- `supported-languages.mdx`
- `environment-variables.mdx`: runtime variables and secrets
- `builds-and-deployments.mdx`: build history, logs, retries, redeploys
- `logs.mdx`
- `insights.mdx`
- `terminal-and-exec.mdx`
- `domains.mdx`: the app's free subdomain and custom domains
- `settings.mdx`: what the Settings tab changes
- `pause-resume-and-delete.mdx`
- `troubleshooting.mdx`

## kubernetes/
- `overview.mdx`
- `create-a-cluster.mdx`
- `connect-with-kubectl.mdx`: kubeconfig, contexts
- `web-terminal-and-exec.mdx`
- `deploy-a-workload.mdx`: first Deployment and Service
- `helm.mdx`
- `load-balancers.mdx`
- `persistent-volumes.mdx`
- `expose-services.mdx`: cluster services, targets and domains, ingress
- `pull-private-images.mdx`
- `pause-and-resume.mdx`
- `delete-a-cluster.mdx`
- `limits-and-compatibility.mdx`
- `troubleshooting.mdx`

## databases/
- `overview.mdx`
- `create-a-database.mdx`
- `connect.mdx`: connection details, public and private endpoints, passwords
- `postgresql.mdx`
- `mysql.mdx`
- `mongodb.mdx`
- `redis.mdx`
- `trusted-sources.mdx`
- `ssl-tls.mdx`
- `backups-and-restore.mdx`
- `resize.mdx`
- `insights.mdx`
- `terminal-and-exec.mdx`
- `pause-resume-and-delete.mdx`
- `troubleshooting.mdx`

## object-storage/
- `overview.mdx`
- `create-a-bucket.mdx`
- `access-keys.mdx`
- `s3-tools.mdx`: AWS CLI, rclone, s3cmd and others
- `sdks.mdx`: JavaScript, Python, Go, PHP and others
- `manage-files.mdx`: the file browser and the CLI
- `public-and-private-buckets.mdx`
- `static-websites.mdx`: serve a public bucket as a website, on its own address or a domain
- `bucket-policies.mdx`
- `cors.mdx`: which websites may use a bucket from a browser
- `versioning.mdx`
- `data-protection.mdx`
- `lifecycle-rules.mdx`
- `usage-and-billing.mdx`
- `delete-a-bucket.mdx`
- `troubleshooting.mdx`

## container-registry/
- `overview.mdx`
- `create-a-project.mdx`
- `push-and-pull-images.mdx`
- `tokens.mdx`
- `use-with-kubernetes.mdx`
- `ci-cd.mdx`
- `repositories-and-tags.mdx`
- `retention-policies.mdx`
- `immutable-tags.mdx`
- `usage-and-billing.mdx`
- `delete-a-project.mdx`
- `troubleshooting.mdx`

## domains/
- `overview.mdx`
- `free-subdomains.mdx`
- `add-a-custom-domain.mdx`
- `nameservers.mdx`
- `dns-records.mdx`
- `email-dns-records.mdx`: MX, SPF, DKIM, DMARC
- `targets.mdx`
- `https-certificates.mdx`
- `delete-a-domain.mdx`
- `troubleshooting.mdx`

## account/
- `index.mdx`
- `access-control.mdx`: members and roles
- `api-tokens.mdx`
- `switch-accounts.mdx`
- `billing.mdx`
- `usage.mdx`
- `notifications.mdx`
- `support.mdx`

## cli/
- `overview.mdx`
- `install.mdx`
- `authentication.mdx`
- `configuration.mdx`
- `output-and-scripting.mdx`: output formats, exit codes, CI
- `updating.mdx`
- `shell-completion.mdx`
- `commands/index.mdx`: every command at a glance
- `commands/cluster.mdx`
- `commands/db.mdx`
- `commands/bucket.mdx`
- `commands/registry.mdx`
- `commands/app.mdx`
- `commands/deploy.mdx`
- `commands/git.mdx`
- `commands/domain.mdx`
- `commands/dns.mdx`
- `commands/target.mdx`
- `commands/support.mdx`
- `commands/account.mdx`: usage, billing, pricing, member, token, whoami
- `commands/auth-and-profiles.mdx`: login, logout, profile
- `commands/tooling.mdx`: version, update, completion
- `commands/mcp.mdx`

## terraform/
- `overview.mdx`
- `get-started.mdx`
- `provider-configuration.mdx`
- `resources/cluster.mdx`
- `resources/database.mdx`
- `resources/bucket.mdx`
- `resources/bucket-key.mdx`
- `resources/registry.mdx`
- `resources/registry-token.mdx`
- `resources/domain.mdx`
- `resources/dns-record.mdx`
- `resources/target.mdx`
- `data-sources/cluster.mdx`
- `data-sources/options.mdx`
- `data-sources/bucket-regions.mdx`
- `guides/import-existing-resources.mdx`
- `guides/kubernetes-and-helm.mdx`
- `guides/object-storage.mdx`
- `guides/state-backend.mdx`
- `guides/multiple-environments.mdx`
- `guides/ci-cd.mdx`

## api/
- `overview.mdx`
- `authentication.mdx`
- `errors.mdx`
- `rate-limits.mdx`
- `endpoints/account.mdx`: whoami, session, dashboard, options, pricing, usage, billing, members, API tokens
- `endpoints/clusters.mdx`
- `endpoints/databases.mdx`
- `endpoints/buckets.mdx`
- `endpoints/bucket-objects.mdx`
- `endpoints/bucket-keys.mdx`
- `endpoints/registry.mdx`
- `endpoints/registry-tokens.mdx`
- `endpoints/apps.mdx`
- `endpoints/app-builds.mdx`
- `endpoints/git.mdx`
- `endpoints/domains.mdx`
- `endpoints/dns-records.mdx`
- `endpoints/targets.mdx`
- `endpoints/support.mdx`

## mcp/
- `overview.mdx`
- `setup.mdx`: Claude Code, Claude Desktop, Cursor, VS Code, Windsurf, Codex, Gemini CLI and others
- `tools.mdx`: every tool, by toolset
- `safety-and-permissions.mdx`
- `example-prompts.mdx`
- `ai-coding-agents.mdx`: llms.txt, Markdown pages, AGENTS.md snippets

## guides/
- `index.mdx`
- `full-stack-app-with-postgresql.mdx`
- `wordpress-on-kubernetes.mdx`
- `ci-cd-with-github-actions.mdx`
- `ci-cd-with-gitlab.mdx`
- `infrastructure-as-code-with-terraform.mdx`
- `back-up-a-database-to-a-bucket.mdx`
- `static-assets-on-object-storage.mdx`
- `manage-cloider-with-an-ai-agent.mdx`
- `migrate-to-cloider.mdx`

## reference/
- `index.mdx`
- `pricing.mdx`
- `limits-and-quotas.mdx`
- `status-values.mdx`
- `glossary.mdx`
- `faq.mdx`
- `troubleshooting.mdx`
