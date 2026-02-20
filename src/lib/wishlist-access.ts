import type { WishlistAccessToken } from './types/gifts';

export const GIFT_CATEGORIES = ['birthday', 'christmas', 'other'] as const;

export function encodeAccessToken(categories: string[]): string {
  const token: WishlistAccessToken = { categories };
  return btoa(JSON.stringify(token));
}

export function decodeAccessToken(code: string): WishlistAccessToken | null {
  try {
    const json = atob(code);
    const parsed = JSON.parse(json);
    if (!isValidToken(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isValidToken(value: unknown): value is WishlistAccessToken {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj.categories)) return false;
  return obj.categories.every((c: unknown) => typeof c === 'string');
}
