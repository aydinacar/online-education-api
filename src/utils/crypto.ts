import crypto from "crypto";

/**
 * URL-güvenli rastgele token üretir (e-posta doğrulama, şifre sıfırlama vb.).
 * Ham token kullanıcıya gider; DB'de sadece sha256 hash'i tutulur.
 */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Bir string'in SHA-256 hash'ini hex olarak döner.
 */
export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}
