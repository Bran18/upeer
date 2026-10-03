import type { NavItem } from '@/lib/nav/site-nav';

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (
    item.activeExcept?.some(
      (excluded) =>
        pathname === excluded || pathname.startsWith(`${excluded}/`),
    )
  ) {
    return false;
  }

  const prefixes = item.match ?? [item.href];
  return prefixes.some(
    (path) =>
      pathname === path || (path !== '/' && pathname.startsWith(`${path}/`)),
  );
}
