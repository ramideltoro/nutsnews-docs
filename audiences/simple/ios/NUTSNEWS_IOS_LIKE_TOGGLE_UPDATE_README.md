---
title: NutsNews iOS Like Toggle Update
wiki:
  source_route: /technical/ios/nutsnews-ios-like-toggle-update-readme/
  simple_route: /simple/ios/nutsnews-ios-like-toggle-update-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_LIKE_TOGGLE_UPDATE_README.md
    accTitle: "NutsNews iOS Like Toggle Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 356d39f745a223bbcd2277bee7a1e302a45d5da1f86130e9414e6335b490f889
---

# NutsNews iOS Like Toggle Update

This update makes the Like buttons toggle liked state.

## What changed

- Tapping an unliked story saves it as liked.
- Tapping an already-liked story removes the like.
- The behavior works from both the home feed and the story page.
- The shared persisted liked-story store remains the source of truth.
- Removing a like updates both screens and survives app relaunches.

## Files changed

- `NutsNews/NutsNews/Models/LikedStoryStore.swift`
- `NutsNews/NutsNews/Features/Feed/ArticleCardView.swift`
- `NutsNews/NutsNews/Features/Article/ArticleDetailView.swift`
