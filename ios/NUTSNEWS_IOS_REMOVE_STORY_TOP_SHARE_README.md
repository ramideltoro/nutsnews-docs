---
wiki:
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: a22419f23f22c9dab36f7cdddccbea7979e55cfc299d597b4f1912cff2485a9d
---
# NutsNews iOS Remove Story Top Share Update

This bundle removes the top-right share icon from the article story page toolbar.

Changed file:

- `NutsNews/NutsNews/Features/Article/ArticleDetailView.swift`

Behavior:

- The story page top-right toolbar share button is removed.
- The top-left Close button remains.
- The lower in-page `Share story` button remains unchanged.

Install from the repo root:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews-ios
unzip -o ~/Downloads/nutsnews-ios-remove-story-top-share.zip -d .
cd NutsNews
xcodebuild -project NutsNews.xcodeproj -scheme NutsNews -destination 'id=8AABA667-DE66-44E9-8A10-A3FB84BECB39' build
```
