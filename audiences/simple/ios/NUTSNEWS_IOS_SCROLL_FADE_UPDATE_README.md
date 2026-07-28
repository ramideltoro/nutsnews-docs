---
title: NutsNews iOS Scroll Fade Update
wiki:
  source_route: /technical/ios/nutsnews-ios-scroll-fade-update-readme/
  simple_route: /simple/ios/nutsnews-ios-scroll-fade-update-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_SCROLL_FADE_UPDATE_README.md
    accTitle: "NutsNews iOS Scroll Fade Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 66213daca1298403391c566d77a88b6d42d06e7bc6a10ef8d79362a50fe9faff
---

# NutsNews iOS Scroll Fade Update

This bundle updates the home feed so article cards fade, scale slightly, and lift into place while scrolling.

Changed file:

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`

Install from the repo root:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews-ios
unzip -o ~/Downloads/nutsnews-ios-scroll-fade-update.zip -d .
cd NutsNews
xcodebuild -project NutsNews.xcodeproj -scheme NutsNews -destination 'id=8AABA667-DE66-44E9-8A10-A3FB84BECB39' build
```
