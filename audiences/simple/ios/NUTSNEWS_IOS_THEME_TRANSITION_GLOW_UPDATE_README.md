---
title: NutsNews iOS Theme Transition Glow Update
wiki:
  source_route: /technical/ios/nutsnews-ios-theme-transition-glow-update-readme/
  simple_route: /simple/ios/nutsnews-ios-theme-transition-glow-update-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_THEME_TRANSITION_GLOW_UPDATE_README.md
    accTitle: "NutsNews iOS Theme Transition Glow Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 16795fb8f31a4a6a562dcbb9e8eac84b3f2f5401cd3449a02ec1c080bbd9e5f6
---

# NutsNews iOS Theme Transition Glow Update

This update adds a theme-change glow animation on the Theme settings page.

## What changed

- When selecting a different theme, all theme option rows glow for about one second.
- The glow starts with the currently active theme accent color.
- The glow transitions toward the newly selected theme accent color.
- The top-right home button on the Theme page also participates in the glow.
- The selected theme still changes immediately with the existing smooth UI transition.

## Files changed

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
- `NutsNews/NutsNews/Design/NutsNewsTheme.swift`

## Notes

The theme file is included so this bundle stays compatible with the newly added theme list and theme preview colors.
