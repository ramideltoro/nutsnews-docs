# NutsNews iOS Search Button Next to Settings Patch

This UI-only patch moves the full archive search icon from the right side of the home header to the left side, directly next to the Settings gear.

It changes only:

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`

No API, backend, saved stories, or search networking code is changed.

## Install

```zsh
cd /Users/ramideltoro/nutsnews-ios

zsh ~/Downloads/nutsnews-ios-search-next-to-settings-patch/nutsnews_ios_search_next_to_settings_patch/scripts/install_search_next_to_settings_patch.sh \
  ~/Downloads/nutsnews-ios-search-next-to-settings-patch/nutsnews_ios_search_next_to_settings_patch
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
2. Confirm the gear icon is on the left of the header.
3. Confirm the search icon is immediately next to the gear icon.
4. Confirm Saved remains on the right.
5. Tap the search icon and verify the full archive search screen opens.
