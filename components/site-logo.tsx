import { UpeerMark } from '@/components/brand/upeer-mark';
import { cn } from '@/lib/cn';

type SiteLogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  priority?: boolean;
};

export function SiteLogo({
  className,
  markClassName,
  showWordmark = true,
}: SiteLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <UpeerMark className={cn('h-8 w-8 sm:h-9 sm:w-9', markClassName)} />
      {showWordmark ? (
        <span
          translate="no"
          className="text-[1.05rem] font-medium tracking-[-0.04em] text-[var(--foreground)] sm:text-[1.125rem]"
        >
          upeer
        </span>
      ) : null}
    </span>
  );
}
