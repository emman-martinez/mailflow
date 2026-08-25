import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const mailTransporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
});

type SendEmailInput = {
  recipientEmail: string;
  subject: string;
  body: string;
};

export async function sendEmail({
  recipientEmail,
  subject,
  body,
}: SendEmailInput): Promise<void> {
  // Keeps the retry test available.
  if (recipientEmail.includes("+fail@")) {
    throw new Error("Simulated email provider failure.");
  }

  const result = await mailTransporter.sendMail({
    from: env.MAIL_FROM,
    to: recipientEmail,
    subject,
    text: body,
  });

  console.info({
    event: "email_sent",
    recipientEmail,
    messageId: result.messageId,
  });
}
