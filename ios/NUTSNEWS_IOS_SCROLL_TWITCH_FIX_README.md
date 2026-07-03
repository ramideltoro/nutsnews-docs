# NutsNews iOS Scroll Twitch Fix

This bundle fixes the scroll twitch caused by thumbnail cards changing height after async image metadata checks completed.

Changed files:

- `NutsNews/NutsNews/Features/Feed/ArticleCardView.swift`
- `NutsNews/NutsNews/Design/NutsNewsTheme.swift`

Behavior:

- Removed runtime thumbnail metadata layout changes.
- Removed the thumbnail resolution display.
- Article thumbnail areas now use a stable 3:2 container.
- Images use `scaledToFill` and clipping inside that stable 3:2 area.
- This prevents `LazyVStack` from recalculating card heights while scrolling back up.

Install from the repo root:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews-ios
unzip -o ~/Downloads/nutsnews-ios-scroll-twitch-fix.zip -d .
cd NutsNews
xcodebuild -project NutsNews.xcodeproj -scheme NutsNews -destination 'id=8AABA667-DE66-44E9-8A10-A3FB84BECB39' build
```
