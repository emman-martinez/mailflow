import { MemoryRouter } from "react-router-dom";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CreateCampaignPage from "./CreateCampaignPage";

const { mutateMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
}));

vi.mock("../features/campaigns/campaigns.hooks", () => ({
  useCreateCampaign: () => ({
    mutate: mutateMock,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

describe("CreateCampaignPage", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits a campaign with normalized recipients", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CreateCampaignPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Campaign name"), "Product update");

    await user.type(screen.getByLabelText("Email subject"), "New features");

    await user.type(
      screen.getByLabelText("Message"),
      "Here are our latest features.",
    );

    await user.type(
      screen.getByRole("textbox", { name: /^Recipients/ }),
      " FIRST@EXAMPLE.COM\nSECOND@EXAMPLE.COM ",
    );

    await user.click(screen.getByRole("button", { name: "Create campaign" }));

    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Product update",
        subject: "New features",
        body: "Here are our latest features.",
        recipients: ["first@example.com", "second@example.com"],
      }),
      expect.objectContaining({
        onSuccess: expect.any(Function),
      }),
    );
  });

  it("shows an error when no recipient is provided", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CreateCampaignPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Campaign name"), "Product update");

    await user.type(screen.getByLabelText("Email subject"), "New features");

    await user.type(
      screen.getByLabelText("Message"),
      "Here are our latest features.",
    );

    await user.type(screen.getByRole("textbox", { name: /^Recipients/ }), "   ");

    await user.click(screen.getByRole("button", { name: "Create campaign" }));

    expect(
      screen.getByText("Add at least one recipient email address."),
    ).toBeInTheDocument();

    expect(mutateMock).not.toHaveBeenCalled();
  });
});
