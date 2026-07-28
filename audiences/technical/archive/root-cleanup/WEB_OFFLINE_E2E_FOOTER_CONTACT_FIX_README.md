---
title: NutsNews Web Offline E2E Footer Contact Locator Fix
wiki:
  source_route: /technical/archive/root-cleanup/web-offline-e2e-footer-contact-fix-readme/
  simple_route: /simple/archive/root-cleanup/web-offline-e2e-footer-contact-fix-readme/
  primary_diagram:
    file: diagrams/archive/root-cleanup/WEB_OFFLINE_E2E_FOOTER_CONTACT_FIX_README.md
    accTitle: "NutsNews Web Offline E2E Footer Contact Locator Fix diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: fce25baad0794aeef4345488a2c6f6a42275be43a1d4995d0ff118afaaf3658c
---

# NutsNews Web Offline E2E Footer Contact Locator Fix

This update fixes another Playwright strict-mode locator in the fully offline Web E2E regression test.

The failure happened on the Privacy page because `getByRole("link", { name: "Contact" })` matched both:

- the Privacy page CTA link to the contact page
- the footer `Contact` link

The test now scopes footer page navigation checks to the actual `footer` element and uses exact link names:

```ts
const footer = page.locator("footer");
await footer.getByRole("link", { name: "Contact", exact: true }).click();
```

This keeps the test focused on the requirement that footer links work, while avoiding false failures from duplicate page content.
