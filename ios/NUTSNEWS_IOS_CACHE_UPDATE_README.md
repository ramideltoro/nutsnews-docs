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
