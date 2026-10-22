import React, {type ReactNode} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

type Props = {
  /** Path under static/, e.g. /img/screenshots/clusters/list.webp */
  src: string;
  /** What the screenshot shows, read by screen readers and search engines */
  alt: string;
  /** Optional caption under the frame */
  caption?: ReactNode;
  /** Dashboard path shown in the frame's address bar, e.g. /dashboard/clusters */
  url?: string;
};

// A dashboard screenshot in a browser frame, opened full size on click.
export default function Screenshot({src, alt, caption, url}: Props): ReactNode {
  const resolved = useBaseUrl(src);
  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        <div className={styles.chrome} aria-hidden="true">
          <span className={styles.dots}>
            <i />
            <i />
            <i />
          </span>
          <span className={styles.address}>
            <svg viewBox="0 0 24 24">
              <path d="M12 17a2 2 0 0 0 2-2a2 2 0 0 0-2-2a2 2 0 0 0-2 2a2 2 0 0 0 2 2m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 5-5a5 5 0 0 1 5 5v2h1m-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3Z" />
            </svg>
            cloider.com{url ?? '/dashboard'}
          </span>
        </div>
        <a href={resolved} target="_blank" rel="noopener" className={styles.link} title="Open full size">
          <img src={resolved} alt={alt} loading="lazy" decoding="async" className={styles.image} />
        </a>
      </div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
