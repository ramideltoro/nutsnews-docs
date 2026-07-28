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
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: d2727b2999f544d4a2168cb7a395c77a5f8b2ba85c5809de47e4cd5ea6b5de0f
---

# NutsNews iOS Settings Button Glow Update

This update makes the home-page Settings button glow when tapped.

## What changed

- Tapping the Settings gear now triggers a short theme-colored glow.
- The glow uses the active theme accent color, matching the home button glow style.
- The settings sheet opens right after the tap glow starts, so the app still feels responsive.

## File changed

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
