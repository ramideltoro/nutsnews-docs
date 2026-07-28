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
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 78b7afff49ea8b1c0e820d29c112700c4edfb0e452bb62eec74516e2f3be8025
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
