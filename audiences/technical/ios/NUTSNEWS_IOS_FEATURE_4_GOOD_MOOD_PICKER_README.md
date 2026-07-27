---
title: "NutsNews iOS Feature 4: Good Mood Picker"
wiki:
  source_route: /technical/ios/nutsnews-ios-feature-4-good-mood-picker-readme/
  simple_route: /simple/ios/nutsnews-ios-feature-4-good-mood-picker-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_FEATURE_4_GOOD_MOOD_PICKER_README.mmd
    accTitle: "Good mood picker behavior"
    accDescr: "A user opens a mood picker, chooses a mood, the app ranks current feed candidates, and returns a recommended story."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 330630d5b31c23acfd4cd7396666bcf0d4b0b09ddac55c025e720619819dad95
---

# NutsNews iOS Feature 4: Good Mood Picker

This update adds a native Good Mood picker to the iOS app.

## What changed

- Adds a sparkle button next to Settings and Search in the home header.
- Adds a native Good Mood screen.
- Users can choose Calm, Hopeful, Inspired, or Curious.
- The app ranks the currently loaded feed and recommends the best story for that mood.
- Results include thumbnails.
- Users can open the recommended story in the native Article Detail screen.
- Users can save mood-picked stories to Saved Stories.

## Files changed

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
- `NutsNews/NutsNews/Features/Mood/GoodMoodView.swift`

## Install

```zsh
cd /Users/ramideltoro/nutsnews-ios

zsh ~/Downloads/nutsnews-ios-feature-4-good-mood-picker/nutsnews_ios_feature_4_good_mood/scripts/install_feature_4_good_mood_picker.sh \
  ~/Downloads/nutsnews-ios-feature-4-good-mood-picker/nutsnews_ios_feature_4_good_mood
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
