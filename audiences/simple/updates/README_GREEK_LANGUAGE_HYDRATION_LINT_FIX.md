---
title: Greek Language Hydration Lint Fix
wiki:
  source_route: /technical/updates/readme-greek-language-hydration-lint-fix/
  simple_route: /simple/updates/readme-greek-language-hydration-lint-fix/
  primary_diagram:
    file: diagrams/updates/README_GREEK_LANGUAGE_HYDRATION_LINT_FIX.md
    accTitle: "Greek Language Hydration Lint Fix diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 59fa6d2d93712aaec7e203681b9398f526636ad78a2ae13648ef6793d78282fd
---

# Greek Language Hydration Lint Fix

This update keeps the ThemeSwitcher hydration-safe without violating the React hooks lint rule.

## What changed

- Replaced direct language `setState` in `useEffect` with `useSyncExternalStore`.
- The server and first client render still use the default language snapshot, preventing hydration mismatches.
- After hydration, the client reads the persisted language from localStorage and updates the UI.
- Language changes still sync through the existing `nutsnews:language-change` event and cross-tab `storage` events.

## Files changed

- `web/app/components/ThemeSwitcher.tsx`
