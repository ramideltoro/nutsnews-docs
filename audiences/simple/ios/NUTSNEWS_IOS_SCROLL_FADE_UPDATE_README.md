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
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 4b3f7ea51de0888cc3a8665970df97b16d493bd23e36a0a38957c5ab3f241ff4
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
