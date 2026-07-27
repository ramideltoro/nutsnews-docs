---
title: NutsNews iOS iPad Original Story True Fullscreen Fix
wiki:
  source_route: /technical/ios/nutsnews-ios-ipad-original-story-true-fullscreen-fix-readme/
  simple_route: /simple/ios/nutsnews-ios-ipad-original-story-true-fullscreen-fix-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_IPAD_ORIGINAL_STORY_TRUE_FULLSCREEN_FIX_README.md
    accTitle: "NutsNews iOS iPad Original Story True Fullscreen Fix diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: d01b37ff34cef40bba30caae192befcfcde2b1214cd35dc7c83fb75bd85ea781
---

# NutsNews iOS iPad Original Story True Fullscreen Fix

This update fixes the iPad original-story browser still appearing as a small centered popup.

## What changed

- The iPad original-story browser now uses a forced fullscreen Safari container.
- Safari is embedded and pinned to every edge of the screen.
- The browser view is still opened with `fullScreenCover` on iPad.
- iPhone keeps the existing Safari sheet behavior.
- The Safari close button still dismisses the fullscreen browser.

## Files changed

- `NutsNews/NutsNews/Features/Article/ArticleDetailView.swift`
- `NutsNews/NutsNews/Support/SafariView.swift`
