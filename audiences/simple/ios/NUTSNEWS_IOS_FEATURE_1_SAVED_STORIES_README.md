---
title: "NutsNews iOS — Feature 1: Saved Stories Library"
wiki:
  source_route: /technical/ios/nutsnews-ios-feature-1-saved-stories-readme/
  simple_route: /simple/ios/nutsnews-ios-feature-1-saved-stories-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_FEATURE_1_SAVED_STORIES_README.mmd
    accTitle: "Saved Stories Library flow"
    accDescr: "User taps save on a story, persists it locally, and browses/removes items in the Saved Stories flow."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: ffa5a8d73fe7a511335b4737defebdd01b8700b8ed0e07c577396b60da57a2c5
---

# NutsNews iOS — Feature 1: Saved Stories Library

This update adds one native App Store Review feature only: a local Saved Stories Library.

## What changed

- Adds a visible **Saved** button in the home header.
- Tapping a story heart now saves the full story locally on device, not just an ID.
- Adds a native **Saved Stories** screen.
- Saved Stories includes:
  - local device storage through `UserDefaults`
  - search by title, summary, source, or category
  - saved count card
  - saved date
  - remove saved story action
  - tap a saved story to open the native story detail view

## Files added

- `NutsNews/NutsNews/Models/SavedStoryStore.swift`
- `NutsNews/NutsNews/Features/Saved/SavedStoriesView.swift`

## Files changed

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
- `NutsNews/NutsNews/Features/Feed/ArticleCardView.swift`
- `NutsNews/NutsNews/Features/Article/ArticleDetailView.swift`

## Test checklist

1. Build the app.
2. Run the app in the simulator.
3. Confirm the header shows a **Saved** button on the right.
4. Tap **Saved** before liking anything and confirm the empty state appears.
5. Go back to the feed.
6. Tap the heart on one story.
7. Open **Saved** again and confirm the story appears.
8. Search for a word from the title/source and confirm filtering works.
9. Tap the saved story and confirm the native Article Detail screen opens.
10. Remove the saved story and confirm it disappears.

## Why this helps App Review

This gives NutsNews a native, user-owned reading library instead of only showing aggregated stories and external links. It is a concrete step toward satisfying Guideline 4.2.2 by adding app-specific functionality and persistence.
