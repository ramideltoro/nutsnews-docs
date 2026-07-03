# NutsNews iOS Like Toggle Update

This update makes the Like buttons toggle liked state.

## What changed

- Tapping an unliked story saves it as liked.
- Tapping an already-liked story removes the like.
- The behavior works from both the home feed and the story page.
- The shared persisted liked-story store remains the source of truth.
- Removing a like updates both screens and survives app relaunches.

## Files changed

- `NutsNews/NutsNews/Models/LikedStoryStore.swift`
- `NutsNews/NutsNews/Features/Feed/ArticleCardView.swift`
- `NutsNews/NutsNews/Features/Article/ArticleDetailView.swift`
