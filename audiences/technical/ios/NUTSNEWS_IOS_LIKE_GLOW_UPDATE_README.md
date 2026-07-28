---
title: NutsNews iOS Like Glow Update
wiki:
  source_route: /technical/ios/nutsnews-ios-like-glow-update-readme/
  simple_route: /simple/ios/nutsnews-ios-like-glow-update-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_LIKE_GLOW_UPDATE_README.md
    accTitle: "NutsNews iOS Like Glow Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 28d41789da47f739dff0992793e1969f94a474f5a3aeddc151e28c7226c3c023
---

# NutsNews iOS Like Glow Update

This bundle updates the article card like interaction.

Changed files:

- `NutsNews/NutsNews/Features/Feed/ArticleCardView.swift`
- `NutsNews/NutsNews/Design/NutsNewsTheme.swift`

Behavior:

- Tapping the like button triggers a 1-second glow animation on only that article card.
- After the glow ends, only that liked card keeps a subtly different border color.
- The final border/glow color is theme-aware and changes with the active theme.
- The like icon and button border now use the same theme-aware liked accent instead of fixed red.

Install from the repo root:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews-ios
unzip -o ~/Downloads/nutsnews-ios-like-glow-update.zip -d .
cd NutsNews
xcodebuild -project NutsNews.xcodeproj -scheme NutsNews -destination 'id=8AABA667-DE66-44E9-8A10-A3FB84BECB39' build
```
