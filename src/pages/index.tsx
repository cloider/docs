import React, {useState, type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import CodeBlock from '@theme/CodeBlock';
import Icon from '@site/src/components/Icon';
import styles from './index.module.css';

const products = [
  {
    name: 'Apps',
    category: 'Compute',
    icon: 'rocket-launch-outline',
    href: '/apps/overview',
    desc: 'Push code, get a live HTTPS URL. Dockerfile or buildpacks, auto deploy on every push from GitHub, GitLab or Bitbucket.',
    featured: true,
    points: ['Deploy from git or a local folder', 'Free *.cloider.app subdomain with HTTPS', 'Live logs, builds and secret variables'],
  },
  {
    name: 'Kubernetes',
    category: 'Compute',
    icon: 'kubernetes',
    href: '/kubernetes/overview',
    desc: 'Serverless Kubernetes clusters ready in seconds. No nodes to manage, billed on what your pods actually use.',
    featured: true,
    points: ['kubectl, Helm and a browser terminal', 'Load balancers and persistent volumes', 'Pause and resume whole clusters'],
  },
  {
    name: 'Databases',
    category: 'Data',
    icon: 'database-outline',
    href: '/databases/overview',
    desc: 'PostgreSQL, MySQL, MongoDB and Redis with daily backups, SSL and trusted sources.',
  },
  {
    name: 'Object Storage',
    category: 'Storage',
    icon: 'bucket-outline',
    href: '/object-storage/overview',
    desc: 'S3 compatible buckets with versioning, lifecycle rules and policies.',
  },
  {
    name: 'Container Registry',
    category: 'Storage',
    icon: 'docker',
    href: '/container-registry/overview',
    desc: 'Private images at registry.cloider.com with scoped tokens and retention.',
  },
  {
    name: 'Domains and DNS',
    category: 'Networking',
    icon: 'web',
    href: '/domains/overview',
    desc: 'Free subdomains or your own domain, DNS records and automatic HTTPS.',
  },
];

const tools: {id: string; label: string; icon: string; href: string; lang: string; title?: string; code: string}[] = [
  {
    id: 'cli',
    label: 'CLI',
    icon: 'console',
    href: '/cli/overview',
    lang: 'bash',
    code: `curl -fsSL https://cloider.com/install.sh | sh
cloider login

# deploy the current folder to a live URL
cloider deploy

# a Kubernetes cluster and a PostgreSQL database
cloider cluster create staging --wait
cloider db create orders-db --engine postgresql --wait`,
  },
  {
    id: 'terraform',
    label: 'Terraform',
    icon: 'terraform',
    href: '/terraform/overview',
    lang: 'hcl',
    title: 'main.tf',
    code: `terraform {
  required_providers {
    cloider = { source = "cloider/cloider" }
  }
}

provider "cloider" {} # reads CLOIDER_TOKEN

resource "cloider_cluster" "staging" {
  name = "staging"
}`,
  },
  {
    id: 'api',
    label: 'REST API',
    icon: 'api',
    href: '/api/overview',
    lang: 'bash',
    code: `curl https://cloider.com/api/clusters \\
  -H "Authorization: Bearer $CLOIDER_TOKEN"`,
  },
  {
    id: 'mcp',
    label: 'MCP',
    icon: 'robot-outline',
    href: '/mcp/overview',
    lang: 'bash',
    code: `# give Claude Code (or any MCP client) a tool for every cloider command
claude mcp add cloider -- cloider mcp

# or only the tools that change nothing
claude mcp add cloider-readonly -- cloider mcp --read-only`,
  },
];

const starts = [
  {title: 'Quick start', desc: 'Sign up and deploy your first app in five minutes.', href: '/quick-start', icon: 'lightning-bolt'},
  {title: 'Deploy your first app', desc: 'From a repository or a folder to a live HTTPS URL.', href: '/get-started/deploy-your-first-app', icon: 'rocket-launch-outline'},
  {title: 'Create your first cluster', desc: 'A Kubernetes cluster and kubectl, step by step.', href: '/get-started/create-your-first-cluster', icon: 'kubernetes'},
  {title: 'Full stack app with PostgreSQL', desc: 'An app, a database and a custom domain, end to end.', href: '/guides/full-stack-app-with-postgresql', icon: 'layers-outline'},
  {title: 'CI/CD with GitHub Actions', desc: 'Build, push to the registry and deploy on every commit.', href: '/guides/ci-cd-with-github-actions', icon: 'source-branch'},
  {title: 'Manage Cloider with an AI agent', desc: 'Connect Claude or Cursor with the MCP server.', href: '/guides/manage-cloider-with-an-ai-agent', icon: 'robot-outline'},
];

function onPointerMove(e: React.PointerEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
}

function Hero(): ReactNode {
  return (
    <header className={styles.hero}>
      <div className={clsx(styles.glow, styles.glowCyan)} aria-hidden="true" />
      <div className={clsx(styles.glow, styles.glowLeft)} aria-hidden="true" />
      <div className={clsx('container', styles.heroInner)}>
        <div className={styles.eyebrows}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            Cloider documentation
          </span>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            Dashboard, CLI, Terraform, API and MCP
          </span>
        </div>
        <h1 className={styles.title}>
          <span className={styles.titleAccent}>Build, deploy and scale</span>
          <br />
          on Cloider
        </h1>
        <p className={styles.subtitle}>
          Everything you need to run apps, serverless Kubernetes, managed databases, object storage, a container
          registry and DNS on Cloider, with complete examples for every tool. Start with the basics or jump straight
          to the reference.
        </p>
        <div className={styles.ctas}>
          <Link className={styles.ctaPrimary} to="/quick-start">
            Quick start
            <span className={styles.ctaArrow} aria-hidden="true">
              →
            </span>
          </Link>
          <Link className={styles.ctaSecondary} to="/introduction">
            What is Cloider?
          </Link>
        </div>
        <ul className={styles.trust}>
          <li>
            <Icon name="check-circle" size={18} />
            14 day free trial
          </li>
          <li>
            <Icon name="check-circle" size={18} />
            $25 free credit
          </li>
          <li>
            <Icon name="check-circle" size={18} />
            Pay only for what you use
          </li>
        </ul>
      </div>
    </header>
  );
}

function Products(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Products</span>
          <h2 className={styles.h2}>
            Everything you need to build, <span className={styles.titleAccent}>ship and scale.</span>
          </h2>
          <p className={styles.lead}>Six managed services on one account and one bill. Each has a full guide, from the first click to the last API field.</p>
        </div>
        <div className={styles.bento}>
          {products.map((p) => (
            <Link
              key={p.name}
              to={p.href}
              className={clsx(styles.svcCard, p.featured && styles.svcFeatured)}
              onPointerMove={onPointerMove}>
              <div className={styles.svcHead}>
                <span className={styles.svcIcon}>
                  <Icon name={p.icon} size={22} />
                </span>
                <span className={styles.svcCategory}>{p.category}</span>
              </div>
              <h3 className={styles.svcName}>{p.name}</h3>
              <p className={styles.svcDesc}>{p.desc}</p>
              {p.points && (
                <ul className={styles.svcPoints}>
                  {p.points.map((pt) => (
                    <li key={pt}>
                      <Icon name="check-circle" size={16} />
                      {pt}
                    </li>
                  ))}
                </ul>
              )}
              <span className={styles.svcMore}>Read the docs →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Tools(): ReactNode {
  const [active, setActive] = useState(tools[0].id);
  const tool = tools.find((t) => t.id === active) ?? tools[0];
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Your tools</span>
          <h2 className={styles.h2}>
            Click, type, declare <span className={styles.titleAccent}>or just ask.</span>
          </h2>
          <p className={styles.lead}>
            Every task in these docs is shown in the dashboard, the CLI, Terraform, the REST API and MCP. Pick one and
            the docs remember it.
          </p>
        </div>
        <div className={styles.toolsPanel}>
          <div className={styles.toolTabs} role="tablist">
            {tools.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === active}
                className={clsx(styles.toolTab, t.id === active && styles.toolTabActive)}
                onClick={() => setActive(t.id)}>
                <Icon name={t.icon} size={18} />
                {t.label}
              </button>
            ))}
          </div>
          <div className={styles.toolCode}>
            <CodeBlock language={tool.lang} title={tool.title}>
              {tool.code}
            </CodeBlock>
            <Link className={styles.toolLink} to={tool.href}>
              {tool.label} documentation →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Starts(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Start here</span>
          <h2 className={styles.h2}>Popular guides</h2>
        </div>
        <div className={styles.startGrid}>
          {starts.map((s) => (
            <Link key={s.title} to={s.href} className={styles.startCard}>
              <span className={styles.svcIcon}>
                <Icon name={s.icon} size={20} />
              </span>
              <span>
                <span className={styles.startTitle}>{s.title}</span>
                <span className={styles.startDesc}>{s.desc}</span>
              </span>
            </Link>
          ))}
        </div>
        <div className={styles.aiBand}>
          <div>
            <h3>Docs that AI agents can read</h3>
            <p>
              Every page is available as Markdown by adding <code>.md</code> to its URL, and the whole site is in{' '}
              <a href="/llms.txt">llms.txt</a> and <a href="/llms-full.txt">llms-full.txt</a>. Point your coding agent
              at them, or connect it to your account with the MCP server.
            </p>
          </div>
          <Link className={styles.ctaPrimary} to="/mcp/ai-coding-agents">
            Docs for AI agents
            <span className={styles.ctaArrow} aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Cloider documentation"
      description="Documentation for Cloider: serverless Kubernetes, apps, managed PostgreSQL, MySQL, MongoDB and Redis, S3 object storage, container registry and DNS, with examples for the dashboard, CLI, Terraform, REST API and MCP.">
      <Head>
        <link rel="canonical" href="https://docs.cloider.com" />
      </Head>
      <main className={styles.page}>
        <Hero />
        <Products />
        <Tools />
        <Starts />
      </main>
    </Layout>
  );
}
