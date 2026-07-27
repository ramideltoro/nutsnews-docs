---
title: NutsNews Web Offline E2E Search Strict Locator Fix
wiki:
  source_route: /technical/archive/root-cleanup/web-offline-e2e-search-strict-fix-readme/
  simple_route: /simple/archive/root-cleanup/web-offline-e2e-search-strict-fix-readme/
  primary_diagram:
    file: diagrams/archive/root-cleanup/WEB_OFFLINE_E2E_SEARCH_STRICT_FIX_README.md
    accTitle: "NutsNews Web Offline E2E Search Strict Locator Fix diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 91b814f489799eaa5d2d243797d1e4bc54b8e576b7c8593232af4756068e793a
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
