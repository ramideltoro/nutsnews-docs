---
title: Full archive search
wiki:
  source_route: /technical/full-archive-search/
  simple_route: /simple/full-archive-search/
  primary_diagram:
    file: diagrams/FULL_ARCHIVE_SEARCH.mmd
    accTitle: "Archive search architecture"
    accDescr: "A user search query hits /api/search, the API runs PostgreSQL full-text search, and the web feed renders results with pagination."
  status: active
  collection: product-and-reader-experience
  section: public-product
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 82c9e4b919d065dc116089267429ff58c5be9678e73148d5f59d34729180f517
---

# Full archive search

NutsNews full archive search is backed by PostgreSQL full-text search in Supabase.

## Database pieces

The migration adds:

- `articles.search_vector`, a generated `tsvector` column
- `articles_search_vector_idx`, a GIN index for fast search
- `articles_search_published_idx`, an index for published story ordering
- `public.search_articles(search_query, page_size, page_offset)`, an RPC function used by the web API

## Search weights

- Title: A
- AI summary: B
- Source: C
- Category: C

## Web API

The API route is:

```text
GET /api/search?q=dogs&page=0&limit=20
```

Response shape:

```json
{
  "articles": [],
  "nextPage": null,
  "query": "dogs",
  "page": 0,
  "pageSize": 20,
  "languageCode": "en"
}
```

## Home page UX

The search box is built into the existing home feed component:

```text
web/app/components/ArticleFeed.tsx
```

When a user searches, the home page switches from normal feed mode to archive search mode. The clear button returns to the normal feed and infinite scroll.

## Local tests

```zsh
cd /Users/ramideltoro/WebstormProjects/nutsnews3/web
npm run build
npm run dev
```

Then:

```zsh
curl -s "http://localhost:3000/api/search?q=dogs&limit=5" | python3 -m json.tool
curl -I "http://localhost:3000/api/search?q=dogs&limit=5"
```

Open:

```text
http://localhost:3000
```

Search for `dogs`, `community`, `science`, and a nonsense query like `zzzzzzzzzz`.
