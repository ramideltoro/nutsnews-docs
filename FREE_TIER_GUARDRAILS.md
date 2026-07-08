# NutsNews Free-Tier Guardrails

Issue #116 adds a dedicated admin dashboard at `/admin/guardrails` for cost forecasting and free-tier risk monitoring.

The dashboard tracks the data NutsNews already has and clearly labels anything that needs provider input:

- Database growth: `articles`, `article_summaries`, and `rss_feeds` row counts.
- AI usage: OpenAI calls, token usage, estimated cost, local AI calls, cost protection hits, and spike warnings from `ai_usage_runs`.
- Worker usage: saved Worker runs and failures from `worker_runs`.
- Email usage: successful contact form deliveries recorded in `quota_usage_events`.
- Redis/KV, egress, and PageSpeed/API usage: optional environment overrides until provider counters are persisted.

## Environment overrides

These values are optional. The dashboard has safe defaults for the core NutsNews data and shows `Unknown` for provider usage that is not available yet.

```bash
NUTSNEWS_DB_CONTENT_ROW_LIMIT=50000
NUTSNEWS_ARTICLE_ROW_LIMIT=30000
NUTSNEWS_ARTICLE_SUMMARY_ROW_LIMIT=90000
NUTSNEWS_OPENAI_MONTHLY_BUDGET_USD=5
NUTSNEWS_OPENAI_MONTHLY_CALL_LIMIT=50000
NUTSNEWS_WORKER_MONTHLY_INVOCATION_LIMIT=100000
NUTSNEWS_WORKER_24H_FAILURE_LIMIT=5
NUTSNEWS_EMAIL_MONTHLY_SEND_LIMIT=3000
NUTSNEWS_REDIS_KV_30D_OPS=0
NUTSNEWS_REDIS_KV_30D_OP_LIMIT=100000
NUTSNEWS_EGRESS_30D_GB=0
NUTSNEWS_EGRESS_30D_GB_LIMIT=100
NUTSNEWS_PAGESPEED_30D_CALLS=0
NUTSNEWS_PAGESPEED_30D_CALL_LIMIT=25000
```

## Warning behavior

Most metrics warn at 70% of the configured limit and enter danger at 90%. AI cost warns earlier at 60% and enters danger at 85% so there is more time to reduce reviews or switch to local AI.

## Ops Portal service quota catalog

The VPS Ops Portal has a separate read-only Free Tier Usage section for infrastructure and cloud-service quotas. It is managed from `ramideltoro/nutsnews-infra` in `vps_service_foundation_free_tier_quotas`, rendered by the protected Ansible apply workflow, and exposed only as sanitized `status.json` fields.

Current service groups are:

| Service | Quota areas |
| --- | --- |
| Local VPS | Host CPU/RAM/disk/swap, Docker storage, backup cache, latest snapshot freshness |
| Vercel | Hobby usage summary plus relevant deployment/build limits |
| Sentry | Developer Free errors, logs, application metrics, spans, replays, monitors, attachments |
| Cloudflare | Workers, Workers KV, Pages, and R2 |
| Better Stack | Monitoring, status pages, telemetry, errors, web events, session replays |
| Supabase | Egress, database size, Auth MAU, third-party MAU, storage, Edge Functions, Realtime |
| Grafana Cloud | Metrics, logs, traces, profiles, Synthetic Monitoring, Frontend Observability |
| GitHub Actions | Hosted runner minutes, artifact storage, cache storage, REST API primary rate limit |

Every metric row must be honest about its source. `measured` means the collector had current usage. `missing credential`, `unavailable`, `unsupported`, and `unknown` mean the free limit is known but the current usage is not safely available yet. Do not fill these rows with guesses.

For Vercel, the only accepted usage source is the read-only Billing Charges FOCUS endpoint configured through `NUTSNEWS_VERCEL_USAGE_API_URL` and `NUTSNEWS_VERCEL_API_TOKEN`. Do not use `NUTSNEWS_FREE_TIER_USAGE_JSON` placeholder zeroes for Vercel; if the live endpoint is unavailable, the portal must show unavailable with the safe backend reason.

Related doc: [NutsNews Operations Portal v1](NUTSNEWS_OPERATIONS_PORTAL_V1.md).

## Grafana Cloud observability guardrails

The VPS Grafana Cloud layer adds a separate Usage / Quota dashboard and Grafana-managed alert rules for Grafana Cloud telemetry usage. Current assumptions are documented in [NutsNews Grafana Cloud Observability](NUTSNEWS_GRAFANA_CLOUD_OBSERVABILITY.md), and the live Grafana pricing page must be checked before adding more telemetry.

Important defaults:

| Area | Guardrail behavior |
| --- | --- |
| Metrics | Alloy defaults to 60-second scrape intervals and drops high-cardinality labels before remote write. |
| Logs | Alloy redacts secrets/IPs, drops debug/trace logs, limits line size, and rate-limits journald/file/Docker streams. |
| Synthetic Monitoring | Optional checks are disabled until targets and probe IDs are supplied through protected variables; apply is blocked above 70% of the current free API execution assumption. |
| k6 | Grafana Cloud k6 is not enabled by default; calculate VUh and get approval before enabling cloud runs. |

Related doc: [Grafana Cloud Observability](NUTSNEWS_GRAFANA_CLOUD_OBSERVABILITY.md).

## Worker ingestion backpressure guardrails

Issue #93 adds Worker-side pressure controls before AI/API/database-heavy work begins.

| Limit | Default | Owner action |
| --- | ---: | --- |
| `INGESTION_BACKPRESSURE_QUEUE_LIMIT` | `250` queued/unreviewed candidates | If exceeded, inspect `queuedBySource`, pause noisy feeds, lower manual review limits, or raise the threshold after confirming cost risk. |
| `INGESTION_BACKPRESSURE_DB_ARTICLE_LIMIT` | `30000` article rows | If reached, review DB growth, archive/prune old content where appropriate, and confirm public feed freshness before resuming expensive ingestion. |
| `UPSTASH_REDIS_WORKER_LOCK_TTL_SECONDS` | `600` seconds | If long runs overlap, verify Redis is enabled and increase the TTL while watching `worker.redis.worker_lock_extend_failed` logs. |

Worker reports now include queued, deferred, retried, processed, and Redis lock counters. See [Worker Backpressure and Lock Safety](WORKER_BACKPRESSURE_AND_LOCK_SAFETY.md).

## Mitigation runbook

When a metric enters `Watch` or `Danger`:

1. Open `/admin/guardrails` to identify the affected quota.
2. Open the related admin dashboard, such as `/admin/ai-usage`, `/admin/shards`, or `/admin/feed-health`.
3. Reduce the relevant load:
   - AI: lower `MAX_AI_REVIEWS`, prefer local AI, or reduce shard review limits.
   - DB growth: archive old rows, prune old translations, or disable weak feeds.
   - Worker runs: increase cron interval, reduce shard count, or pause low-value feeds.
   - Email: tighten Turnstile/rate limiting or temporarily route messages to a queue.
   - Egress/API: increase CDN caching, reduce response sizes, or run audits manually.
4. Verify the dashboard risk returns to `OK` before increasing load again.

## Image proxy/cache guardrails

Issue #105 adds design and guardrail coverage for a future optional image proxy/cache path. The production image proxy is not shipped yet, but `/admin/guardrails` now carries the quota language needed before any rollout.

| Service | Free-tier or cost note | Owner action |
| --- | --- | --- |
| Cloudflare Workers Free | 100,000 requests/day and 10 ms CPU per invocation. A future image proxy would share this account pool with existing Worker traffic. | Check `/admin/guardrails` and Cloudflare Workers usage. Alert at 70%, shrink traffic slice at 90%, and bypass the proxy or disable proxy writes at 100%. |
| Cloudflare R2 Standard | 10 GB-month storage/month, 1M Class A ops/month, 10M Class B ops/month, and free internet egress. Free tier does not apply to Infrequent Access storage. | Use Standard only for the initial approved-original cache. Freeze new cache writes at 90% and disable writes at 100%. |
| Cloudflare Images Free transformations | 5,000 unique transformations/month. Cached existing transformations continue after the limit; new transformations return error `9422`; Free plan is not charged for exceeding the limit. | Keep variants fixed and small. Freeze new transform variants at 90% and disable transforms at 100%. |
| Cloudflare Images hosted storage/delivery | Paid-only. | Do not use for the initial free-tier rollout without explicit owner approval and a billing budget. |

Official references:

- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Cloudflare Images pricing: https://developers.cloudflare.com/images/pricing/

Related design: [Secure Image Proxy/Cache Design](IMAGE_PROXY_CACHE_DESIGN.md).
