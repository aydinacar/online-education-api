import { emailProvider, type EmailMessage } from "@/config/email";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

/**
 * Tüm e-postaları saran basit HTML iskeleti.
 * İçeriği (body) ve isteğe bağlı bir call-to-action butonunu alır.
 */
function layout(opts: {
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const button =
    opts.ctaLabel && opts.ctaUrl
      ? `<a href="${opts.ctaUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin:16px 0">${opts.ctaLabel}</a>
         <p style="font-size:13px;color:#6b7280;margin:8px 0 0">Buton çalışmazsa bu bağlantıyı tarayıcına yapıştır:<br><span style="color:#2563eb;word-break:break-all">${opts.ctaUrl}</span></p>`
      : "";

  return `<!doctype html>
<html lang="tr">
  <body style="margin:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827">
    <div style="max-width:480px;margin:0 auto;padding:32px 16px">
      <div style="background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
        <h1 style="font-size:18px;margin:0 0 16px">${env.APP_NAME}</h1>
        <h2 style="font-size:16px;margin:0 0 12px">${opts.heading}</h2>
        <div style="font-size:14px;line-height:1.6;color:#374151">${opts.body}</div>
        ${button}
      </div>
      <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:24px">© ${env.APP_NAME}</p>
    </div>
  </body>
</html>`;
}

async function send(message: EmailMessage): Promise<void> {
  try {
    await emailProvider.send(message);
  } catch (error) {
    // Mail gönderimi kullanıcı akışını bloklamamalı - logla ve geç.
    logger.error("E-posta gönderilemedi", { to: message.to, error });
  }
}

export const emailService = {
  async sendEmailVerification(to: string, name: string, token: string): Promise<void> {
    const url = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    await send({
      to,
      subject: `${env.APP_NAME} - E-posta adresini doğrula`,
      html: layout({
        heading: "E-posta adresini doğrula",
        body: `Merhaba ${name},<br><br>Hesabını etkinleştirmek için aşağıdaki butona tıkla. Bu bağlantı 24 saat geçerlidir.`,
        ctaLabel: "E-postamı doğrula",
        ctaUrl: url,
      }),
      text: `Merhaba ${name}, e-postanı doğrulamak için: ${url}`,
    });
  },

  async sendPasswordReset(to: string, name: string, token: string): Promise<void> {
    const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await send({
      to,
      subject: `${env.APP_NAME} - Şifre sıfırlama`,
      html: layout({
        heading: "Şifreni sıfırla",
        body: `Merhaba ${name},<br><br>Şifreni sıfırlamak için aşağıdaki butona tıkla. Bu bağlantı 1 saat geçerlidir. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.`,
        ctaLabel: "Şifremi sıfırla",
        ctaUrl: url,
      }),
      text: `Merhaba ${name}, şifreni sıfırlamak için: ${url}`,
    });
  },

  async sendWelcome(to: string, name: string): Promise<void> {
    await send({
      to,
      subject: `${env.APP_NAME}'a hoş geldin!`,
      html: layout({
        heading: "Hoş geldin 🎉",
        body: `Merhaba ${name},<br><br>E-posta adresin doğrulandı. Artık kurslara göz atabilir ve öğrenmeye başlayabilirsin.`,
        ctaLabel: "Kursları keşfet",
        ctaUrl: `${env.FRONTEND_URL}/courses`,
      }),
      text: `Merhaba ${name}, e-postan doğrulandı. Kurslara göz at: ${env.FRONTEND_URL}/courses`,
    });
  },

  async sendPasswordChanged(to: string, name: string): Promise<void> {
    await send({
      to,
      subject: `${env.APP_NAME} - Şifren değiştirildi`,
      html: layout({
        heading: "Şifren değiştirildi",
        body: `Merhaba ${name},<br><br>Hesabının şifresi az önce değiştirildi. Bu işlemi sen yapmadıysan hemen şifreni sıfırla ve bizimle iletişime geç.`,
      }),
      text: `Merhaba ${name}, hesabının şifresi değiştirildi. Sen yapmadıysan hemen şifreni sıfırla.`,
    });
  },
};
