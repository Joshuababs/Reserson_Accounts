import { expect, test } from "@playwright/test";
import { enterVerificationCode, fillBusiness, fillSignUp, freshEmail, verificationCodeFor } from "./helpers";

/**
 * The customer who signs up, closes the tab, and comes back from their email.
 *
 * They have a session cookie and nothing else — no page state, no storage from the
 * first visit. Everything left to do has to work from the cookie alone, or they are
 * stranded on a screen showing their own email address above a button that does
 * nothing.
 */
test("finishing onboarding in a new tab, with only the cookie", async ({ page, context }) => {
  const email = freshEmail("freshtab");

  await page.goto("/signup");
  await fillSignUp(page, { firstName: "Bríd", lastName: "Tester", email });
  await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible();

  // Everything this tab knew, gone. The cookie survives, as it would in a browser.
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  const fresh = await context.newPage();
  await fresh.goto("/verify");
  await expect(fresh.getByText(email)).toBeVisible();

  const code = await verificationCodeFor(email);
  await enterVerificationCode(fresh, code);

  // Verification has to have actually worked, not just navigated.
  await expect(fresh.getByRole("heading", { name: /What will you be using/i })).toBeVisible();

  await fresh.getByRole("button", { name: /Operator Console/ }).click();
  await fillBusiness(fresh, `Fresh Tab Baths ${Date.now()}`);

  await fresh.waitForURL((url) => url.port === "8095", { timeout: 20_000 });
});
