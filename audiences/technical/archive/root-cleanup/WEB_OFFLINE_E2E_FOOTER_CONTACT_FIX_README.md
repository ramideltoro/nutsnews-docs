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
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 948ba3db481fdc593e8825cce6c5baa2e5bdef4b1537696ac7258c55ea6ef297
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
