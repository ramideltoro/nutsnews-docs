---
title: NutsNews Home Button Update
wiki:
  source_route: /technical/nutsnews-home-button-update/
  simple_route: /simple/nutsnews-home-button-update/
  primary_diagram:
    file: diagrams/NUTSNEWS_HOME_BUTTON_UPDATE.mmd
    accTitle: "Home button navigation update"
    accDescr: "A new floating Home button in ThemeSwitcher links directly to the root route without changing theme or settings state."
  status: active
  collection: product-and-reader-experience
  section: public-product
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 16d86f8e00f075ffb5e971bb74dcb0eb80d37fa592f5ede0465c3b7b8f6c7af5
---

# NutsNews Home Button Update

Adds a small floating Home button above the existing theme/settings gear.

## Scope

- Adds a global Home button in the existing `ThemeSwitcher` component.
- Keeps the existing settings button, theme panel, colors, and page styling unchanged.
- Uses Next.js `Link` navigation for a smooth return to `/`.

## Files changed

- `web/app/components/ThemeSwitcher.tsx`
- `web/app/globals.css`
