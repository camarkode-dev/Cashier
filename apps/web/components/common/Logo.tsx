import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/common/BrandMark';

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

const BRAND_NAME = 'أولاد أيمن';
const BRAND_SUBTITLE = 'للأدوات المنزلية';

export function Logo({ size = 'md', variant = 'full', className }: LogoProps) {
  const s = sizes[size];
  const icon = <BrandMark size={s.icon} title={BRAND_NAME} />;

  if (variant === 'icon') {
    return <div className={cn('flex items-center', className)}>{icon}</div>;
  }

  if (variant === 'horizontal') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        {icon}
        <div className="flex flex-col leading-tight">
          <span
            style={{ fontSize: s.fontSize + 2 }}
            className="font-black text-gray-900 dark:text-white whitespace-nowrap"
          >
            {BRAND_NAME}
          </span>
          <span
            style={{ fontSize: s.fontSize - 2 }}
            className="font-medium text-brand-500 whitespace-nowrap"
          >
            {BRAND_SUBTITLE}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {icon}
      <div className="text-center leading-tight">
        <div style={{ fontSize: s.fontSize + 2 }} className="font-black text-gray-900 dark:text-white">
          {BRAND_NAME}
        </div>
        <div style={{ fontSize: s.fontSize - 1 }} className="font-semibold text-brand-500">
          {BRAND_SUBTITLE}
        </div>
      </div>
    </div>
  );
}
