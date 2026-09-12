import { expect, test } from "@playwright/test";
import { freshEmail, PASSWORD, verificationCodeFor } from "./helpers";

const CONSOLE = process.env.E2E_CONSOLE_URL ?? "http://localhost:8095";

test.describe("signing up", () => {
  /**
   * The whole funnel, in a browser: account, verification, product, business — and
   * out into the product the customer chose. Four screens and two redirects, which
   * is exactly where a `?next=` gets dropped if nobody is watching.
   */
  test("creates an account, a business, and lands in the chosen product", async ({ page }) => {
    const email = freshEmail("signup");

    await page.goto("/signup");
    await page.getByLabel("First name").fill("Caoimhe");
    await page.getByLabel("Last name").fill("Ní Bhriain");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    const code = await verificationCodeFor(email);
    await page.getByLabel("Verification code").fill(code);
    await page.getByRole("button", { name: "Verify" }).click();

    await expect(page.getByRole("heading", { name: /What will you be using/i })).toBeVisible();
    await page.getByRole("button", { name: /Operator Console/ }).click();

    await expect(page.getByRole("heading", { name: /About your business/i })).toBeVisible();
    await page.getByLabel("Business name").fill(`Playwright Baths ${Date.now()}`);
    await page.getByRole("button", { name: "Continue" }).click();

    await page.waitForURL((url) => url.origin === new URL(CONSOLE).origin, { timeout: 20_000 });
  });

  test("carries the product's deep link all the way through the funnel", async ({ page }) => {
    const email = freshEmail("signup-next");
    const deepLink = `${CONSOLE}/bookings?tab=today`;

    await page.goto(`/signup?next=${encodeURIComponent(deepLink)}`);
    await page.getByLabel("First name").fill("Fionnuala");
    await page.getByLabel("Last name").fill("Tester");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    // Every screen has to keep it, or the last one has nothing to return to.
    await expect(page).toHaveURL(/\/verify\?next=/);

    const code = await verificationCodeFor(email);
    await page.getByLabel("Verification code").fill(code);
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page).toHaveURL(/\/products\?next=/);

    await page.getByRole("button", { name: /Operator Console/ }).click();
    await expect(page).toHaveURL(/\/business\?product=operator&next=/);

    await page.getByLabel("Business name").fill(`Deep Link Baths ${Date.now()}`);
    await page.getByRole("button", { name: "Continue" }).click();

    // Back to the exact page they were looking at when they were sent to sign up.
    await page.waitForURL((url) => url.origin === new URL(CONSOLE).origin, { timeout: 20_000 });
    expect(page.url()).toBe(deepLink);
  });

  test("offers sign-in with the destination intact", async ({ page }) => {
    const deepLink = `${CONSOLE}/settings`;
    await page.goto(`/signup?next=${encodeURIComponent(deepLink)}`);

    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/signin\?next=/);
    expect(decodeURIComponent(page.url())).toContain(deepLink);
  });
});
