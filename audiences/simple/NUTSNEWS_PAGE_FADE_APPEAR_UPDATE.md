---
title: NutsNews Page Fade Appear Update
wiki:
  source_route: /technical/nutsnews-page-fade-appear-update/
  simple_route: /simple/nutsnews-page-fade-appear-update/
  primary_diagram:
    file: diagrams/NUTSNEWS_PAGE_FADE_APPEAR_UPDATE.mmd
    accTitle: "Public page fade/slide/blur entrance"
    accDescr: "Public pages animate in with a subtle fade/slide/blur effect, except when reduced motion is requested."
  status: active
  collection: product-and-reader-experience
  section: public-product
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 404778b4c3001a54f7f1dcde041bf213908b3853f25d1d146275bcf4aa7ee1db
---

# NutsNews Page Fade Appear Update

Adds a subtle page-level fade/slide/soft-blur entrance animation when moving to public pages on NutsNews.

## Scope

- Applies to the home page shell.
- Applies to public themed content pages.
- Preserves existing themes, colors, layout, footer, and buttons.
- Respects `prefers-reduced-motion` by disabling the page animation for users who prefer reduced motion.

## Updated file

- `web/app/globals.css`
