# NutsNews iOS Safari Delegate Build Fix

This fixes the Swift build error in `SafariView.swift`.

## What changed

- Moved `safariViewController.delegate = self` to after `super.init(...)`.
- Keeps the iPad forced-fullscreen original story browser behavior.
- Keeps iPhone behavior unchanged.

## Files changed

- `NutsNews/NutsNews/Support/SafariView.swift`
- `NutsNews/NutsNews/Features/Article/ArticleDetailView.swift`
