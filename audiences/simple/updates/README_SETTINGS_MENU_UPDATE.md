---
title: NutsNews Settings Menu Update
wiki:
  source_route: /technical/updates/readme-settings-menu-update/
  simple_route: /simple/updates/readme-settings-menu-update/
  primary_diagram:
    file: diagrams/updates/README_SETTINGS_MENU_UPDATE.mmd
    accTitle: "NutsNews Settings Menu Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 0e27461e34a5b4a5058dda7bf9a7150da60c25bfb1c18fb88782034d0dbc47ab
---

# NutsNews Settings Menu Update

This update reorganizes the footer Settings panel into a two-level menu.

## What changed

- Settings now opens to a top-level menu.
- Top-level menu items are `Theme` and `Language`.
- Theme options moved into a dedicated Theme level.
- Language options moved into a dedicated Language level.
- Language badges now show country flags instead of text language codes.
- Supported languages now include a `flag` field so future languages can be added cleanly.

## Files changed

- `web/app/components/ThemeSwitcher.tsx`
- `web/app/globals.css`
- `web/lib/languages.ts`

## Validation

Run from `web`:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

The Settings UI should behave like this:

1. Tap/click Settings.
2. See a top-level menu with Theme and Language.
3. Tap Theme to choose a theme.
4. Tap back to return to Settings.
5. Tap Language to choose English or Français.
6. Confirm the circular language badge shows 🇺🇸 or 🇫🇷 instead of `EN` or `FR`.
