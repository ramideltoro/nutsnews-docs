---
title: NutsNews iOS Safari Delegate Build Fix
wiki:
  source_route: /technical/ios/nutsnews-ios-safari-delegate-build-fix-readme/
  simple_route: /simple/ios/nutsnews-ios-safari-delegate-build-fix-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_SAFARI_DELEGATE_BUILD_FIX_README.mmd
    accTitle: "NutsNews iOS Safari Delegate Build Fix diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: b6a9fb899b3250418b63b618ee44303f424540944dd8aa1bcfa8efed90555edd
---

# NutsNews iOS Safari Delegate Build Fix

This fixes the Swift build error in `SafariView.swift`.

## What changed

- Moved `safariViewController.delegate = self` to after `super.init(...)`.
- Keeps the iPad forced-fullscreen original story browser behavior.
- Keeps iPhone behavior unchanged.

## Files changed

- `NutsNews/NutsNews/Support/SafariView.swift`
- `NutsNews/NutsNews/Features/Article/ArticleDetailView.swift`
