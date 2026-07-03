# NutsNews iOS Feature 6 — Reading Stats

This update adds a native Reading Stats screen to the hamburger menu.

## What changed

- Adds `Reading Stats` to the hamburger menu.
- Adds a native stats screen showing:
  - Today’s story goal progress.
  - Current positive-news streak.
  - Total unique stories opened.
  - Saved story count.
  - Private note count.
  - Original story opens today.
  - A simple 7-day activity chart.
- Records a story as opened when the native Article Detail screen appears.
- Records original story opens when the user taps `Open original story`.
- Keeps all stats private on device using `@AppStorage`.

## Files changed

- `NutsNews/NutsNews/Models/ReadingStatsStore.swift`
- `NutsNews/NutsNews/Models/StoryNoteStore.swift`
- `NutsNews/NutsNews/Features/Stats/ReadingStatsView.swift`
- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
- `NutsNews/NutsNews/Features/Article/ArticleDetailView.swift`

## Install

```zsh
cd /Users/ramideltoro/nutsnews-ios

zsh ~/Downloads/nutsnews-ios-feature-6-reading-stats/nutsnews_ios_feature_6_reading_stats/scripts/install_feature_6_reading_stats.sh \
  ~/Downloads/nutsnews-ios-feature-6-reading-stats/nutsnews_ios_feature_6_reading_stats
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

## Test checklist

1. Open the app.
2. Tap the hamburger menu.
3. Confirm `Reading Stats` appears.
4. Open `Reading Stats` before opening stories and note the starting values.
5. Close stats.
6. Open one story.
7. Close the story.
8. Open `Reading Stats` again.
9. Confirm today’s count increased.
10. Open the same story again and confirm the unique count for today does not duplicate the same story.
11. Open a different story and confirm today’s count increases.
12. Tap `Open original story` from a story and confirm `Originals today` increases.
13. Save a story and confirm the saved count appears.
14. Add a story note and confirm the notes count appears.
