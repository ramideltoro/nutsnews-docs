---
title: Update: axe Playwright Accessibility CI
wiki:
  source_route: /technical/updates/readme-axe-playwright-accessibility-ci-update/
  simple_route: /simple/updates/readme-axe-playwright-accessibility-ci-update/
  primary_diagram:
    file: diagrams/updates/README_AXE_PLAYWRIGHT_ACCESSIBILITY_CI_UPDATE.mmd
    accTitle: "Update: axe Playwright Accessibility CI diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: b5b8f736bf0e0eec3c0701a3c70aa1d107e96f9c1706b0d9f752aca8edc5a417
---

# Update: axe Playwright Accessibility CI

This update adds automated accessibility regression checks for the NutsNews web app using Playwright and `@axe-core/playwright`.

## Summary

The update adds a new GitHub Actions workflow named `Accessibility CI`.

It builds the Next.js app from `web/`, starts the production server locally, opens public NutsNews pages in Chromium, and runs axe accessibility checks.

The workflow fails on serious or critical WCAG violations.

## Added Files

```text
.github/workflows/accessibility-ci.yml
web/playwright.config.ts
web/tests/accessibility.spec.ts
docs/AXE_PLAYWRIGHT_ACCESSIBILITY_CI.md
docs/updates/README_AXE_PLAYWRIGHT_ACCESSIBILITY_CI_UPDATE.md
```

## Updated Files

```text
README.md
docs/README.md
docs/OBSERVABILITY.md
web/.gitignore
web/package.json
web/package-lock.json
```

## Audited Pages

```text
/
/about
/privacy
/contact
```

## Safe URL Rule

Do not add Worker refresh URLs, controller trigger URLs, admin pages, OAuth callback routes, or API routes that perform writes.

The accessibility workflow is only for public reader and support pages.

## Local Validation

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews3/web

npm run build
npx playwright install chromium
npm run test:accessibility
```

## GitHub Actions Validation

After pushing, open:

```text
GitHub → Actions → Accessibility CI
```

A successful run should show:

```text
Install dependencies ✅
Install Playwright Chromium ✅
Build NutsNews ✅
Run axe accessibility checks ✅
Upload Playwright accessibility report ✅
```
