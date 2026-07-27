---
title: NutsNews iOS New Themes Update
wiki:
  source_route: /technical/ios/nutsnews-ios-new-themes-update-readme/
  simple_route: /simple/ios/nutsnews-ios-new-themes-update-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_NEW_THEMES_UPDATE_README.md
    accTitle: "NutsNews iOS New Themes Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 2d186a304dde4819f0e18d472ad2acc2c5b11df938ec1892c3cb2f92fa9fae5c
---

# NutsNews iOS New Themes Update

This update adds three new selectable app themes to NutsNews iOS and wires them into the existing theme system.

## Added themes

1. **The Modern SaaS**
   - Background: `#121212`
   - Surface / Cards: `#1E1E1E`
   - Text: `#E0E0E0`
   - Accent: `#3B82F6`

2. **The Creative Premium**
   - Background: `#0F172A`
   - Surface / Cards: `#1E293B`
   - Text: `#94A3B8`
   - Accent: `#7C3AED`

3. **The Moody Cyberpunk**
   - Background: `#1A211B`
   - Surface / Cards: `#2C362F`
   - Text: `#E5E7EB`
   - Accent: `#FACC15`

## Files changed

- `NutsNews/NutsNews/Design/NutsNewsTheme.swift`
- `NutsNews/NutsNews/Features/Feed/FeedView.swift`

## Notes

- The new themes appear on the theme settings page.
- Theme preview swatches were added for all three themes.
- Card, border, badge, button, background, category dot, and liked-card glow colors now respond to the new themes.
