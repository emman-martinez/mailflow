import { expect, test } from "@playwright/test";

test("a user can log in and create a campaign", async ({ page, request }) => {
  const uniqueId = Date.now();
  const email = `e2e-${uniqueId}@example.com`;
  const recipient = `recipient-${uniqueId}@example.com`;
  const password = "VeryStrongPassword123!";

  const registerResponse = await request.post(
    "http://localhost:3001/api/auth/register",
    {
      data: {
        email,
        name: "E2E Test User",
        password,
      },
    },
  );

  expect(registerResponse.status()).toBe(201);

  await page.goto("/login");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Email queue dashboard" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Create campaign" }).click();

  await page.getByLabel("Campaign name").fill("E2E campaign");
  await page.getByLabel("Email subject").fill("E2E subject");
  await page
    .getByLabel("Message")
    .fill("This campaign was created by a Playwright test.");
  await page.getByLabel("Recipients").fill(recipient);

  await page.getByRole("button", { name: "Create campaign" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(recipient)).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("Completed", { exact: true })).toBeVisible({
    timeout: 20_000,
  });
});
