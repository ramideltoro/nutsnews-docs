---
title: NutsNews iOS iPad Landscape Compact Card Update
wiki:
  source_route: /technical/ios/nutsnews-ios-ipad-landscape-compact-card-update-readme/
  simple_route: /simple/ios/nutsnews-ios-ipad-landscape-compact-card-update-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_IPAD_LANDSCAPE_COMPACT_CARD_UPDATE_README.md
    accTitle: "NutsNews iOS iPad Landscape Compact Card Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: c185be77bd7f93c6db36b4d0b5051cd6fe92dfe1fe7b09dabe000c86670de033
---

# NutsNews iOS iPad Landscape Compact Card Update

This update changes article cards only on iPad in landscape mode.

## What changed

- iPad landscape now uses a compact horizontal card layout.
- The thumbnail moves to the left and text/actions sit on the right.
- Card width is capped in landscape so a full card fits comfortably on screen.
- Title and summary are line-limited only in iPad landscape to keep the full card visible.
- iPhone is unchanged.
- iPad portrait is unchanged.

## Files changed

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
- `NutsNews/NutsNews/Features/Feed/ArticleCardView.swift`
