import { expect, test } from "@playwright/test";
import { freshEmail, PASSWORD, verificationCodeFor } from "./helpers";

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
  await page.getByLabel("First name").fill("Bríd");
  await page.getByLabel("Last name").fill("Tester");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

  // Everything this tab knew, gone. The cookie survives, as it would in a browser.
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  const fresh = await context.newPage();
  await fresh.goto("/verify");
  await expect(fresh.getByText(email)).toBeVisible();

  const code = await verificationCodeFor(email);
  await fresh.getByLabel("Verification code").fill(code);
  await fresh.getByRole("button", { name: "Verify" }).click();

  // Verification has to have actually worked, not just navigated.
  await expect(fresh.getByRole("heading", { name: /What will you be using/i })).toBeVisible();

  await fresh.getByRole("button", { name: /Operator Console/ }).click();
  await fresh.getByLabel("Business name").fill(`Fresh Tab Baths ${Date.now()}`);
  await fresh.getByRole("button", { name: "Continue" }).click();

  await fresh.waitForURL((url) => url.port === "8095", { timeout: 20_000 });
});
