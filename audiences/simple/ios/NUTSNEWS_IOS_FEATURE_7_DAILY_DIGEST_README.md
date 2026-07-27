---
title: "NutsNews iOS Feature 7 — Daily Digest / Today’s Picks"
wiki:
  source_route: /technical/ios/nutsnews-ios-feature-7-daily-digest-readme/
  simple_route: /simple/ios/nutsnews-ios-feature-7-daily-digest-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_FEATURE_7_DAILY_DIGEST_README.mmd
    accTitle: "Daily digest flow"
    accDescr: "The app builds a Today’s Picks digest from the loaded feed and surfaces featured and quick-read story cards."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 4a2857bc34efebf16001e89d777412465502744e7876c4c7251aa28c9b0e30d8
---

# NutsNews iOS Feature 7 — Daily Digest / Today’s Picks

Adds a native **Today’s Picks** screen to the hamburger menu.

## What changed

- Adds `Features/Digest/DailyDigestView.swift`.
- Updates `Features/Feed/FeedView.swift` to add a **Today’s Picks** menu item.
- The digest summarizes the currently loaded positive feed with:
  - story count,
  - source count,
  - saved count,
  - category mix,
  - one daily featured story,
  - a quick-read card,
  - a worth-saving card,
  - more story rows.

## Install

```zsh
cd /Users/ramideltoro/nutsnews-ios

zsh ~/Downloads/nutsnews-ios-feature-7-daily-digest/nutsnews_ios_feature_7_daily_digest/scripts/install_feature_7_daily_digest.sh \
  ~/Downloads/nutsnews-ios-feature-7-daily-digest/nutsnews_ios_feature_7_daily_digest
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
2. Tap the hamburger menu.
3. Tap **Today’s Picks**.
4. Confirm the digest opens.
5. Confirm the daily pick has a thumbnail.
6. Tap **Open story**.
7. Save a story from the digest.
8. Close the digest and open **Saved** to confirm the saved story appears.
