---
title: NutsNews iOS iPad Story Fullscreen Update
wiki:
  source_route: /technical/ios/nutsnews-ios-ipad-story-fullscreen-update-readme/
  simple_route: /simple/ios/nutsnews-ios-ipad-story-fullscreen-update-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_IPAD_STORY_FULLSCREEN_UPDATE_README.md
    accTitle: "NutsNews iOS iPad Story Fullscreen Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 6c3fdad181c4536acd61d0805e9156e814b14ead8f4daf8a403c4549bf671e68
---

# NutsNews iOS iPad Story Fullscreen Update

This update changes story presentation only on iPad.

## What changed

- On iPad / iPadOS simulator, tapping a story now opens the story page using `fullScreenCover`.
- The story page uses the full width and height instead of a smaller popup sheet.
- iPhone keeps the existing sheet presentation and appearance.

## File changed

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
