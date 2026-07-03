# NutsNews iOS iPad Landscape Compact Card Update

This update changes article cards only on iPad in landscape mode.

## What changed

- iPad landscape now uses a compact horizontal card layout.
- The thumbnail moves to the left and text/actions sit on the right.
- Card width is capped in landscape so a full card fits comfortably on screen.
- Title and summary are line-limited only in iPad landscape to keep the full card visible.
- iPhone is unchanged.
- iPad portrait is unchanged.

## Files changed

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
- `NutsNews/NutsNews/Features/Feed/ArticleCardView.swift`
