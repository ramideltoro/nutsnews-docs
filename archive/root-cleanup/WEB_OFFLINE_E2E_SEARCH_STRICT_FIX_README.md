---
wiki:
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 91f6f39b4a7be8c7231e13c7dd8b1dd232eb7ea07412cd485ec19d1826aa7e46
---
# NutsNews Web Offline E2E Search Strict Locator Fix

This update fixes the offline web E2E regression after the settings-locator fix by scoping the search submit and close buttons to the search dialog.

It also intercepts `/_next/image` in Playwright and returns a tiny mock PNG so the test does not depend on Next.js fetching localhost/mock images through the image optimizer.

## Files

- `scripts/web_offline_e2e_regression.mjs`
- `docs/WEB_OFFLINE_E2E_REGRESSION_TEST.md`

## Run

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews3/web
npm run test:e2e:offline
```
