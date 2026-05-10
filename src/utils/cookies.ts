import type { CookieOptions, Response } from "express";
import { env } from "@/config/env";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

function expiresInMs(input: string): number {
  const match = input.match(/^(\d+)([smhd])$/);
  if (!match || !match[1] || !match[2]) {
    return 7 * 24 * 60 * 60 * 1000;
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

const isProd = env.NODE_ENV === "production";

const baseOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProd,
};

export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    ...baseOptions,
    path: "/",
    maxAge: expiresInMs(env.JWT_ACCESS_EXPIRES_IN),
  });
}

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    ...baseOptions,
    path: `${env.API_PREFIX}/auth`,
    maxAge: expiresInMs(env.JWT_REFRESH_EXPIRES_IN),
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...baseOptions, path: "/" });
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...baseOptions,
    path: `${env.API_PREFIX}/auth`,
  });
}
