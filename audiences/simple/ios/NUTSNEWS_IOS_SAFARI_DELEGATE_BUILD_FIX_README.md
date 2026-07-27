---
title: NutsNews iOS Safari Delegate Build Fix
wiki:
  source_route: /technical/ios/nutsnews-ios-safari-delegate-build-fix-readme/
  simple_route: /simple/ios/nutsnews-ios-safari-delegate-build-fix-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_SAFARI_DELEGATE_BUILD_FIX_README.md
    accTitle: "NutsNews iOS Safari Delegate Build Fix diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: d6e510f2634ca2f972cc4ac52c404043f4d06a617e8e108c210399d93ce6c290
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
