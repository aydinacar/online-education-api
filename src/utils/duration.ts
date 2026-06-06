/**
 * "7d", "15m", "1h" gibi bir süre string'ini milisaniyeye çevirir.
 * jwt/cookie/token expiry hesabında ortak kullanılır.
 */
export function expiresInMs(input: string, fallbackMs = 7 * 24 * 60 * 60 * 1000): number {
  const match = input.match(/^(\d+)([smhd])$/);
  if (!match || !match[1] || !match[2]) {
    return fallbackMs;
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (multipliers[unit] ?? 1000);
}
