---
title: Edge Feed Snapshot Health Update
wiki:
  source_route: /technical/updates/readme-edge-feed-snapshot-health-update/
  simple_route: /simple/updates/readme-edge-feed-snapshot-health-update/
  primary_diagram:
    file: diagrams/updates/README_EDGE_FEED_SNAPSHOT_HEALTH_UPDATE.mmd
    accTitle: "Edge Feed Snapshot Health Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 423eaecaf237f62c4865924a418b6610ae5e6245b5b9ac6123b26f849d1bb318
---

# Edge Feed Snapshot Health Update

This update makes the Cloudflare Worker edge snapshot fallback easier to diagnose and harder to deploy incorrectly.

## Changes

- `/public-feed-snapshot/status` now returns an inspectable JSON status payload with:
  - `ready`
  - `kvBound`
  - `configured`
  - `enabled`
  - `status`
  - `articleCount`
  - `ageSeconds`
  - `version`
  - `message`
- The status endpoint returns HTTP 200 for dashboard inspection, even when the fallback is not ready.
- The actual fallback feed endpoint still returns an error when KV is missing or no snapshot exists.
- Wrangler config generation now requires `NUTSNEWS_KV_NAMESPACE_ID`.
- Worker CI provides a fake KV namespace id for type/config checks.
- A scheduled/manual GitHub Action checks the live Worker status endpoint and feed payload.

## Healthy status

Expected healthy payload:

```json
{
  "ready": true,
  "kvBound": true,
  "status": "hit",
  "articleCount": 120,
  "version": 1
}
```

## Recovery

If status shows `status: "unbound"`:

1. Export `NUTSNEWS_KV_NAMESPACE_ID`.
2. Regenerate Wrangler configs.
3. Deploy the Worker shards.
4. Run one Worker refresh to publish a new edge snapshot.
5. Recheck `/public-feed-snapshot/status`.
