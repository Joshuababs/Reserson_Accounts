# Reservon Accounts

One account for every Reservon product. This app owns signing up, signing in,
verifying an email, resetting a password, entering business details, and choosing
which product to use — and nothing else. It is not a product; it is the account
layer every product hands off to.

```bash
npm install
npm run dev      # http://localhost:8097
npm run build
```

Needs the platform identity provider running: `reservon_backend` on :9040, which
serves `/identity/*`. See `reservon_backend/docs/platform-identity.md` for the whole
design.

## Why this is its own app

The alternative was signing up inside the merchant dashboard and redirecting to
whichever product the customer actually wanted. That makes one product the front
door for people who may never use it: an operator-first merchant would download an
invoicing app's bundle, see its branding, and be redirected away — and every change
to signup would ship in that product's release train.

Product #3 needs one row in the `products` table and no change here at all: the
picker renders from the registry.

## The flow

```
/signup  →  /verify  →  /products  →  /business?product=…  →  the product's app
/signin  →  wherever they were going, or their primary product
/forgot  →  /reset   →  /signin
```

The screens are the merchant dashboard's auth screens (`Reservon_Merchant_Dashboard/
src/pages/auth/v2` and its `signupLayout.vue`), ported one for one — same layout,
copy, colours, fonts, favicon, toasts and popups — so a customer who has been
signing in on app.reservonhq.com sees nothing new here. The one difference is the
step list down the rail: it names this app's steps (account, verify, product,
business) rather than the merchant app's (which continue with modules and payment
after the handoff).

Every screen after sign-in reads the account from the **session cookie**, scoped to
`.reservonhq.com`, so a customer already signed in on another product arrives here
signed in — and a reload never loses them.

## Two things worth knowing

- **`?next=` is checked against an allowlist** (`lib/handoff.ts`). An open redirect
  on a sign-in page is a phishing primitive: a link that genuinely signs you in and
  drops you on a copy of the product asking for a card. Anything not on
  `VITE_ALLOWED_RETURN_HOSTS` is ignored rather than followed.
- **The business step is product-neutral.** Name, country and currency describe the
  business, not the product, so they are collected once here and every product reads
  them. Product-specific setup — plans, locations, catalogue — happens in the
  product, because that is where it belongs.

## Tests

```bash
npm test          # the redirect rules, in isolation
npm run test:e2e  # the screens, in a browser
```

`npm test` covers `lib/handoff.ts` — where a customer is sent afterwards and, more
importantly, where they are *not*: the return-URL allowlist is what stops this app
being used as an open redirect, and an open redirect on a sign-in page is a phishing
primitive.

`npm run test:e2e` drives the real stack in Chromium: this app on :8097, the identity
provider on :9040, the operator console on :8095, and a database. Nothing is mocked,
because the things most likely to break can only break for real — a session cookie
crossing origins, a `?next=` surviving four screens and two redirects, and a product
handing a customer over and getting them back.

Start all three, then:

```bash
npx playwright install chromium   # first run only
npm run test:e2e
```

## Deploying

`Dockerfile` builds the bundle and serves it with nginx on **9100**; `Jenkinsfile`
follows the same shape as the other Reservon repos. Configuration is `VITE_*` and is
inlined at build time — see `env.example` — so the container needs no runtime
environment and a config change means a rebuild.

The identity provider must be **same-site** with this app in production
(`accounts.reservonhq.com` and `api.reservonhq.com` both sit under
`reservonhq.com`), or the browser will not send the session cookie and every sign-in
will appear to succeed and then not stick.
