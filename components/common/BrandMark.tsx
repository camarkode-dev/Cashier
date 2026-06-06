import { cn } from '@/lib/utils';

interface BrandMarkProps {
  size?: number;
  className?: string;
  title?: string;
  src?: string | null;
}

export function BrandMark({ size = 64, className, title, src }: BrandMarkProps) {
  return (
    <img
      src={src || '/logo-mark.png'}
      alt={title || ''}
      width={size}
      height={size}
      aria-hidden={title ? undefined : true}
      className={cn('flex-shrink-0 rounded-[18%] object-contain', className)}
    />
  );
}
