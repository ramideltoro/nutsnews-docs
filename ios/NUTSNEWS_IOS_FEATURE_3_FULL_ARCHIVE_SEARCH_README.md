# NutsNews iOS Feature 3 — Full Archive Search

This update connects the iOS app to the new NutsNews web search backend:

`https://www.nutsnews.com/api/search?q=good&page=0&limit=20`

## What changed

- Added a native search icon to the home header.
- Added a native full archive search screen.
- Search calls the production `/api/search` endpoint instead of searching only loaded phone articles.
- Search results include thumbnails, source, category, summary, and date.
- Search results can be opened in the native article detail screen.
- Search results can be saved to the local Saved Stories library.
- Search responses are cached briefly on-device to reduce repeated API hits.

## Files changed

- `NutsNews/NutsNews/Networking/NutsNewsAPIClient.swift`
- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
- `NutsNews/NutsNews/Features/Search/ArchiveSearchView.swift`

## Test checklist

1. Build the app.
2. Open the app in the simulator.
3. Confirm the home header shows a search icon.
4. Tap the search icon.
5. Search `good`.
6. Confirm results appear from the full NutsNews archive.
7. Search `community` or `dogs`.
8. Confirm results show thumbnails.
9. Tap a result and confirm Article Detail opens.
10. Save a result.
11. Close Search and open Saved.
12. Confirm the saved search result appears in Saved Stories.
13. Search nonsense like `zzzzzzzzzz` and confirm the no-results state appears.
14. Load more results if available.

## App Review note

This feature supports the App Store Review response for Guideline 4.2.2 because it adds a native discovery experience across the full NutsNews archive instead of only showing a list of loaded web links.
