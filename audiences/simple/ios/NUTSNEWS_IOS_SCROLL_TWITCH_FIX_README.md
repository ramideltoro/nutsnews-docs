---
title: NutsNews iOS Scroll Twitch Fix
wiki:
  source_route: /technical/ios/nutsnews-ios-scroll-twitch-fix-readme/
  simple_route: /simple/ios/nutsnews-ios-scroll-twitch-fix-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_SCROLL_TWITCH_FIX_README.mmd
    accTitle: "NutsNews iOS Scroll Twitch Fix diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: e3b20b4ebe6cd65a5c98bff2b7bc23dec5494e8bada21dbfa7aaa94aa7cafae6
---

# NutsNews iOS Scroll Twitch Fix

This bundle fixes the scroll twitch caused by thumbnail cards changing height after async image metadata checks completed.

Changed files:

- `NutsNews/NutsNews/Features/Feed/ArticleCardView.swift`
- `NutsNews/NutsNews/Design/NutsNewsTheme.swift`

Behavior:

- Removed runtime thumbnail metadata layout changes.
- Removed the thumbnail resolution display.
- Article thumbnail areas now use a stable 3:2 container.
- Images use `scaledToFill` and clipping inside that stable 3:2 area.
- This prevents `LazyVStack` from recalculating card heights while scrolling back up.

Install from the repo root:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews-ios
unzip -o ~/Downloads/nutsnews-ios-scroll-twitch-fix.zip -d .
cd NutsNews
xcodebuild -project NutsNews.xcodeproj -scheme NutsNews -destination 'id=8AABA667-DE66-44E9-8A10-A3FB84BECB39' build
```
