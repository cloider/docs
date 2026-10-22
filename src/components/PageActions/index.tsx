import React, {useState, type ReactNode} from 'react';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

// Copy a page as Markdown or hand it to an AI assistant. Each page has a Markdown
// twin at <url>.md, written at build time by docusaurus-plugin-llms.
export default function PageActions(): ReactNode {
  const {metadata} = useDoc();
  const {siteConfig} = useDocusaurusContext();
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle');

  const pageUrl = `${siteConfig.url}${metadata.permalink}`;
  const mdPath = `${metadata.permalink}.md`;
  const prompt = `Read ${pageUrl}.md and help me with Cloider. I may ask follow up questions about it.`;

  async function copyPage() {
    try {
      let text = '';
      const res = await fetch(mdPath);
      if (res.ok && (res.headers.get('content-type') ?? '').match(/markdown|text\/plain/)) {
        text = await res.text();
      } else {
        // dev server and older builds have no .md twin, the rendered text will do
        text = document.querySelector('article .markdown')?.textContent ?? '';
      }
      await navigator.clipboard.writeText(text);
      setCopied('done');
    } catch {
      setCopied('failed');
    }
    setTimeout(() => setCopied('idle'), 2000);
  }

  return (
    <div className={styles.actions} aria-label="Page actions">
      <button type="button" className={styles.action} onClick={copyPage}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1Z" />
        </svg>
        {copied === 'done' ? 'Copied' : copied === 'failed' ? 'Copy failed' : 'Copy page'}
      </button>
      <a className={styles.action} href={mdPath} target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41M6.81 15.19v-3.66l1.92 2.35l1.92-2.35v3.66h1.93V8.81h-1.93l-1.92 2.35l-1.92-2.35H4.89v6.38h1.92M19.69 12h-1.92V8.81h-1.92V12h-1.93l2.89 3.28L19.69 12Z" />
        </svg>
        View as Markdown
      </a>
      <a
        className={styles.action}
        href={`https://claude.ai/new?q=${encodeURIComponent(prompt)}`}
        target="_blank"
        rel="noopener">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2l2.1 6.6L21 9.5l-5.5 4.2L17.3 21 12 17l-5.3 4 1.8-7.3L3 9.5l6.9-.9L12 2Z" />
        </svg>
        Open in Claude
      </a>
      <a
        className={styles.action}
        href={`https://chatgpt.com/?hints=search&q=${encodeURIComponent(prompt)}`}
        target="_blank"
        rel="noopener">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3a9 9 0 1 0 9 9a9 9 0 0 0-9-9m0 16.2A7.2 7.2 0 1 1 19.2 12A7.21 7.21 0 0 1 12 19.2M11 7h2v6h-2Zm0 8h2v2h-2Z" />
        </svg>
        Open in ChatGPT
      </a>
    </div>
  );
}
