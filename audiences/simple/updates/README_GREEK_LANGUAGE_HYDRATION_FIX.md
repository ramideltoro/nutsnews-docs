---
title: Greek language hydration fix
wiki:
  source_route: /technical/updates/readme-greek-language-hydration-fix/
  simple_route: /simple/updates/readme-greek-language-hydration-fix/
  primary_diagram:
    file: diagrams/updates/README_GREEK_LANGUAGE_HYDRATION_FIX.mmd
    accTitle: "Greek language hydration fix diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: d634947df2f2cc83a00f43641e63805c5d818bba5f7c997e2685e24d163de496
---

# Greek language hydration fix

This update fixes a React hydration warning that appeared after selecting Greek and reloading the home page.

## Problem

`ThemeSwitcher` read `nutsnews.web.language` from `localStorage` during the initial client render. The server rendered the settings gear with English copy, while the first client render immediately used Greek copy. That changed attributes such as `aria-label` during hydration and caused a mismatch.

## Fix

`ThemeSwitcher` now starts with the same default language used by server rendering, then reads the stored browser language after hydration. It also listens for NutsNews language change and storage events so the settings menu stays in sync after the page is hydrated.

## Verification

1. Select Greek from the NutsNews settings menu.
2. Reload the home page.
3. Confirm the page loads without the hydration warning.
4. Open settings and confirm the settings labels still render in Greek after hydration.
