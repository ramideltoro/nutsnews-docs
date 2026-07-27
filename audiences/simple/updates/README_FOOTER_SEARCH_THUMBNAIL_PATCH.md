---
title: NutsNews Footer Search Thumbnail Patch
wiki:
  source_route: /technical/updates/readme-footer-search-thumbnail-patch/
  simple_route: /simple/updates/readme-footer-search-thumbnail-patch/
  primary_diagram:
    file: diagrams/updates/README_FOOTER_SEARCH_THUMBNAIL_PATCH.md
    accTitle: "NutsNews Footer Search Thumbnail Patch diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 7e6f115aa5191755a8d66179e9c5a0abbb1ec565920d7dd2cac6b0692c7d5799
---

# NutsNews Footer Search Thumbnail Patch

This is a small UI-only patch for the existing centered footer search modal.

## What changed

- Search results now show the article thumbnail when `image_url` is available.
- Result cards use a responsive layout:
  - thumbnail above the text on narrow screens
  - thumbnail on the left on wider screens
- The patch does not change Supabase, `/api/search`, routing, or the footer search modal behavior.

## Install

```zsh
rm -rf ~/Downloads/nutsnews-footer-search-thumbnail-patch

ditto -x -k \
  ~/Downloads/nutsnews-footer-search-thumbnail-patch.zip \
  ~/Downloads/nutsnews-footer-search-thumbnail-patch

cd /Users/ramideltoro/WebstormProjects/nutsnews3

zsh ~/Downloads/nutsnews-footer-search-thumbnail-patch/nutsnews_footer_search_thumbnail_patch/scripts/install_footer_search_thumbnail_patch.sh \
  ~/Downloads/nutsnews-footer-search-thumbnail-patch/nutsnews_footer_search_thumbnail_patch
```

## Test

```zsh
cd /Users/ramideltoro/WebstormProjects/nutsnews3/web
npm run build
npm run dev
```

Open `http://localhost:3000`, click the footer search icon, search for `good`, and confirm the results include thumbnails.
