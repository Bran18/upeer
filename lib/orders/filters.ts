export type OrderRoleFilter = 'all' | 'incoming' | 'outgoing';

export const DEFAULT_ORDER_ROLE: OrderRoleFilter = 'all';

export function parseOrderRole(
  params: Record<string, string | string[] | undefined>,
): OrderRoleFilter {
  const raw = typeof params.role === 'string' ? params.role : null;
  return raw === 'incoming' || raw === 'outgoing' ? raw : 'all';
}

export function orderRoleToSearchParams(role: OrderRoleFilter): string {
  return role === 'all' ? '' : `role=${role}`;
}
