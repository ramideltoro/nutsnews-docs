---
title: NutsNews Home Search Box Layout Patch
wiki:
  source_route: /technical/updates/readme-home-search-box-layout-patch/
  simple_route: /simple/updates/readme-home-search-box-layout-patch/
  primary_diagram:
    file: diagrams/updates/README_HOME_SEARCH_BOX_LAYOUT_PATCH.md
    accTitle: "NutsNews Home Search Box Layout Patch diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: aa77f874f01ca9a7933dd9f7e3975c1fbe982fb381fcc7218568e2faf519c823
---

# NutsNews Home Search Box Layout Patch

This is a UI-only patch for the full archive search box on the home page.

## Changes

- Hides the visible `Search all NutsNews` label while keeping an accessible screen-reader label.
- Makes the search text box take the full line.
- Moves the Search button underneath the text box.
- Removes the helper text: `Search the full NutsNews archive, not just the stories currently loaded here.`
- Does not change Supabase, `/api/search`, article loading, or search behavior.

## Install

```zsh
cd /Users/ramideltoro/WebstormProjects/nutsnews3

zsh ~/Downloads/nutsnews-home-search-box-layout-patch/scripts/install_home_search_box_layout_patch.sh \
  ~/Downloads/nutsnews-home-search-box-layout-patch
```

## Test

```zsh
cd /Users/ramideltoro/WebstormProjects/nutsnews3/web
npm run build
npm run dev
```

Open `http://localhost:3000` and confirm:

1. `Search all NutsNews` is no longer visible.
2. The search input takes the whole line.
3. The Search button appears underneath.
4. The helper sentence is gone.
5. Searching still returns results on the home page.
