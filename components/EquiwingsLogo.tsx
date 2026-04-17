'use client';

import Image from 'next/image';

interface EquiwingsLogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
  style?: React.CSSProperties;
}

/**
 * EquiwingsLogo — uses the pre-processed transparent PNG.
 * No blend-mode hacks needed; background is fully transparent.
 */
export default function EquiwingsLogo({
  size = 80,
  className = '',
  priority = false,
  style,
}: EquiwingsLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Equiwings Logo"
      width={size}
      height={size}
      priority={priority}
      className={className}
      style={{
        objectFit: 'contain',
        filter: 'drop-shadow(0 4px 14px rgba(124,58,237,0.4))',
        ...style,
      }}
    />
  );
}
