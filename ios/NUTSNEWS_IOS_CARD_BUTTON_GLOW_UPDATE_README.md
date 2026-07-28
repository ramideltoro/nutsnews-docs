---
wiki:
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 953d32518f043c490e8bbb0e61590ddb51e775031ff009ae7d958c5a683aa13a
---
# NutsNews iOS Card Button Glow Update

This update makes the card action buttons glow when tapped.

## What changed

- The Like button now gets a short theme-colored button glow when tapped.
- The Read Story button now gets the same theme-colored glow when tapped.
- The existing liked-card glow/border behavior is preserved.
- Read Story opens right after the glow starts so the app still feels responsive.

## File changed

- `NutsNews/NutsNews/Features/Feed/ArticleCardView.swift`
