---
wiki:
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: d2727b2999f544d4a2168cb7a395c77a5f8b2ba85c5809de47e4cd5ea6b5de0f
---
# NutsNews iOS Settings Button Glow Update

This update makes the home-page Settings button glow when tapped.

## What changed

- Tapping the Settings gear now triggers a short theme-colored glow.
- The glow uses the active theme accent color, matching the home button glow style.
- The settings sheet opens right after the tap glow starts, so the app still feels responsive.

## File changed

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
