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
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: fc992eec420aa9c19077a1e6e2dcbdca8089336d1163e459bb5875ab533b6fde
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
