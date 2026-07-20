# NutsNews Web Offline E2E Regression Test

This test runs the real Next.js web app against mocked Supabase/PostgREST, Turnstile, and Resend services.

It can be run from either the repository root or the `web/` directory. The test starts Next.js with an absolute `web` working directory so `npm run test:e2e:offline` works reliably in local terminals and GitHub Actions.

The test verifies:

- Home page renders with mock article cards.
- Footer Home scrolls the page back to the top with animated movement.
- Footer navigation works for Home, Search, Apps, About, Contact, and Privacy.
- Search for `dogs` returns a mock article.
- Settings opens and every theme can be applied.
- Apps, About, Contact, and Privacy pages render.
- Contact form submits through mocked Turnstile and mocked Resend.
- A mock `quota_usage_events` email event is recorded.
- Language switching renders translated article text for French, Japanese, Swiss German, German, Greek, and back to English.
- A Supabase outage makes `/api/articles` use the edge snapshot fallback with `lang=fr`, preserving localized title, summary, `language_code`, `requested_language_code`, and `translation_available=true`.
- A separate English-only fixture verifies the documented missing-translation fallback: the requested language remains `fr`, the card language is `en`, and `translation_available=false`.

Run:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews3/web
npm install
npx playwright install --with-deps chromium
npm run test:e2e:offline
```

A passing run ends with:

```text
✅ NutsNews fully offline Web E2E regression passed.
✓ Cleanup complete; exiting Web E2E regression.
```

## Locator and mock-image stability

The test uses strict Playwright selectors and stable `data-testid` hooks for the feed, footer controls, search dialog, settings menu, theme options, and language options. Those hooks exist only to keep the regression reliable across copy changes and translated UI labels.

Mock article images are served from the local mock external service so the test remains fully offline and Next Image does not try to resolve external DNS.

## Issue #279 translation fallback coverage

The outage path is now translation-aware. The mock Worker snapshot endpoint reads the `lang` query parameter and returns localized article rows when a matching `article_summaries` fixture exists.

- Simple: if the database is down, a French reader still gets French edge snapshot cards when those translations exist.
- Intermediate: the regression verifies both the happy path and an explicit missing-translation fallback, so English is accepted only for the English-only fixture.
- Expert: `scripts/web_offline_e2e_regression.mjs` checks the response headers, `languageCode`, article title/summary, `language_code`, `requested_language_code`, and `translation_available` values for both localized fallback and missing-translation fallback.

## Stability notes

The browser test scopes ambiguous controls, such as the search submit button, to their owning dialog so Playwright strict mode cannot match footer/open/close buttons by accident. The browser test also intercepts `/_next/image` requests and returns a tiny mock PNG so the test remains fully offline even when mock article images point at localhost.


## Locator stability notes

The browser checks scope page-content assertions to `main` where possible. This avoids Playwright strict-mode conflicts with Next.js route-announcer text such as `About NutsNews | NutsNews`, which is useful for accessibility but is not the visible page content being tested.
