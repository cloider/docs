import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const SITE_URL = 'https://docs.cloider.com';
const DESCRIPTION =
  'Cloider documentation: serverless Kubernetes, apps, managed PostgreSQL, MySQL, MongoDB and Redis, ' +
  'S3 object storage, container registry, domains and DNS. Guides and examples for the dashboard, CLI, ' +
  'Terraform, REST API and MCP.';

const config: Config = {
  title: 'Cloider Docs',
  tagline: 'Pay as you go serverless Kubernetes, apps, databases and storage',
  favicon: 'favicon.ico',

  url: SITE_URL,
  baseUrl: '/',
  trailingSlash: false,

  organizationName: 'cloider',
  projectName: 'docs',

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  onDuplicateRoutes: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
      onBrokenMarkdownImages: 'throw',
    },
  },

  themes: ['@docusaurus/theme-mermaid'],

  headTags: [
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.googleapis.com'}},
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous'}},
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Roboto+Mono:wght@400;500;600&display=swap',
      },
    },
    {tagName: 'link', attributes: {rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png'}},
    {tagName: 'link', attributes: {rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png'}},
    {tagName: 'link', attributes: {rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png'}},
    // Points AI crawlers and agents at the plain text versions of the docs
    {tagName: 'link', attributes: {rel: 'alternate', type: 'text/plain', title: 'llms.txt', href: '/llms.txt'}},
    {tagName: 'link', attributes: {rel: 'alternate', type: 'text/plain', title: 'llms-full.txt', href: '/llms-full.txt'}},
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': 'https://cloider.com/#organization',
            name: 'Cloider',
            url: 'https://cloider.com',
            logo: `${SITE_URL}/img/logo.png`,
            sameAs: [
              'https://x.com/cloider',
              'https://www.linkedin.com/company/cloider',
              'https://www.youtube.com/@cloider',
              'https://fb.com/cloider',
              'https://instagram.com/cloider_cloud',
              'https://github.com/cloider',
            ],
          },
          {
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            name: 'Cloider Docs',
            url: SITE_URL,
            description: DESCRIPTION,
            inLanguage: 'en',
            publisher: {'@id': 'https://cloider.com/#organization'},
            potentialAction: {
              '@type': 'SearchAction',
              target: `${SITE_URL}/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          },
        ],
      }),
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          showLastUpdateTime: true,
          breadcrumbs: true,
          // A section's overview page is already its category link, so it is left
          // out of the items generated from the same folder
          async sidebarItemsGenerator({defaultSidebarItemsGenerator, ...args}) {
            const items = await defaultSidebarItemsGenerator(args);
            const dir = args.item.dirName;
            return items.filter(
              (item) => !(item.type === 'doc' && (item.id === `${dir}/overview` || item.id === `${dir}/index`)),
            );
          },
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          lastmod: 'date',
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/search'],
          filename: 'sitemap.xml',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexBlog: false,
        indexPages: false,
        docsRouteBasePath: '/',
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        searchResultLimits: 10,
        searchBarShortcutHint: true,
      },
    ],
    [
      'docusaurus-plugin-llms',
      {
        title: 'Cloider documentation',
        description: DESCRIPTION,
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        generateMarkdownFiles: true,
        excludeImports: true,
        removeDuplicateHeadings: true,
        includeOrder: [
          'introduction.mdx',
          'quick-start.mdx',
          'get-started/**',
          'concepts/**',
          'apps/**',
          'kubernetes/**',
          'databases/**',
          'object-storage/**',
          'container-registry/**',
          'domains/**',
          'account/**',
          'guides/**',
          'cli/**',
          'terraform/**',
          'api/**',
          'mcp/**',
          'reference/**',
        ],
      },
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    metadata: [
      {name: 'keywords', content: 'cloider, serverless kubernetes, pay as you go kubernetes, managed postgresql, managed mysql, managed redis, managed mongodb, s3 object storage, container registry, paas, kubernetes hosting, cloider cli, cloider terraform, cloider api, cloider mcp'},
      {name: 'twitter:card', content: 'summary_large_image'},
      {name: 'twitter:site', content: '@cloider'},
      {name: 'theme-color', content: '#050d1b'},
      {property: 'og:type', content: 'website'},
      {property: 'og:site_name', content: 'Cloider Docs'},
      {property: 'og:locale', content: 'en_US'},
    ],
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
    announcementBar: {
      id: 'trial',
      content:
        'New to Cloider? Every account starts with a 14 day free trial and $25 in free credit. <a href="https://cloider.com" target="_blank" rel="noopener">Sign up</a>',
      backgroundColor: '#003c71',
      textColor: '#e4f6ff',
      isCloseable: true,
    },
    navbar: {
      title: 'Cloider',
      hideOnScroll: false,
      logo: {
        alt: 'Cloider logo',
        src: 'img/logo.png',
        width: 34,
        height: 34,
      },
      // Plain links with activeBaseRegex: every page is in the one sidebar, so doc
      // type items would all show as active on every page
      items: [
        {
          to: '/introduction',
          label: 'Docs',
          position: 'left',
          activeBaseRegex: '^/(introduction|quick-start|get-started|concepts|account|reference)(/|$)',
        },
        {
          type: 'dropdown',
          label: 'Products',
          position: 'left',
          items: [
            {to: '/apps/overview', label: 'Apps', activeBaseRegex: '^/apps/'},
            {to: '/kubernetes/overview', label: 'Kubernetes', activeBaseRegex: '^/kubernetes/'},
            {to: '/databases/overview', label: 'Databases', activeBaseRegex: '^/databases/'},
            {to: '/object-storage/overview', label: 'Object Storage', activeBaseRegex: '^/object-storage/'},
            {to: '/container-registry/overview', label: 'Container Registry', activeBaseRegex: '^/container-registry/'},
            {to: '/domains/overview', label: 'Domains and DNS', activeBaseRegex: '^/domains/'},
          ],
        },
        {to: '/cli/overview', label: 'CLI', position: 'left', activeBaseRegex: '^/cli/'},
        {to: '/terraform/overview', label: 'Terraform', position: 'left', activeBaseRegex: '^/terraform/'},
        {to: '/api/overview', label: 'API', position: 'left', activeBaseRegex: '^/api/'},
        {to: '/mcp/overview', label: 'MCP', position: 'left', activeBaseRegex: '^/mcp/'},
        {to: '/guides', label: 'Guides', position: 'left', activeBaseRegex: '^/guides(/|$)'},
        {href: 'https://cloider.com', label: 'cloider.com', position: 'right'},
        {
          href: 'https://cloider.com/dashboard',
          label: 'Dashboard',
          position: 'right',
          className: 'navbar-cta',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Products',
          items: [
            {label: 'Apps', to: '/apps/overview'},
            {label: 'Kubernetes', to: '/kubernetes/overview'},
            {label: 'Databases', to: '/databases/overview'},
            {label: 'Object Storage', to: '/object-storage/overview'},
            {label: 'Container Registry', to: '/container-registry/overview'},
            {label: 'Domains and DNS', to: '/domains/overview'},
          ],
        },
        {
          title: 'Tools',
          items: [
            {label: 'CLI', to: '/cli/overview'},
            {label: 'Terraform provider', to: '/terraform/overview'},
            {label: 'REST API', to: '/api/overview'},
            {label: 'MCP server', to: '/mcp/overview'},
          ],
        },
        {
          title: 'Resources',
          items: [
            {label: 'Quick start', to: '/quick-start'},
            {label: 'Guides', to: '/guides'},
            {label: 'FAQ', to: '/reference/faq'},
            {label: 'llms.txt', href: `${SITE_URL}/llms.txt`},
          ],
        },
        {
          title: 'Company',
          items: [
            {label: 'cloider.com', href: 'https://cloider.com'},
            {label: 'Pricing', href: 'https://cloider.com/#pricing'},
            {label: 'Contact us', href: 'https://cloider.com/contact-us'},
            {label: 'Privacy', href: 'https://cloider.com/privacy'},
            {label: 'Terms', href: 'https://cloider.com/terms'},
          ],
        },
      ],
      copyright: `© 2024-${new Date().getFullYear()} Cloider. All rights reserved.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.oceanicNext,
      additionalLanguages: ['bash', 'hcl', 'json', 'yaml', 'docker', 'sql', 'go', 'python', 'toml', 'ini', 'powershell', 'nginx', 'diff', 'php', 'ruby', 'java'],
      magicComments: [
        {className: 'theme-code-block-highlighted-line', line: 'highlight-next-line', block: {start: 'highlight-start', end: 'highlight-end'}},
      ],
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
