---
title: NutsNews iOS — Saved Stories Thumbnail Ratio Patch
wiki:
  source_route: /technical/ios/nutsnews-ios-saved-thumbnails-home-ratio-patch-readme/
  simple_route: /simple/ios/nutsnews-ios-saved-thumbnails-home-ratio-patch-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_SAVED_THUMBNAILS_HOME_RATIO_PATCH_README.md
    accTitle: "NutsNews iOS — Saved Stories Thumbnail Ratio Patch diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 326b588f48f3dfdebf3c7fbcb099f07a29ca0251834fcfeee77f3c1991fb85b3
---

# NutsNews iOS — Saved Stories Thumbnail Ratio Patch

This patch updates the Saved Stories screen so saved-story thumbnails render with the same stable 3:2 thumbnail frame used by the home feed cards.

## What changed

- Updates `NutsNews/NutsNews/Features/Saved/SavedStoriesView.swift`.
- Uses a fixed 3:2 thumbnail frame for saved stories.
- Uses `scaledToFill`, clipping, and the same rounded image shape pattern as home cards.
- Updates the saved-story placeholder to match the home-card placeholder style more closely.
- Does not change API, saved-story storage, search, settings, mood, stats, or digest behavior.

## Install

```zsh
rm -rf ~/Downloads/nutsnews-ios-saved-thumbnails-home-ratio-patch

ditto -x -k \
  ~/Downloads/nutsnews-ios-saved-thumbnails-home-ratio-patch.zip \
  ~/Downloads/nutsnews-ios-saved-thumbnails-home-ratio-patch
```

```zsh
cd /Users/ramideltoro/nutsnews-ios

zsh ~/Downloads/nutsnews-ios-saved-thumbnails-home-ratio-patch/nutsnews_ios_saved_thumbnails_home_ratio_patch/scripts/install_saved_thumbnails_home_ratio_patch.sh \
  ~/Downloads/nutsnews-ios-saved-thumbnails-home-ratio-patch/nutsnews_ios_saved_thumbnails_home_ratio_patch
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

1. Open the app.
2. Save a story from the home screen.
3. Open the hamburger menu.
4. Open Saved Stories.
5. Confirm saved thumbnails use the same wide 3:2 crop/ratio as home feed cards.
6. Open a saved story and confirm Article Detail still opens.
7. Remove a saved story and confirm removal still works.

## Commit

```zsh
cd /Users/ramideltoro/nutsnews-ios

git status

git add \
  NutsNews/NutsNews/Features/Saved/SavedStoriesView.swift \
  NUTSNEWS_IOS_SAVED_THUMBNAILS_HOME_RATIO_PATCH_README.md

git commit -m "Match saved story thumbnail ratio to home"
```
