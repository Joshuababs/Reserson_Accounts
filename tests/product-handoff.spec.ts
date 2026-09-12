import { expect, test } from "@playwright/test";
import { PASSWORD, seedAccount } from "./helpers";

const CONSOLE = process.env.E2E_CONSOLE_URL ?? "http://localhost:8095";

/**
 * The journey the whole design exists for.
 *
 * A customer opens a product with no session, is sent here, signs in, and ends up
 * back in the product — at the page they asked for. Driven from the *product* end
 * rather than from this app, because the handoff is only real if the product's own
 * redirect carries what this app needs.
 */
test.describe("arriving from a product", () => {
  test("the console sends an anonymous visitor here, and gets them back", async ({ page }) => {
    const { email } = await seedAccount({ product: "operator" });

    // Cold, with no session anywhere.
    await page.goto(`${CONSOLE}/dashboard`);

    // The console asks the platform for a token, is told there is no session, and
    // hands the customer over — with where they were going attached.
    await page.waitForURL(/localhost:8097\/signin\?next=/, { timeout: 20_000 });
    expect(decodeURIComponent(page.url())).toContain(`${CONSOLE}/dashboard`);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    // Back in the console, signed in, without ever seeing a console login screen.
    await page.waitForURL((url) => url.origin === new URL(CONSOLE).origin, { timeout: 20_000 });
    await expect(page.locator("body")).not.toContainText("Sign in to Reservon Operator");
  });

  test("a customer already signed in elsewhere is never asked again", async ({ page }) => {
    const { email } = await seedAccount({ product: "operator" });

    await page.goto("/signin");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL((url) => url.origin === new URL(CONSOLE).origin, { timeout: 20_000 });

    // Let the console finish its own bootstrap before navigating again, or the test
    // races its redirect rather than testing it.
    await page.waitForLoadState("networkidle");

    // Open the product cold in the same browser: the shared cookie should carry it.
    await page.goto(`${CONSOLE}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("localhost:8095");
    expect(page.url()).not.toContain("/signin");
  });
});
