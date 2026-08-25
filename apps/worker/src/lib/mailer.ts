import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import type {
  EmailMessage,
  EmailProvider,
  EmailSendResult,
} from "../providers/email-provider.js";

export class SmtpEmailProvider implements EmailProvider {
  private readonly transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
  });

  async send(message: EmailMessage): Promise<EmailSendResult> {
    // Keeps the retry test available.
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
