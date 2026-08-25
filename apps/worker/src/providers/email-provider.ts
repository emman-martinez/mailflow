export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export type EmailSendResult = {
  messageId: string;
};

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
}
