import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Icon from '../Icon';
import styles from './styles.module.css';

// A grid of glass cards, the home page's bento cards, for overview pages.
export function Cards({children, cols = 2}: {children: ReactNode; cols?: 2 | 3 | 4}): ReactNode {
  return <div className={clsx(styles.grid, styles[`cols${cols}`])}>{children}</div>;
}

export function Card({
  title,
  href,
  icon,
  children,
}: {
  title: string;
  href: string;
  /** A Material Design Icons name from src/components/Icon/icons.ts */
  icon?: string;
  children?: ReactNode;
}): ReactNode {
  return (
    <Link to={href} className={styles.card}>
      <div className={styles.head}>
        {icon && (
          <span className={styles.icon}>
            <Icon name={icon} />
          </span>
        )}
        <span className={styles.title}>{title}</span>
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      </div>
      {children && <div className={styles.body}>{children}</div>}
    </Link>
  );
}

export default Cards;
