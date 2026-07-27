---
title: Issue 104 Edge Feed Snapshot Fallback Update
wiki:
  source_route: /technical/updates/readme-issue-104-edge-feed-snapshot-fallback/
  simple_route: /simple/updates/readme-issue-104-edge-feed-snapshot-fallback/
  primary_diagram:
    file: diagrams/updates/README_ISSUE_104_EDGE_FEED_SNAPSHOT_FALLBACK.md
    accTitle: "Issue 104 Edge Feed Snapshot Fallback Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 4ae46154fd3297a264505a0ce600c020e276626fd0d6f287ea5555b8d007c54b
---

# Issue 104 Edge Feed Snapshot Fallback Update

This update implements GitHub issue #104.

## Added

- Worker `/public-feed-snapshot` endpoint backed by Cloudflare KV
- Worker `/public-feed-snapshot/status` endpoint
- Worker KV publish step after `refresh_public_feed_snapshot`
- Web fallback from `/api/articles` to the Worker edge snapshot
- Homepage initial feed and category-section fallback helpers
- `/admin/edge-snapshot` status dashboard
- Response headers for edge snapshot age, version, and article count
- Offline web E2E coverage for Supabase outage recovery through edge snapshot

## Required config

Web:

```bash
NUTSNEWS_EDGE_FEED_SNAPSHOT_URL="https://nutsnews-worker-0.nutsnews.workers.dev"
```

Worker:

```bash
NUTSNEWS_KV_NAMESPACE_ID="paste_namespace_id_here"
PUBLIC_FEED_EDGE_SNAPSHOT_LIMIT=120
PUBLIC_FEED_EDGE_SNAPSHOT_TTL_SECONDS=604800
```

## Docs

Main runbook:

```text
docs/PUBLIC_FEED_SNAPSHOT.md
```
