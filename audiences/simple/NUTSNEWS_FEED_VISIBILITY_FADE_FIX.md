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
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 013d4ae8c7f0bd670e3c5a402fb476ec9b02ae854fb3d6e1aeadeff60445937e
---

# NutsNews Feed Visibility Fade Fix

This patch fixes an issue where the home page banner could appear while the article feed stayed hidden after the page fade animation update.

## What changed

- Removed the page-wrapper fade animation from `.modern-home-shell` and `.public-themed-page`.
- Restored the prior safe theme/home-button CSS baseline so the article feed is never hidden by the global animation.
- Kept the existing theme system, home button, settings button, hero styling, cards, and public page theme styling unchanged.

## Files updated

- `web/app/globals.css`
