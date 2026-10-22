import React, {type ReactNode} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

type Logo = {
  /** Path under static/, e.g. /img/logos/postgresql.svg */
  src: string;
  /** The product's name, read by screen readers and shown on hover */
  alt: string;
};

function LogoTile({src, alt}: Logo): ReactNode {
  return (
    <span className={styles.tile} title={alt}>
      <img src={useBaseUrl(src)} alt={alt} loading="lazy" decoding="async" className={styles.image} />
    </span>
  );
}

// A row of small product logos. The source SVGs are hundreds of pixels wide, so they
// are never placed as plain Markdown images.
export default function Logos({items}: {items: Logo[]}): ReactNode {
  return (
    <div className={styles.row}>
      {items.map((item) => (
        <LogoTile key={item.src} {...item} />
      ))}
    </div>
  );
}
