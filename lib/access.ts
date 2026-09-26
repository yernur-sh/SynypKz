import { UserRole } from '@/lib/types';

/**
 * Рөлге қарай жабық беттер.
 * - Оқушы: «Ата-ана» беті болмайды.
 * - Ата-ана: «Байланыс» және «Үзіліс» беттері болмайды
 *   (хабарламалар басты бетте көрініп тұрады).
 */
const HIDDEN_ROUTES: Record<UserRole, string[]> = {
  student: ['/parent-portal'],
  parent: ['/communication', '/fun-break'],
  teacher: [],
};

export function hiddenRoutesFor(role?: UserRole | null): string[] {
  if (!role) return [];
  return HIDDEN_ROUTES[role] ?? [];
}

export function canAccess(role: UserRole | null | undefined, href: string): boolean {
  return !hiddenRoutesFor(role).includes(href);
}
