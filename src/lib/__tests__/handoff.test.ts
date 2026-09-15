import { beforeEach, describe, expect, it, vi } from "vitest";
import { returnTarget, withNext, __testing } from "../handoff";

const { safeNext } = __testing;

const me = (landing: string | null) => ({
  user: { id: "u", firstName: "A", lastName: "B", email: "a@b.test", isEmailVerified: true },
  businesses: [],
  landing: landing ? { businessId: "b", productCode: "operator", appUrl: landing } : null,
});

beforeEach(() => {
  vi.stubGlobal("window", { location: { origin: "https://account.reservonhq.com" } });
});

describe("where a customer is sent afterwards", () => {
  it("returns them to where they came from", () => {
    const target = returnTarget({
      next: "https://console.reservonhq.com/bookings/123",
      me: me(null),
    });
    expect(target).toBe("https://console.reservonhq.com/bookings/123");
  });

  it("keeps the deep link, not just the host", () => {
    const target = returnTarget({
      next: "https://console.reservonhq.com/bookings/123?tab=today",
      product: { code: "operator", appUrl: "https://console.reservonhq.com" },
      me: me(null),
    });
    expect(target).toBe("https://console.reservonhq.com/bookings/123?tab=today");
  });

  it("falls back to their primary product when they came from nowhere", () => {
    expect(returnTarget({ next: null, me: me("https://console.reservonhq.com") })).toBe(
      "https://console.reservonhq.com",
    );
  });

  it("has nowhere to send a brand-new account, so stays in the app", () => {
    expect(returnTarget({ next: null, me: me(null) })).toBeNull();
  });

  /**
   * The loop this rule exists to prevent: sent here by the console, chose the other
   * product, returned to the console — which bounces them back here, forever.
   */
  it("ignores where they came from when they chose a different product", () => {
    const target = returnTarget({
      next: "https://console.reservonhq.com/bookings",
      product: { code: "merchant", appUrl: "https://app.reservonhq.com" },
      me: me(null),
    });
    expect(target).toBe("https://app.reservonhq.com");
  });
});

describe("the return-URL allowlist", () => {
  it("accepts Reservon hosts and their subdomains", () => {
    expect(safeNext("https://console.reservonhq.com/x")).toBeTruthy();
    expect(safeNext("https://app.reservonhq.com")).toBeTruthy();
    expect(safeNext("http://localhost:8095/dashboard")).toBeTruthy();
  });

  it("refuses anywhere else — an open redirect here is a phishing primitive", () => {
    expect(safeNext("https://reservonhq.com.evil.test/login")).toBeNull();
    expect(safeNext("https://evil.test/reservonhq.com")).toBeNull();
    expect(safeNext("//evil.test")).toBeNull();
  });

  it("refuses non-http schemes, which have no host to check", () => {
    expect(safeNext("javascript:alert(document.cookie)")).toBeNull();
    expect(safeNext("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("treats nonsense as no destination at all", () => {
    expect(safeNext("")).toBeNull();
    expect(safeNext(null)).toBeNull();
    expect(safeNext("http://")).toBeNull();
  });
});

describe("carrying it between screens", () => {
  it("adds and preserves the query string", () => {
    expect(withNext("/verify", "https://x.reservonhq.com")).toBe(
      "/verify?next=https%3A%2F%2Fx.reservonhq.com",
    );
    expect(withNext("/business?product=operator", "https://x.test")).toContain("&next=");
    expect(withNext("/verify", null)).toBe("/verify");
  });
});
