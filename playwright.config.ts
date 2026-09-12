import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests for the account layer.
 *
 * These run against the real stack — this app, the identity provider, and a
 * database — because what they check cannot be checked any other way: that a
 * session cookie set by one origin is visible to another, that a redirect chain
 * survives four screens, and that a customer sent here by a product ends up back
 * where they started. Mocking the API would remove precisely the parts that break.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "line" : "list",
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_ACCOUNTS_URL ?? "http://localhost:8097",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Started by hand rather than by Playwright: the identity provider and its
  // database have to be up too, and a webServer block that starts only this app
  // would fail confusingly when they aren't.
});
