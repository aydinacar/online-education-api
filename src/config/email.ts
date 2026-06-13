import { env } from "./env";
import { logger } from "@/utils/logger";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

const consoleProvider: EmailProvider = {
  async send(message) {
    logger.info("📧 [email:console] gönderiliyor (gerçekte gönderilmedi)", {
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  },
};

function createSmtpProvider(): EmailProvider {
  if (!env.SMTP_HOST || !env.SMTP_PORT) {
    throw new Error("EMAIL_PROVIDER=smtp için SMTP_HOST ve SMTP_PORT gerekli");
  }

  let transporterPromise: Promise<import("nodemailer").Transporter> | null = null;

  const getTransporter = () => {
    if (!transporterPromise) {
      transporterPromise = import("nodemailer").then((nodemailer) =>
        nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_SECURE,
          auth:
            env.SMTP_USER && env.SMTP_PASS
              ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
              : undefined,
        }),
      );
    }
    return transporterPromise;
  };

  return {
    async send(message) {
      const transporter = await getTransporter();
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
    },
  };
}

function createResendProvider(): EmailProvider {
  if (!env.RESEND_API_KEY) {
    throw new Error("EMAIL_PROVIDER=resend için RESEND_API_KEY gerekli");
  }

  let clientPromise: Promise<import("resend").Resend> | null = null;

  const getClient = () => {
    if (!clientPromise) {
      clientPromise = import("resend").then(
        (mod) => new mod.Resend(env.RESEND_API_KEY),
      );
    }
    return clientPromise;
  };

  return {
    async send(message) {
      const client = await getClient();
      const { error } = await client.emails.send({
        from: env.EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text ?? "",
      });
      if (error) {
        throw new Error(`Resend gönderim hatası: ${error.message}`);
      }
    },
  };
}

function selectProvider(): EmailProvider {
  switch (env.EMAIL_PROVIDER) {
    case "smtp":
      return createSmtpProvider();
    case "resend":
      return createResendProvider();
    default:
      return consoleProvider;
  }
}

export const emailProvider: EmailProvider = selectProvider();
