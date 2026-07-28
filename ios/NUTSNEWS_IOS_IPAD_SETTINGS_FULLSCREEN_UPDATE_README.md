---
wiki:
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 2f90448a23801024714acc925593d24447bb2c98e4305715768692cfd524d6c7
---
# NutsNews iOS iPad Settings Fullscreen Update

This update changes settings presentation only on iPad.

## What changed

- On iPad / iPadOS simulator, tapping Settings now opens settings with `fullScreenCover`.
- Settings uses the full width and height instead of a small centered popup.
- iPhone keeps the existing sheet presentation and appearance.
- Story page fullscreen behavior on iPad is preserved.

## File changed

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
