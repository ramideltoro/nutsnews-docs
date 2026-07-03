# NutsNews iOS iPad Story Fullscreen Update

This update changes story presentation only on iPad.

## What changed

- On iPad / iPadOS simulator, tapping a story now opens the story page using `fullScreenCover`.
- The story page uses the full width and height instead of a smaller popup sheet.
- iPhone keeps the existing sheet presentation and appearance.

## File changed

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
