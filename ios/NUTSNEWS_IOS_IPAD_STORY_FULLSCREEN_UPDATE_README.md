---
wiki:
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 0141ab9bbaa5e029f55ef58aad8cf6ad85982640d91fb1ed9954a1130379a201
---
# NutsNews iOS iPad Story Fullscreen Update

This update changes story presentation only on iPad.

## What changed

- On iPad / iPadOS simulator, tapping a story now opens the story page using `fullScreenCover`.
- The story page uses the full width and height instead of a smaller popup sheet.
- iPhone keeps the existing sheet presentation and appearance.

## File changed

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
