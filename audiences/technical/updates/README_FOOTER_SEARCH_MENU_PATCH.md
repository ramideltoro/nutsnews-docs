---
title: NutsNews Footer Search Menu Patch
wiki:
  source_route: /technical/updates/readme-footer-search-menu-patch/
  simple_route: /simple/updates/readme-footer-search-menu-patch/
  primary_diagram:
    file: diagrams/updates/README_FOOTER_SEARCH_MENU_PATCH.mmd
    accTitle: "NutsNews Footer Search Menu Patch diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 397967a9d7a9020b4ae52c9dc96589128bb0f609e6ae1106080160a0adb843a5
---

# NutsNews Footer Search Menu Patch

This is a UI-only patch that keeps the existing `/api/search` backend but moves search out of the home feed.

## What changed

- Removed the inline search box from the home page feed.
- Added a search icon to the footer controls.
- The footer search icon opens a search menu/dialog.
- The search menu calls the existing `/api/search` endpoint.
- Search results appear inside the menu.
- The normal home feed and infinite scroll work without search mode interruptions.

## Files changed

- `web/app/components/ArticleFeed.tsx`
- `web/app/components/SiteFooter.tsx`

## Install

```zsh
cd /Users/ramideltoro/WebstormProjects/nutsnews3

zsh ~/Downloads/nutsnews-footer-search-menu-patch/nutsnews_footer_search_menu_patch/scripts/install_footer_search_menu_patch.sh \
  ~/Downloads/nutsnews-footer-search-menu-patch/nutsnews_footer_search_menu_patch
```

## Test

```zsh
cd /Users/ramideltoro/WebstormProjects/nutsnews3/web
npm run build
npm run dev
```

Open `http://localhost:3000` and test:

1. The home page search box is gone.
2. The footer has a search icon near the home/theme controls.
3. Tapping the search icon opens the search menu.
4. Searching returns full archive results from `/api/search`.
5. Closing the menu returns to the normal home feed.
