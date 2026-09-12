import { expect, test } from "@playwright/test";
import { PASSWORD, seedAccount } from "./helpers";

const CONSOLE = process.env.E2E_CONSOLE_URL ?? "http://localhost:8095";

test.describe("signing in", () => {
  test("sends a customer back to the product that sent them here", async ({ page }) => {
    const { email } = await seedAccount({ product: "operator" });

    // Exactly what the operator console does when it has no session: a deep link,
    // not just the host, because that is what the customer was looking at.
    const deepLink = `${CONSOLE}/bookings?tab=today`;
    await page.goto(`/signin?next=${encodeURIComponent(deepLink)}`);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL((url) => url.origin === new URL(CONSOLE).origin, { timeout: 15_000 });
    expect(page.url()).toBe(deepLink);
  });

  test("sends a customer with nowhere to be to their primary product", async ({ page }) => {
    const { email } = await seedAccount({ product: "operator" });

    await page.goto("/signin");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    // The operator console is this account's primary product, so that is where
    // "open Reservon" means.
    await page.waitForURL((url) => url.origin === new URL(CONSOLE).origin, { timeout: 15_000 });
  });

  test("refuses to be used as a redirect to somewhere that isn't Reservon", async ({ page }) => {
    const { email } = await seedAccount({ product: "operator" });

    await page.goto(`/signin?next=${encodeURIComponent("https://phishing.example/login")}`);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL((url) => url.hostname !== "localhost" || !url.pathname.startsWith("/signin"), {
      timeout: 15_000,
    });
    expect(page.url()).not.toContain("phishing.example");
  });

  test("says so plainly when the password is wrong", async ({ page }) => {
    const { email } = await seedAccount();

    await page.goto("/signin");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("not-the-right-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    expect(page.url()).toContain("/signin");
  });

  test("keeps the customer signed in across a reload", async ({ page }) => {
    const { email } = await seedAccount({ product: "operator" });

    await page.goto("/signin");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL((url) => url.origin === new URL(CONSOLE).origin, { timeout: 15_000 });

    // Straight back to the accounts app: the session cookie should be enough, with
    // no second sign-in — that is the whole promise of one account.
    await page.goto("/products");
    await expect(page.getByRole("heading", { name: /Your Reservon products/i })).toBeVisible();
  });
});
