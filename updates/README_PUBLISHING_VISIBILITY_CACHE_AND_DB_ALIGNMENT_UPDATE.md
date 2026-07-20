# Publishing Visibility Cache And DB Alignment Update

## Simple Summary

New stories were saved, but the front page was showing an old copy. We cleared the website caches and checked that the Worker and website are using the same backend database path for the live feed.

## Intermediate Summary

On 2026-07-20, the public article API and Worker edge snapshot already contained fresh July 20 articles, but `https://www.nutsnews.com/` served stale HTML from Cloudflare/Vercel cache. The recovery cleared Vercel CDN/Data cache and then Cloudflare cache so the normal homepage URL showed the new article titles without cache-busting parameters. The database alignment check confirmed production Worker writes use `backend_postgres_primary` through `https://backend.nutsnews.com/api/worker/db/*`, while the web app in `backend_postgres_primary` reads through `https://backend.nutsnews.com/api/app/db/*`. Direct Supabase public tables for project `mpqfulvvagyzqneiaqky` were observed behind the backend feed during this check and should not be treated as the active serving path while backend PostgreSQL primary mode is enabled.

## Expert Summary

Related work:

- Worker PR: https://github.com/ramideltoro/nutsnews-worker/pull/50
- Worker issue: https://github.com/ramideltoro/nutsnews-worker/issues/49
- Cloudflare purge workflow runs:
  - https://github.com/ramideltoro/nutsnews/actions/runs/29781225455
  - https://github.com/ramideltoro/nutsnews/actions/runs/29781375043

Observed runtime paths:

- Worker live `kv-status` reported `databaseProviderMode=backend_postgres_primary`, `databaseProvider=backend_postgres`, `publicFeedSnapshotRefreshOk=true`, and `publicFeedEdgeSnapshotPublishOk=true`.
- Worker write/read route shape is `https://backend.nutsnews.com/api/worker/db/<operation>`.
- Worker accepted article persistence uses backend operations such as `save-accepted-articles-batch`, `publish-articles-batch`, and `refresh-public-feed-snapshot`.
- Web production runtime reported `NUTSNEWS_DATABASE_PROVIDER_MODE=backend_postgres_primary`.
- Deployed web commit `993c2f7775739bb231f2861a9b1b9c429a25ce9e` uses `callBackendDatabaseOperation()` for public feed reads in backend primary mode.
- Web read route shape is `https://backend.nutsnews.com/api/app/db/<operation>`.
- The authenticated app backend read `load-public-feed-snapshot` returned the same top five article IDs as `/api/articles?page=0` and the Worker edge snapshot.
- Public `NEXT_PUBLIC_SUPABASE_URL` still points to Supabase project `mpqfulvvagyzqneiaqky`, but direct anonymous reads from its `public_feed_snapshot` and `articles` tables lagged the backend feed at the time of the check. That is expected to differ from the active serving path while app and Worker are in `backend_postgres_primary`.

```mermaid
flowchart TD
  worker[Cloudflare Worker shards] --> workerDbApi[backend.nutsnews.com /api/worker/db]
  workerDbApi --> backendDb[(Backend PostgreSQL primary)]
  app[www.nutsnews.com Next.js app] --> appDbApi[backend.nutsnews.com /api/app/db]
  appDbApi --> backendDb
  backendDb --> appFeed[/api/articles and /api/home-feed]
  backendDb --> edgeSnapshot[Worker public-feed-snapshot KV]
  supabase[(Supabase project mpqful...)] -. legacy/public env, not active primary .-> app
  appFeed --> cf[Vercel and Cloudflare caches]
  cf --> reader[Reader homepage]
```

## Operational Notes

Recovery sequence used:

1. Confirm `/api/articles?page=0` returned fresh July 20 article IDs.
2. Confirm normal `/` HTML was stale while a cache-busting query rendered fresh content.
3. Run the existing Cloudflare purge workflow.
4. Purge Vercel CDN/Data cache with the Vercel CLI against the linked `nutsnews/nutsnews` project.
5. Run the Cloudflare purge workflow again because the first Cloudflare purge had cached a stale Vercel response.
6. Recheck normal `/` and confirm the July 20 titles appeared with no query parameter.
7. Compare Worker edge snapshot, web app API, authenticated web backend DB API, and authenticated worker backend DB API read results.

## Risks And Mitigations

- Risk: Vercel or Cloudflare can cache a stale homepage even after articles are published.
  - Mitigation: For incident recovery, purge Vercel CDN/Data cache first, then Cloudflare cache.
- Risk: Direct Supabase checks can mislead operators during `backend_postgres_primary`.
  - Mitigation: Treat backend DB API reads and public app API reads as authoritative for the active serving path.
- Risk: Cache purges temporarily reduce cache hit rate and can increase origin load.
  - Mitigation: Use targeted validation first; purge only when the normal homepage or API is observably stale.

## Rollback

No code rollback was performed for this recovery. If backend primary mode needs rollback, follow the backend provider switch runbook and move app/Worker back to the reviewed Supabase primary path with the required protected confirmation. For cache-only issues, repeat the Vercel CDN/Data cache purge followed by Cloudflare purge, then verify normal `/`, `/api/articles?page=0`, and Worker `public-feed-snapshot/status`.
