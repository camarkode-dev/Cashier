import { cn } from '@/lib/utils';

interface BrandMarkProps {
  size?: number;
  className?: string;
  title?: string;
}

export function BrandMark({ size = 64, className, title }: BrandMarkProps) {
  const labelled = Boolean(title);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden={labelled ? undefined : true}
      aria-label={title}
      className={cn('flex-shrink-0', className)}
    >
      {labelled ? <title>{title}</title> : null}

      {/* Circular dark background */}
      <circle cx="160" cy="160" r="160" fill="#2C2C2C" />

      {/* House outline – white thick stroke */}
      <g stroke="#FFFFFF" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M67 258V117L161 41L253 121" />
        <path d="M69 259H223" />
      </g>

      {/* AH text shadow */}
      <g opacity="0.9" fill="#1A1A1A">
        <text
          x="97"
          y="225"
          fontFamily="Impact, Arial Black, sans-serif"
          fontSize="126"
          fontWeight="900"
          transform="skewX(-11)"
        >
          A
        </text>
        <text
          x="176"
          y="226"
          fontFamily="Impact, Arial Black, sans-serif"
          fontSize="128"
          fontWeight="900"
          transform="skewX(-6)"
        >
          H
        </text>
      </g>

      {/* AH text – orange */}
      <g fill="#F47B20" stroke="#1A1A1A" strokeWidth="6" paintOrder="stroke" strokeLinejoin="round">
        <text
          x="90"
          y="219"
          fontFamily="Impact, Arial Black, sans-serif"
          fontSize="126"
          fontWeight="900"
          transform="skewX(-11)"
        >
          A
        </text>
        <text
          x="171"
          y="220"
          fontFamily="Impact, Arial Black, sans-serif"
          fontSize="128"
          fontWeight="900"
          transform="skewX(-6)"
        >
          H
        </text>
      </g>
    </svg>
  );
}
