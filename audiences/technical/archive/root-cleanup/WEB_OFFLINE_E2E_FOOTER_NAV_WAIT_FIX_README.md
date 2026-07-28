---
title: NutsNews Web Offline E2E Footer Navigation Wait Fix
wiki:
  source_route: /technical/archive/root-cleanup/web-offline-e2e-footer-nav-wait-fix-readme/
  simple_route: /simple/archive/root-cleanup/web-offline-e2e-footer-nav-wait-fix-readme/
  primary_diagram:
    file: diagrams/archive/root-cleanup/WEB_OFFLINE_E2E_FOOTER_NAV_WAIT_FIX_README.mmd
    accTitle: "NutsNews Web Offline E2E Footer Navigation Wait Fix diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 23401dffb4800b780e6fba736306e8ad80432d052191e11a2cdf2158794146f6
---

# NutsNews Web Offline E2E Footer Navigation Wait Fix

This update makes the offline web E2E footer navigation checks less flaky on GitHub Actions.

The CI runner can take several seconds to cold-compile `/about`, `/privacy`, and `/contact` during `next dev`. The previous test used the default 5 second URL assertion timeout, which could fail while the page was still compiling.

Changes:

- Footer links are scoped to the actual `<footer>`.
- Each footer link href is verified before clicking.
- Footer navigation now waits up to 20 seconds for `/about`, `/privacy`, and `/contact`.
- Page content assertions also use the same 20 second timeout.

Run:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews3/web
npm run test:e2e:offline
```
