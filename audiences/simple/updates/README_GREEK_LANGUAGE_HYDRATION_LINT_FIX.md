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
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 164df6dbc8bedfcf500b79850ca46f6de26d703d514ea61fb8d51cae79dcd847
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
