---
title: NutsNews iOS Hamburger Menu Patch
wiki:
  source_route: /technical/ios/nutsnews-ios-hamburger-menu-patch-readme/
  simple_route: /simple/ios/nutsnews-ios-hamburger-menu-patch-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_HAMBURGER_MENU_PATCH_README.md
    accTitle: "NutsNews iOS Hamburger Menu Patch diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 92fad7af69a76f406a0cd6371d8a236bc78ad343fb899ffcc1b7ca85a5ed568c
---

# NutsNews iOS Hamburger Menu Patch

This patch moves the main header actions into one hamburger menu on the top left.

## Changes

- Replaces separate top header action buttons with one hamburger menu.
- Adds these menu items:
  - Good Mood
  - Saved
  - Search
  - Settings
- Keeps the centered NutsNews title.
- Keeps existing full-screen/sheet presentation behavior.
- Includes the Good Mood haptics build fix by using `NutsNewsSettings.hapticsEnabledKey` with `@AppStorage`.

## Files changed

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
- `NutsNews/NutsNews/Features/Mood/GoodMoodView.swift`

## Install

```zsh
cd /Users/ramideltoro/nutsnews-ios

zsh ~/Downloads/nutsnews-ios-hamburger-menu-patch/nutsnews_ios_hamburger_menu_patch/scripts/install_hamburger_menu_patch.sh \
  ~/Downloads/nutsnews-ios-hamburger-menu-patch/nutsnews_ios_hamburger_menu_patch
```

## Build

```zsh
cd /Users/ramideltoro/nutsnews-ios/NutsNews

xcodebuild \
  -project NutsNews.xcodeproj \
  -scheme NutsNews \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro Max' \
  build
```

## Test

1. Home header should show one hamburger menu on the top left.
2. Tap the hamburger menu.
3. Confirm the menu includes Good Mood, Saved, Search, and Settings.
4. Tap Good Mood and confirm the mood picker opens.
5. Tap Saved and confirm Saved Stories opens.
6. Tap Search and confirm Full Archive Search opens.
7. Tap Settings and confirm Settings opens.
