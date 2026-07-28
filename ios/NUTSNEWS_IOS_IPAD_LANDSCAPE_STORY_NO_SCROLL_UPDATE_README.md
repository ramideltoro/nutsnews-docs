---
wiki:
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: b6d26fffef600908f6d9f940bd1f6d2d3dbbaa9adf0d57c66108aadd63e4fcb5
---
# NutsNews iOS iPad Landscape Story No-Scroll Update

This update changes the story page only on iPad in landscape mode.

## What changed

- iPad landscape now uses a no-scroll story layout.
- Thumbnail/category content appears on the left.
- Title, summary, source, and actions appear on the right.
- Text is compact and line-limited only in iPad landscape so everything fits on one page.
- iPhone is unchanged.
- iPad portrait is unchanged and keeps the normal scrollable story page.

## File changed

- `NutsNews/NutsNews/Features/Article/ArticleDetailView.swift`
