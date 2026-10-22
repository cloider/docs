import React, {type ReactNode} from 'react';
import Head from '@docusaurus/Head';
import styles from './styles.module.css';

type Item = {
  /** The question, phrased the way someone would ask it */
  q: string;
  /** A plain text answer. The first sentence should answer the question on its own. */
  a: string;
};

// Questions and answers rendered as an accordion, with FAQPage structured data so
// search and answer engines can quote them directly.
export default function FAQ({items, title = 'Frequently asked questions'}: {items: Item[]; title?: string}): ReactNode {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({q, a}) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {'@type': 'Answer', text: a},
    })),
  };

  return (
    <section className={styles.faq}>
      <Head>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Head>
      {title && <p className={styles.title}>{title}</p>}
      {items.map(({q, a}) => (
        <details key={q} className={styles.item}>
          <summary className={styles.question}>{q}</summary>
          <div className={styles.answer}>
            {a.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </details>
      ))}
    </section>
  );
}
