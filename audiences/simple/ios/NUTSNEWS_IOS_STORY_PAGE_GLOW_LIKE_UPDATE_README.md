---
title: NutsNews iOS Story Page Glow + Like Update
wiki:
  source_route: /technical/ios/nutsnews-ios-story-page-glow-like-update-readme/
  simple_route: /simple/ios/nutsnews-ios-story-page-glow-like-update-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_STORY_PAGE_GLOW_LIKE_UPDATE_README.mmd
    accTitle: "NutsNews iOS Story Page Glow + Like Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 167bc8cfac0168c75e031dca3107fb86e87ddf408fbba704f17a81cf7ae3a869
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
