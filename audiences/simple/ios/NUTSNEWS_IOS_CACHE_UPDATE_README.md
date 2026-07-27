---
title: NutsNews iOS Cache Update
wiki:
  source_route: /technical/ios/nutsnews-ios-cache-update-readme/
  simple_route: /simple/ios/nutsnews-ios-cache-update-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_CACHE_UPDATE_README.md
    accTitle: "NutsNews iOS Cache Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 63bc74a8078b5f0fd0a8e449182418ff43f11c17a39cd80978872c8a73aea8b1
---

# NutsNews iOS Cache Update

This bundle adds a 15-minute on-device disk cache for `/api/articles` responses.

Changed files:

- `NutsNews/NutsNews/Networking/NutsNewsArticlesCache.swift` — new cache actor that stores raw article API responses in the app Caches directory.
- `NutsNews/NutsNews/Networking/NutsNewsAPIClient.swift` — checks the app cache before making the network request; falls back to stale cache if the API/network fails.
- `NutsNews/NutsNews/Features/Feed/ArticleFeedViewModel.swift` — normal initial loads use cache; manual reload can bypass it.
- `NutsNews/NutsNews/Features/Feed/FeedView.swift` — pull-to-refresh and retry force a fresh network fetch.

Behavior:

- Normal app launch/re-entry uses cached article API responses for up to 15 minutes.
- Manual pull-to-refresh bypasses the cache and gets fresh data.
- If the network/API is temporarily unavailable, the app can show the last known good cached response instead of an empty feed.
- Category pages and paginated pages get separate cache files.

Install from the repo root:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews-ios
unzip -o ~/Downloads/nutsnews-ios-cache-update.zip -d .
cd NutsNews
xcodebuild -project NutsNews.xcodeproj -scheme NutsNews -destination 'platform=iOS Simulator,name=iPhone 16' build
```
