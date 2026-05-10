/**
 * Throw atılabilen, error middleware'in HTTP response'a çevirdiği error sınıfı.
 *
 * Kullanım:
 *   throw new ApiError(404, "Kurs bulunamadı");
 *   throw new ApiError(400, "Validasyon hatası", errors);
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors?: Record<string, string[]>;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errors?: Record<string, string[]>,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Geçersiz istek", errors?: Record<string, string[]>) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Yetkisiz erişim") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Bu işlem için yetkiniz yok") {
    return new ApiError(403, message);
  }

  static notFound(message = "Kayıt bulunamadı") {
    return new ApiError(404, message);
  }

  static conflict(message = "Çakışma oluştu") {
    return new ApiError(409, message);
  }

  static internal(message = "Sunucu hatası") {
    return new ApiError(500, message, undefined, false);
  }
}
