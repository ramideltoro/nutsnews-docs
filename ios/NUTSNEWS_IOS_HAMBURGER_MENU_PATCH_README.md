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
