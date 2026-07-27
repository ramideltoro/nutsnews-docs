---
title: NutsNews iOS Settings Button Glow Update
wiki:
  source_route: /technical/ios/nutsnews-ios-settings-button-glow-update-readme/
  simple_route: /simple/ios/nutsnews-ios-settings-button-glow-update-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_SETTINGS_BUTTON_GLOW_UPDATE_README.md
    accTitle: "NutsNews iOS Settings Button Glow Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: c1b8113fb6787b9092514cbd34657d1d5902c359aeeff3e95ce5ab304d2b86bc
---

# NutsNews iOS Settings Button Glow Update

This update makes the home-page Settings button glow when tapped.

## What changed

- Tapping the Settings gear now triggers a short theme-colored glow.
- The glow uses the active theme accent color, matching the home button glow style.
- The settings sheet opens right after the tap glow starts, so the app still feels responsive.

## File changed

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
