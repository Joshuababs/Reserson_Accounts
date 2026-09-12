import { Client } from "pg";

export const PLATFORM_URL = process.env.E2E_PLATFORM_URL ?? "http://localhost:9040";
export const PASSWORD = "correct-horse-battery-9";

/** A fresh address per test, so runs never collide. */
export function freshEmail(prefix = "ui"): string {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@reservon.test`;
}

/**
 * Reads the verification code out of the database.
 *
 * The alternative is a mail catcher in the test environment. This is the code the
 * customer would read from their inbox; where it is read from doesn't change what
 * the test proves about the screens.
 */
export async function verificationCodeFor(email: string): Promise<string> {
  const db = new Client({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME ?? "apple",
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME ?? "reservon_db_local",
  });

  await db.connect();
  try {
    const { rows } = await db.query("select email_verification_code as code from users where email = $1", [email]);
    if (!rows[0]?.code) throw new Error(`No verification code for ${email}`);
    return rows[0].code as string;
  } finally {
    await db.end();
  }
}

/** Creates a verified account with a business, without going through the UI. */
export async function seedAccount(options: { product?: string } = {}): Promise<{
  email: string;
  token: string;
  businessId: string | null;
}> {
  const email = freshEmail("seed");

  const register = await fetch(`${PLATFORM_URL}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ firstName: "Síofra", lastName: "Tester", email, password: PASSWORD }),
  }).then((r) => r.json());

  const token = register.data.access_token as string;

  const code = await verificationCodeFor(email);
  await fetch(`${PLATFORM_URL}/auth/verify-email`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ code }),
  });

  let businessId: string | null = null;
  if (options.product) {
    const business = await fetch(`${PLATFORM_URL}/business/register`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({
        businessName: `UI Venue ${Date.now()}`,
        currency: "EUR",
        country: "IE",
        product: options.product,
      }),
    }).then((r) => r.json());
    businessId = business.data.business.id;
  }

  return { email, token, businessId };
}
