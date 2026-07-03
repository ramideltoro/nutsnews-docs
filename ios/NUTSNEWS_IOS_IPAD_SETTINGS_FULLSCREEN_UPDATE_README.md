# NutsNews iOS iPad Settings Fullscreen Update

This update changes settings presentation only on iPad.

## What changed

- On iPad / iPadOS simulator, tapping Settings now opens settings with `fullScreenCover`.
- Settings uses the full width and height instead of a small centered popup.
- iPhone keeps the existing sheet presentation and appearance.
- Story page fullscreen behavior on iPad is preserved.

## File changed

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
