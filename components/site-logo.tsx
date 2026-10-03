import Image from 'next/image';

const LOGO_WIDTH = 1024;
const LOGO_HEIGHT = 682;

type SiteLogoProps = {
  className?: string;
  priority?: boolean;
};

export function SiteLogo({
  className = 'h-8 w-auto',
  priority = false,
}: SiteLogoProps) {
  return (
    <Image
      src="/upeer-logo.png"
      alt="UPEER"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      className={`max-w-full object-contain object-left ${className}`.trim()}
    />
  );
}
