---
title: NutsNews iOS iPad Settings Fullscreen Update
wiki:
  source_route: /technical/ios/nutsnews-ios-ipad-settings-fullscreen-update-readme/
  simple_route: /simple/ios/nutsnews-ios-ipad-settings-fullscreen-update-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_IPAD_SETTINGS_FULLSCREEN_UPDATE_README.md
    accTitle: "NutsNews iOS iPad Settings Fullscreen Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: cb3989868df3f6c3f5aabfe700d4f3145bc4580ada78b057a64fe289ebde8933
---

# NutsNews iOS iPad Settings Fullscreen Update

This update changes settings presentation only on iPad.

## What changed

- On iPad / iPadOS simulator, tapping Settings now opens settings with `fullScreenCover`.
- Settings uses the full width and height instead of a small centered popup.
- iPhone keeps the existing sheet presentation and appearance.
- Story page fullscreen behavior on iPad is preserved.

## File changed

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
