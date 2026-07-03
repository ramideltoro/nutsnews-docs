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
