# Cloudflare KV Worker State for NutsNews

This update adds an optional Cloudflare Workers KV binding named `NUTSNEWS_KV` to the RSS shard Workers.

## Why KV is the right first upgrade

NutsNews already uses Supabase as the system of record. D1 would act like another relational database, so it is not the best first move unless NutsNews later wants to move part of the data model away from Supabase.

KV is a better fit now because it is cheap, global, and simple. It can store small pieces of operational state close to the Workers without becoming a second source of truth.

Use KV for:

- recent processed URL markers, so Workers can skip recently handled articles before going back to Supabase
- latest successful Worker run status
- latest shard run state
- lightweight RSS metadata such as failed feeds and counts inside the run snapshot
- future feature flags or emergency switches

Keep Supabase for:

- published articles
- article summaries and translations
- article review history
- admin dashboards
- searchable article archive

## What changed in code

### `worker/src/index.ts`

Adds optional `NUTSNEWS_KV` support.

When the binding exists, each RSS shard Worker now:

1. Reads a compact per-shard KV cache of recently processed URL hashes.
2. Skips Supabase processed-url lookup for URLs that KV already knows are processed.
3. Writes newly reviewed URLs back to a compact per-shard KV key after the Supabase review save succeeds.
4. Writes latest shard run state and latest successful run state to KV.
5. Exposes a safe debug endpoint:

```bash
curl "https://nutsnews-worker-0.nutsnews.workers.dev/kv-status"
```

The endpoint does not expose article URLs. Processed URL markers are stored as SHA-256 hashes.

### `worker/scripts/generate-wrangler-config.mjs`

Adds an optional KV binding to every generated shard config when this environment variable is present:

```bash
NUTSNEWS_KV_NAMESPACE_ID=<your-kv-namespace-id>
```

Optional preview namespace:

```bash
NUTSNEWS_KV_PREVIEW_NAMESPACE_ID=<your-preview-kv-namespace-id>
```

Optional marker size override:

```bash
KV_RECENT_PROCESSED_URL_LIMIT=2000
```

## Why this stays within the free KV write limits

Cloudflare Workers KV free limits are small enough that NutsNews treats KV as scarce runtime capacity, especially for writes. As of the 2026 Cloudflare KV limits page, the free tier includes 100,000 reads per day, 1,000 writes per day to different keys, and 1,000 external-service operations per Worker invocation.

The Worker must not use KV as per-event telemetry or as a per-article write log. The allowed production-runtime KV paths are:

- one compact recent processed URL marker key per shard
- one public feed edge snapshot key when the snapshot article payload changes
- latest shard run state and latest successful run state when a refresh does real work
- direct status/debug reads for `/kv-status` and `/public-feed-snapshot`

It does **not** write one KV key per article, because that could burn through the free daily write limit quickly.

Runtime code should avoid:

- `KV.list()` in cron, controller, shard refresh, or request paths
- per-event, per-log-entry, per-feed, or per-article KV writes
- writing unchanged JSON values
- using KV for observability that can be included in the final buffered log payload

Current Worker safeguards:

- KV reads are cached inside a single Worker invocation.
- KV operation counts are tracked in memory and included in the refresh result and final buffered log flush.
- Unchanged recent-URL cache writes are skipped.
- Public feed edge snapshot writes are skipped when the article payload has not changed.
- Idle scheduled refreshes skip KV run-state writes.
- KV read/write failures, including 429 rate-limit responses, are logged and treated as cache/state misses so article refresh can continue through Supabase.

## Setup

Create one KV namespace:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews3/worker
npx wrangler kv namespace create NUTSNEWS_KV
```

Copy the generated namespace ID from Wrangler output, then export it before deploying shards:

```bash
export NUTSNEWS_KV_NAMESPACE_ID="paste_the_id_here"
```

Then regenerate and deploy shards:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews3/worker
npm run generate:wrangler
npm run deploy:all
```

## Verify

After deployment, run:

```bash
curl "https://nutsnews-worker-0.nutsnews.workers.dev/kv-status"
```

You should see:

```json
{
  "kvEnabled": true,
  "shardIndex": 0,
  "latestShardRun": null,
  "lastSuccessfulRun": null,
  "recentProcessedUrlCache": null
}
```

After the Worker runs once, `latestShardRun`, `lastSuccessfulRun`, and `recentProcessedUrlCache.hashCount` should start filling in.

## Notes on article API response caching

The current public article API is a Next.js/Vercel route at `/api/articles`. That route already sends cache headers, so Cloudflare can cache it at the HTTP edge without KV.

KV becomes useful for article API response caching only if NutsNews later adds a dedicated Cloudflare Worker in front of `/api/articles` or moves the public feed endpoint to Cloudflare Pages/Workers. For the current architecture, this update intentionally uses KV where it is safest: RSS Worker state and dedupe hints.
