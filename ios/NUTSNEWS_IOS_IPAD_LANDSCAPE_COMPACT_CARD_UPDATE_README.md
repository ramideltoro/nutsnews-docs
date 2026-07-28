---
wiki:
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 3bccade5164d3d10bab414c52376d543662f2e1eb3ec1993fd7461877b92f258
---
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
