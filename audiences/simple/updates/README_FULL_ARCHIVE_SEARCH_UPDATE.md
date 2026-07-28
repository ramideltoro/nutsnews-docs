---
title: Full Archive Search Update
wiki:
  source_route: /technical/updates/readme-full-archive-search-update/
  simple_route: /simple/updates/readme-full-archive-search-update/
  primary_diagram:
    file: diagrams/updates/README_FULL_ARCHIVE_SEARCH_UPDATE.mmd
    accTitle: "Full Archive Search Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 80b7ec290a3f781bf4930b6fc9300087d3a87c0aa5b83cdad333ccbbff013c33
---

# Full Archive Search Update

This bundle adds backend-supported archive search to NutsNews web.

Apply it only to the web repository at:

```text
/Users/ramideltoro/WebstormProjects/nutsnews3
```

Do not apply this to the iOS project.

## Files included

- `supabase/migrations/20260626000000_add_full_archive_search.sql`
- `web/lib/articles.ts`
- `web/app/api/search/route.ts`
- `web/app/search/page.tsx`
- `web/app/search/SearchArchive.tsx`
- `web/app/page.tsx`
- `web/app/components/SiteFooter.tsx`
- `docs/FULL_ARCHIVE_SEARCH.md`
- `scripts/install_full_archive_search_update.sh`
