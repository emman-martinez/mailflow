import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import type {
  EmailMessage,
  EmailProvider,
  EmailSendResult,
} from "../providers/email-provider.js";

const smtpAuth =
  env.SMTP_USER && env.SMTP_PASSWORD
    ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      }
    : undefined;

export class SmtpEmailProvider implements EmailProvider {
  private readonly transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === "true",
    ...(smtpAuth ? { auth: smtpAuth } : {}),
  });

  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (message.to.includes("+fail@")) {
      throw new Error("Simulated email provider failure.");
    }

    const result = await this.transporter.sendMail({
      from: env.MAIL_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });

    console.info({
      event: "email_sent",
      recipientEmail: message.to,
      messageId: result.messageId,
    });

    return {
      messageId: result.messageId,
    };
  }
}

export const emailProvider = new SmtpEmailProvider();
