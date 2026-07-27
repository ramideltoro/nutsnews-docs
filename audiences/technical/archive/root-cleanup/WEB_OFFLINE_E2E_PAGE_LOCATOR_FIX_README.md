---
title: NutsNews Web Offline E2E Page Locator Fix
wiki:
  source_route: /technical/archive/root-cleanup/web-offline-e2e-page-locator-fix-readme/
  simple_route: /simple/archive/root-cleanup/web-offline-e2e-page-locator-fix-readme/
  primary_diagram:
    file: diagrams/archive/root-cleanup/WEB_OFFLINE_E2E_PAGE_LOCATOR_FIX_README.md
    accTitle: "NutsNews Web Offline E2E Page Locator Fix diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: d5935959c14e8ab16110175d182981c0e5cf03cf6b4dde8161518b1ae9b030b0
---

# NutsNews Web Offline E2E Page Locator Fix

This update tightens the offline Web E2E checks for About, Privacy, and Contact pages.

The previous About check used `page.getByText(/About NutsNews/i)`, which can also match Next.js route-announcer text. Playwright strict mode correctly fails when a locator matches more than one element.

The updated test scopes page-content checks to `main` so the regression verifies visible page content and ignores route-announcer accessibility text.

Run:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews3/web
npm run test:e2e:offline
```
