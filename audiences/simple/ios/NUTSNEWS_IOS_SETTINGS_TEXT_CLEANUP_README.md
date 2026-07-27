---
title: NutsNews iOS Settings Text Cleanup
wiki:
  source_route: /technical/ios/nutsnews-ios-settings-text-cleanup-readme/
  simple_route: /simple/ios/nutsnews-ios-settings-text-cleanup-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_SETTINGS_TEXT_CLEANUP_README.md
    accTitle: "NutsNews iOS Settings Text Cleanup diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 1a607717450fcc94848d519253eb6a35a82c46fc42e189371f2205cc03ae40cf
---

# NutsNews iOS Settings Text Cleanup

This bundle cleans up the settings UI text.

Changed file:

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`

Behavior:

- Removed the `App Settings` heading from the settings page.
- Removed the `Select App Theme` heading from the theme page.
- Theme options now show only the theme name, not the description text.
- Removed the `Haptics` heading from the haptics page.
- Removed the haptics navigation title text.

Install from the repo root:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews-ios
unzip -o ~/Downloads/nutsnews-ios-settings-text-cleanup.zip -d .
cd NutsNews
xcodebuild -project NutsNews.xcodeproj -scheme NutsNews -destination 'id=8AABA667-DE66-44E9-8A10-A3FB84BECB39' build
```
