---
title: NutsNews Public Pages Theme Consistency
wiki:
  source_route: /technical/nutsnews-public-pages-theme-consistency/
  simple_route: /simple/nutsnews-public-pages-theme-consistency/
  primary_diagram:
    file: diagrams/NUTSNEWS_PUBLIC_PAGES_THEME_CONSISTENCY.mmd
    accTitle: "Theme system propagation"
    accDescr: "Public pages now consume the active theme selection used by the home feed while preserving existing layout and content."
  status: active
  collection: product-and-reader-experience
  section: public-product
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: c3fb81e54059c69dc5e69653c28609202bcdd1cb8bbddd6957f10f48ccde6c44
---

# NutsNews Public Pages Theme Consistency

This update makes the public secondary pages follow the same live theme system as the home feed.

## What changed

- About page now uses the active NutsNews theme instead of hard-coded amber styling.
- Privacy page now uses the active NutsNews theme instead of hard-coded amber styling.
- Contact page and contact form now use the active theme so the public site feels consistent.
- Article detail pages now use the active theme for their shell, cards, buttons, and text.
- Shared CSS overrides keep the existing page layout/content intact while mapping old amber utility classes to the active theme variables.

## Theme behavior

The existing gear theme switcher remains global. When a user selects Amber, Modern SaaS, Creative Premium, or Moody Cyberpunk, public pages now visually follow that same selection.
