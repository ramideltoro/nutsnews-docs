---
title: NutsNews Web Offline E2E Page Locator Fix
wiki:
  source_route: /technical/archive/root-cleanup/web-offline-e2e-page-locator-fix-readme/
  simple_route: /simple/archive/root-cleanup/web-offline-e2e-page-locator-fix-readme/
  primary_diagram:
    file: diagrams/archive/root-cleanup/WEB_OFFLINE_E2E_PAGE_LOCATOR_FIX_README.mmd
    accTitle: "NutsNews Web Offline E2E Page Locator Fix diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: d70c25ea7629738c9c3fae85c15bcb8698d05fb9f758c16206e68b9e7e5b49b1
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
