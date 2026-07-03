# NutsNews iOS Persistent Likes Update

This update makes liked stories persist and stay synchronized between the home feed and story page.

## What changed

- Added a shared `LikedStoryStore` backed by `UserDefaults`.
- Home article cards now read liked status from the shared store.
- Story pages now read liked status from the same shared store.
- Liking a story on the home page shows it as liked on the story page.
- Liking a story on the story page shows it as liked on the home page.
- Liked state survives app relaunches.

## Files changed

- `NutsNews/NutsNews/Models/LikedStoryStore.swift`
- `NutsNews/NutsNews/Features/Feed/ArticleCardView.swift`
- `NutsNews/NutsNews/Features/Article/ArticleDetailView.swift`
