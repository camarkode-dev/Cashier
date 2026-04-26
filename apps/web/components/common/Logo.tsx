import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'horizontal';
  className?: string;
}

const sizes = {
  xs: { icon: 28, fontSize: 11 },
  sm: { icon: 36, fontSize: 13 },
  md: { icon: 48, fontSize: 15 },
  lg: { icon: 64, fontSize: 20 },
  xl: { icon: 96, fontSize: 28 },
};

export function Logo({ size = 'md', variant = 'full', className }: LogoProps) {
  const s = sizes[size];

  const IconMark = (
    <svg
      width={s.icon}
      height={s.icon}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Dark background circle */}
      <rect width="100" height="100" rx="20" fill="#1f2937" />

      {/* House outline — white rounded strokes */}
      <path
        d="M50 14L16 40V88H38V64H62V88H84V40L50 14Z"
        fill="none"
        stroke="white"
        strokeWidth="6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* House roof line */}
      <path
        d="M16 40L50 14L84 40"
        fill="none"
        stroke="white"
        strokeWidth="6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Letter A — orange, bold */}
      <text
        x="27"
        y="75"
        fontFamily="Cairo, Tajawal, Arial Black, sans-serif"
        fontWeight="900"
        fontSize="38"
        fill="#f97316"
        letterSpacing="-2"
      >
        A
      </text>

      {/* Letter H — orange, bold, slightly overlapping */}
      <text
        x="52"
        y="75"
        fontFamily="Cairo, Tajawal, Arial Black, sans-serif"
        fontWeight="900"
        fontSize="38"
        fill="#f97316"
        letterSpacing="-2"
      >
        H
      </text>
    </svg>
  );

  if (variant === 'icon') {
    return <div className={cn('flex items-center', className)}>{IconMark}</div>;
  }

  if (variant === 'horizontal') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        {IconMark}
        <div className="flex flex-col leading-tight">
          <span style={{ fontSize: s.fontSize + 2 }} className="font-black text-gray-900 dark:text-white whitespace-nowrap">
            أولاد أيمن
          </span>
          <span style={{ fontSize: s.fontSize - 2 }} className="font-medium text-brand-500 whitespace-nowrap">
            للأدوات المنزلية
          </span>
        </div>
      </div>
    );
  }

  // Full variant — icon + stacked text
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {IconMark}
      <div className="text-center leading-tight">
        <div style={{ fontSize: s.fontSize + 2 }} className="font-black text-gray-900 dark:text-white">
          أولاد أيمن
        </div>
        <div style={{ fontSize: s.fontSize - 1 }} className="font-semibold text-brand-500">
          للأدوات المنزلية
        </div>
      </div>
    </div>
  );
}
