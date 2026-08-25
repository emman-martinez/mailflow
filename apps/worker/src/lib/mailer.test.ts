import { afterEach, describe, expect, it, vi } from "vitest";

const { createTransportMock, sendMailMock } = vi.hoisted(() => {
  const sendMailMock = vi.fn();

  const createTransportMock = vi.fn(() => ({
    sendMail: sendMailMock,
  }));

  return {
    createTransportMock,
    sendMailMock,
  };
});

vi.mock("nodemailer", () => ({
  default: {
    createTransport: createTransportMock,
  },
}));

import { SmtpEmailProvider } from "./mailer.js";

describe("SmtpEmailProvider", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sends an email with the expected data", async () => {
    sendMailMock.mockResolvedValue({
      messageId: "mailpit-test-message-id",
    });

    const provider = new SmtpEmailProvider();

    const result = await provider.send({
      to: "recipient@example.com",
      subject: "Test subject",
      text: "Test message body",
    });

    expect(result).toEqual({
      messageId: "mailpit-test-message-id",
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "recipient@example.com",
        subject: "Test subject",
        text: "Test message body",
      }),
    );
  });

  it("throws the intentional failure used for retry tests", async () => {
    const provider = new SmtpEmailProvider();

    await expect(
      provider.send({
        to: "provider+fail@example.com",
        subject: "Retry test",
        text: "This should fail.",
      }),
    ).rejects.toThrow("Simulated email provider failure.");

    expect(sendMailMock).not.toHaveBeenCalled();
  });
});
