---
title: NutsNews Privacy Policy Update
wiki:
  source_route: /technical/archive/nutsnews-privacy-policy-update-readme/
  simple_route: /simple/archive/nutsnews-privacy-policy-update-readme/
  primary_diagram:
    file: diagrams/archive/NUTSNEWS_PRIVACY_POLICY_UPDATE_README.md
    accTitle: "NutsNews Privacy Policy Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 1764b5ddc5bb7ceca766f96847f01e08f0022da502fc78bc41eaed5540f67c67
---

# NutsNews Privacy Policy Update

This update adds a public privacy policy page for App Store submission and links it from the fixed site footer.

## Changed files

- `web/app/privacy/page.tsx`
  - New `/privacy` route.
  - Matches the existing NutsNews dark/amber visual style.
  - Includes privacy text covering account-free browsing, local liked stories, app caching, diagnostics, publisher links, children’s privacy, changes, and contact.

- `web/app/components/SiteFooter.tsx`
  - Adds a `Privacy Policy` footer link.

- `web/app/sitemap.ts`
  - Adds `https://www.nutsnews.com/privacy` to the sitemap.

## App Store Connect URL

After deploying to production, use this as the Privacy Policy URL in App Store Connect:

```text
https://www.nutsnews.com/privacy
```
