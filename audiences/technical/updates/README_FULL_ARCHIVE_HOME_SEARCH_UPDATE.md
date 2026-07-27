---
title: NutsNews full archive home search update
wiki:
  source_route: /technical/updates/readme-full-archive-home-search-update/
  simple_route: /simple/updates/readme-full-archive-home-search-update/
  primary_diagram:
    file: diagrams/updates/README_FULL_ARCHIVE_HOME_SEARCH_UPDATE.md
    accTitle: "NutsNews full archive home search update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 104b9ff51820ef2d30fab7efe07d77472c6b397faf6520449fe89049f22a222b
---

# NutsNews full archive home search update

This update keeps full archive search in the backend, but changes the website UX so search happens directly on the home page instead of sending visitors to a separate `/search` page.

## What changed

- Adds Supabase full-text search support through `public.search_articles(...)`.
- Adds `/api/search` for the website and iOS app to use later.
- Adds a full archive search text box directly above the home feed.
- Search results render directly on the home page.
- Clear search returns the normal home feed and infinite scroll.
- Removes the standalone `/search` page if an earlier search update created it.
- Restores the home hero so there is no separate “Search all NutsNews” button.
- Restores the footer so there is no separate Search link.

## Required order

1. Copy this update into `/Users/ramideltoro/WebstormProjects/nutsnews3`.
2. Run the Supabase SQL migration.
3. Test `/api/search` locally.
4. Test the home page inline search locally.
5. Deploy.
6. Test production `/api/search` and the production home page.
7. Only then update the iOS app to use `/api/search`.

## Production endpoint

After deployment, iOS should eventually call:

```text
https://www.nutsnews.com/api/search?q=dogs&page=0&limit=20
```
