---
title: Operations (Simple)
wiki:
  source_route: /technical/operations/
  simple_route: /simple/operations/
  primary_diagram:
    file: diagrams/OPERATIONS.mmd
    accTitle: "Operations and deploy flow"
    accDescr: "A high-level view of publish checks, deployment paths, admin ops routes, and runtime verification."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: d5891a5ad27aa7f190fb35e996aae96798925ae6d30aef406665c15189bcbcf8
---

# Operations

This article is how the NutsNews team runs and maintains the project.

Start with:

```text
docs/NUTSNEWS_INFRA_OPERATIONS_PLATFORM.md
```

for:

- VPS GitOps operating model
- CI stability
- Ops Portal goals
- Home server support-node rules
- email reports
- provider migration strategy

## Admin portal

The admin portal is at:

```text
/admin
```

It is protected by Google login and an approved admin email allowlist.

Current admin routes:

```text
/admin
/admin/articles
/admin/ai-usage
/admin/local-ai
/admin/shards
/admin/feed-health
/admin/feeds
/admin/login
```

## Admin dashboards

### Article Review

Route:

```text
/admin/articles
```

Use this to:

- review recent article decisions
- sort by review time
- filter accepted/rejected decisions, source, category, and score
- see rejection reasons
- jump to original source and published story
- investigate AI failures manually
- confirm whether OpenAI, local AI, or local rules made each decision
- check the saved model name for each review

Detailed guide:

```text
docs/ADMIN_ARTICLE_REVIEWS.md
```

### AI Usage

Route:

```text
/admin/ai-usage
```

Use this to track:

- OpenAI calls
- prompt, completion, and total token usage
- estimated spend
- accepted/rejected review outcomes
- cost-protection events
- token spike warnings

### Local AI

Route:

```text
/admin/local-ai
```

Use this to track:

- Oracle-hosted local AI calls
- qwen/Ollama model usage
- accepted/rejected local decisions
- local review latency
- OpenAI fallback activity while local mode runs
- recent local AI decision history
- model-level quality comparisons while testing

Detailed guide:

```text
docs/ORACLE_LOCAL_AI.md
```

### Worker Shard Health

Route:

```text
/admin/shards
```

Use this to monitor:

- shard freshness
- failed or stale shards
- latest errors
- failed worker runs
- feed counts
- accepted/rejected counts
- image hydration

### Feed Health

Route:

```text
/admin/feed-health
```

Use this to monitor:

- RSS reliability
- repeated failures
- thumbnail coverage
- accepted output
- weak feeds
- source quality comparisons

### Feed Management

Route:

```text
/admin/feeds
```

Use this to:

- list RSS feeds
- view 0-100 source scores
- view source grades
- enable/disable feeds
- inspect source active state
- fix bad sources without code deploys

## Deployment checklist

Use:

```text
docs/DEPLOYMENT_CHECKLIST.md
```

for releases of:

- Vercel web app and previews
- GHCR image publishing and VPS digest promotion
- Cloudflare Worker shards
- Controller Worker
- Supabase migrations
- Cloudflare cache changes
- post-deploy checks

Quick check:

```bash
./scripts/post_deploy_verify.sh
```

With a specific article:

```bash
./scripts/post_deploy_verify.sh https://www.nutsnews.com /articles/<article-id>
```

## Deployment model

### Web

The web app source is `ramideltoro/nutsnews/web`.

Vercel stays the primary production target and uses a Git-based build.
GitHub Actions also publishes production OCI images to GHCR.
Only `ramideltoro/nutsnews-infra` can promote immutable VPS digests.

The issue #67 state is prepared, not deployed. The VPS app, staged route, and public
route are still disabled, and `nutsnews.com` stays on Vercel.
See [Dual-Target Web Deployment](NUTSNEWS_DUAL_TARGET_WEB_DEPLOYMENT.md).

Common commands:

```bash
cd web
npm ci
npm run build
```

### Worker shards

Generate Worker shard configs:

```bash
cd worker
npm run generate:wrangler
```

Deploy one shard:

```bash
npx wrangler deploy --config generated-wrangler/wrangler.shard0.jsonc
```

Deploy controller:

```bash
cd controller
npx wrangler deploy
```

## Useful runtime checks

### Public site

```bash
curl -I "https://www.nutsnews.com/"
```

### Article API

```bash
curl -s "https://www.nutsnews.com/api/articles?page=0"
```
