---
title: NutsNews iOS iPad Landscape Story No-Scroll Update
wiki:
  source_route: /technical/ios/nutsnews-ios-ipad-landscape-story-no-scroll-update-readme/
  simple_route: /simple/ios/nutsnews-ios-ipad-landscape-story-no-scroll-update-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_IPAD_LANDSCAPE_STORY_NO_SCROLL_UPDATE_README.md
    accTitle: "NutsNews iOS iPad Landscape Story No-Scroll Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 43ace46930aee0add7271bff8266edbee7b8f417e34626f975e40a9f5ba69a7c
---

# NutsNews iOS iPad Landscape Story No-Scroll Update

This update changes the story page only on iPad in landscape mode.

## What changed

- iPad landscape now uses a no-scroll story layout.
- Thumbnail/category content appears on the left.
- Title, summary, source, and actions appear on the right.
- Text is compact and line-limited only in iPad landscape so everything fits on one page.
- iPhone is unchanged.
- iPad portrait is unchanged and keeps the normal scrollable story page.

## File changed

- `NutsNews/NutsNews/Features/Article/ArticleDetailView.swift`
