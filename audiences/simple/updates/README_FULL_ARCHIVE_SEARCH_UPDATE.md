---
title: Full Archive Search Update
wiki:
  source_route: /technical/updates/readme-full-archive-search-update/
  simple_route: /simple/updates/readme-full-archive-search-update/
  primary_diagram:
    file: diagrams/updates/README_FULL_ARCHIVE_SEARCH_UPDATE.md
    accTitle: "Full Archive Search Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 54e417e77c6bc71aafdbcc6908c8ceb4e530508546d2e681cedc94b307a16472
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
