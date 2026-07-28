---
title: Operations
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

This document explains how NutsNews is operated and maintained.

For the VPS GitOps operating model, CI stability layer, Ops Portal goal, home
server support-node rules, email reports, and provider migration strategy, start
with:

```text
docs/NUTSNEWS_INFRA_OPERATIONS_PLATFORM.md
```

## Admin portal

The admin portal lives at:

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

### Article Review Dashboard

Route:

```text
/admin/articles
```

Purpose:

- Show recently reviewed articles
- Sort reviewed articles by review time
- Filter by accepted/rejected decision
- Filter by source
- Filter by category
- Filter by positivity score
- Show rejection reasons
- Link to the original article
- Link to the published NutsNews story when available
- Support manual investigation of bad AI decisions
- Show whether OpenAI, local AI, or local rules processed each article
- Show the exact AI model name saved with the article review

Detailed guide:

```text
docs/ADMIN_ARTICLE_REVIEWS.md
```

### AI Usage Dashboard

Route:

```text
/admin/ai-usage
```

Purpose:

- Track OpenAI calls
- Track prompt tokens
- Track completion tokens
- Track total tokens
- Track estimated cost
- Track accepted/rejected reviews
- Track cost protection hits
- Track spike warnings

### Local AI Dashboard

Route:

```text
/admin/local-ai
```

Purpose:

- Track Oracle-hosted local AI calls
- Track qwen/Ollama model usage
- Track local accepted/rejected decisions
- Track local review latency
- Track OpenAI fallback calls while local AI mode is enabled
- Show recent local AI article decisions
- Compare model-level quality signals while testing new local models

Detailed guide:

```text
docs/ORACLE_LOCAL_AI.md
```

### Worker Shard Health Dashboard

Route:

```text
/admin/shards
```

Purpose:

- Track Worker shard freshness
- Identify failed shards
- Identify stale shards
- Show latest errors
- Show failed Worker runs
- Show feed counts
- Show accepted/rejected counts
- Show image hydration metrics

### Feed Health Dashboard

Route:

```text
/admin/feed-health
```

Purpose:

- Show RSS feed reliability
- Show repeated failures
- Show thumbnail coverage
- Show accepted output
- Identify weak feeds
- Compare source quality signals

### Feed Management Dashboard

Route:

```text
/admin/feeds
```

Purpose:

- List RSS feeds
- Show 0-100 source quality scores
- Show source quality grades
- Enable feeds
- Disable feeds
- Inspect active/inactive status
- Manage bad sources without code deploys

## Deployment checklist

The repeatable production deployment checklist lives in:

```text
docs/DEPLOYMENT_CHECKLIST.md
```

Use that guide when releasing changes to:

- Vercel web app and preview deployments
- GHCR image publishing and reviewed VPS digest promotion
- Cloudflare Worker shards
- Controller Worker
- Supabase migrations
- Cloudflare cache behavior
- Post-deploy verification commands

Quick post-deploy verification:

```bash
./scripts/post_deploy_verify.sh
```

With an article path:

```bash
./scripts/post_deploy_verify.sh https://www.nutsnews.com /articles/<article-id>
```

## Deployment model

### Web

The web app has one source tree, `ramideltoro/nutsnews/web`.

Vercel remains the primary production target and continues its Git-based native
build. GitHub Actions also prepares a production OCI image from the same commit
for GHCR. Only `ramideltoro/nutsnews-infra` may promote that image's immutable
digest to the VPS.

The issue #67 state is prepared, not deployed: the VPS application, staged route,
and public route remain disabled, and `nutsnews.com` remains on Vercel.
See [Dual-Target Web Deployment](NUTSNEWS_DUAL_TARGET_WEB_DEPLOYMENT.md).

Common commands:

```bash
cd web
npm ci
npm run build
```

### Worker shards

Worker shard configs are generated.

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
