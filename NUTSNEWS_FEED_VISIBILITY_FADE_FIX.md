---
title: NutsNews feed visibility fade fix
wiki:
  source_route: /technical/nutsnews-feed-visibility-fade-fix/
  simple_route: /simple/nutsnews-feed-visibility-fade-fix/
  primary_diagram:
    file: diagrams/NUTSNEWS_FEED_VISIBILITY_FADE_FIX.mmd
    accTitle: "Feed visibility after removal of home animations"
    accDescr: "Removing page fade animation from public home containers restores always-visible article feed while keeping theme styling intact."
  status: active
  collection: product-and-reader-experience
  section: public-product
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 9927d2f712610c53a25584b7ae29994124c520e65b22dd238ac6f223047ecb1a
---

# NutsNews Feed Visibility Fade Fix

This patch fixes an issue where the home page banner could appear while the article feed stayed hidden after the page fade animation update.

## What changed

- Removed the page-wrapper fade animation from `.modern-home-shell` and `.public-themed-page`.
- Restored the prior safe theme/home-button CSS baseline so the article feed is never hidden by the global animation.
- Kept the existing theme system, home button, settings button, hero styling, cards, and public page theme styling unchanged.

## Files updated

- `web/app/globals.css`
