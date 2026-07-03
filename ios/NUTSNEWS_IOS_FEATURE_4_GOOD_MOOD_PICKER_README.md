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
