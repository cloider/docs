import React, {type ReactNode} from 'react';
import icons from './icons';

export default function Icon({name, size = 22, className}: {name: string; size?: number; className?: string}): ReactNode {
  const body = icons[name];
  if (!body) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{__html: body}}
    />
  );
}
