---
title: Cloudflare Turnstile Contact Form Protection
wiki:
  source_route: /technical/cloudflare-turnstile-contact-form/
  simple_route: /simple/cloudflare-turnstile-contact-form/
  primary_diagram:
    file: diagrams/CLOUDFLARE_TURNSTILE_CONTACT_FORM.mmd
    accTitle: "Cloudflare Turnstile contact form flow"
    accDescr: "Contact form requests get a browser Turnstile token that is verified server-side before email submission."
  status: active
  collection: platform-and-data
  section: core-platform
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 2097670d0666815e15274a380371787cc677a005195d662042e45abc49f9195a
---

# Cloudflare Turnstile Contact Form Protection

This update protects the public NutsNews contact form with Cloudflare Turnstile.

## What changed

- The contact form renders a Cloudflare Turnstile widget before the Send button.
- The browser sends the Turnstile token to `/api/contact` as `turnstileToken`.
- The API route verifies the token server-side with Cloudflare Siteverify before sending the Resend email.
- The existing hidden `website` honeypot remains in place as an extra spam trap.
- Turnstile copy is localized for English, French, and Japanese.

## Required environment variables

Add these to `web/.env.local` for local testing and to Vercel for Production:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_cloudflare_turnstile_site_key
TURNSTILE_SECRET_KEY=your_cloudflare_secret_key
```

The public site key is safe to expose to the browser. The secret key must stay server-side only.

## Cloudflare setup

1. Open the Cloudflare dashboard.
2. Go to **Turnstile**.
3. Create a widget for NutsNews.
4. Use a clear widget name, such as `NutsNews Contact Form`.
5. Add these hostnames:
   - `nutsnews.com`
   - `www.nutsnews.com`
   - `localhost` for local testing
6. Copy the generated site key and secret key.
7. Add the site key as `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
8. Add the secret key as `TURNSTILE_SECRET_KEY`.
9. Redeploy the web app after adding Vercel environment variables.

## Local verification

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews2/web

npm run lint
npx tsc --noEmit
npm run build
npm run dev
```

Then open:

```text
http://localhost:3000/contact
```

Expected behavior:

- The Turnstile widget appears above the Send button.
- Submitting without a token is blocked.
- Submitting with a valid token sends the message.
- The widget resets after success or error so tokens are not reused.

## Troubleshooting

### The contact page says the anti-spam check is not configured

One of these is missing:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in the browser/build environment
- `TURNSTILE_SECRET_KEY` in the server environment

Add both values and restart/redeploy.

### Localhost does not work

Make sure the Turnstile widget in Cloudflare includes `localhost` as an allowed hostname.

### The widget appears but sending fails

Check Vercel logs for:

```text
NutsNews Turnstile verification rejected
```

Common causes:

- Wrong secret key
- Token expired
- Hostname not allowed in the Turnstile widget
- Using a production secret with a Cloudflare test site key, or the opposite
