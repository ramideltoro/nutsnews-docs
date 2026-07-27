---
title: NutsNews iOS Story Page Glow + Like Update
wiki:
  source_route: /technical/ios/nutsnews-ios-story-page-glow-like-update-readme/
  simple_route: /simple/ios/nutsnews-ios-story-page-glow-like-update-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_STORY_PAGE_GLOW_LIKE_UPDATE_README.md
    accTitle: "NutsNews iOS Story Page Glow + Like Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 9147a5b589099df9ab906a5fc084c37ff94f23b29e3c28380de10c8c3ec68a18
---

# NutsNews iOS Story Page Glow + Like Update

This update adds more story-page interactions and glow feedback.

## What changed

- Added a Like button to the upper-right corner of the story page.
- Tapping the story Like button makes the button glow.
- Tapping the story Like button also makes the story page content glow for about one second.
- The Open original story button now glows when tapped.
- The Share story button now glows when tapped.
- Glow colors follow the active theme accent.

## File changed

- `NutsNews/NutsNews/Features/Article/ArticleDetailView.swift`
