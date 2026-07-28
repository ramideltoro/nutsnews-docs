---
title: NutsNews iOS Persistent Likes Update
wiki:
  source_route: /technical/ios/nutsnews-ios-persistent-likes-update-readme/
  simple_route: /simple/ios/nutsnews-ios-persistent-likes-update-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_PERSISTENT_LIKES_UPDATE_README.mmd
    accTitle: "NutsNews iOS Persistent Likes Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 85b93d68c0e8a85dfd30ec9b40bba302f671ecf98cd0414679d03a3bb1e85893
---

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
