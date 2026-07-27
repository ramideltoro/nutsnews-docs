---
title: NutsNews iOS Card Button Glow Update
wiki:
  source_route: /technical/ios/nutsnews-ios-card-button-glow-update-readme/
  simple_route: /simple/ios/nutsnews-ios-card-button-glow-update-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_CARD_BUTTON_GLOW_UPDATE_README.md
    accTitle: "NutsNews iOS Card Button Glow Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 21a9985af30d478010f2f8a384b4ca08b9a91d89a49d170b118b4a669c97cb19
---

# NutsNews iOS Card Button Glow Update

This update makes the card action buttons glow when tapped.

## What changed

- The Like button now gets a short theme-colored button glow when tapped.
- The Read Story button now gets the same theme-colored glow when tapped.
- The existing liked-card glow/border behavior is preserved.
- Read Story opens right after the glow starts so the app still feels responsive.

## File changed

- `NutsNews/NutsNews/Features/Feed/ArticleCardView.swift`
