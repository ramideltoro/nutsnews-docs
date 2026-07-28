---
wiki:
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: b6a9fb899b3250418b63b618ee44303f424540944dd8aa1bcfa8efed90555edd
---
# NutsNews iOS Safari Delegate Build Fix

This fixes the Swift build error in `SafariView.swift`.

## What changed

- Moved `safariViewController.delegate = self` to after `super.init(...)`.
- Keeps the iPad forced-fullscreen original story browser behavior.
- Keeps iPhone behavior unchanged.

## Files changed

- `NutsNews/NutsNews/Support/SafariView.swift`
- `NutsNews/NutsNews/Features/Article/ArticleDetailView.swift`
