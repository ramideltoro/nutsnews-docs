---
wiki:
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: e241f75ceca8432414ea54e2f65ee313b3070dfa2425f1533c11208f7669ea71
---
# NutsNews iOS iPad Original Story True Fullscreen Fix

This update fixes the iPad original-story browser still appearing as a small centered popup.

## What changed

- The iPad original-story browser now uses a forced fullscreen Safari container.
- Safari is embedded and pinned to every edge of the screen.
- The browser view is still opened with `fullScreenCover` on iPad.
- iPhone keeps the existing Safari sheet behavior.
- The Safari close button still dismisses the fullscreen browser.

## Files changed

- `NutsNews/NutsNews/Features/Article/ArticleDetailView.swift`
- `NutsNews/NutsNews/Support/SafariView.swift`
