---
title: Edge Feed Snapshot Admin Health Update
wiki:
  source_route: /technical/updates/readme-edge-feed-snapshot-admin-health-update/
  simple_route: /simple/updates/readme-edge-feed-snapshot-admin-health-update/
  primary_diagram:
    file: diagrams/updates/README_EDGE_FEED_SNAPSHOT_ADMIN_HEALTH_UPDATE.md
    accTitle: "Edge Feed Snapshot Admin Health Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 6e538a8071c8d57513d9e715c08bcd03e2f8da67a77e8a12956638929e7063bf
---

# Edge Feed Snapshot Admin Health Update

This update improves the `/admin/edge-snapshot` dashboard so it can explain Worker fallback problems instead of only showing a generic HTTP error.

## Changes

- The web app now parses the Worker status JSON even when the Worker reports an unhealthy state.
- The admin dashboard now shows:
  - endpoint configured
  - Worker KV binding
  - HTTP status
  - snapshot age
  - article count
  - version
- A dev-only admin auth bypass is available only when:
  - `NUTSNEWS_ADMIN_TEST_AUTH_BYPASS=true`
  - `NODE_ENV !== "production"`
- The offline web E2E regression now verifies that `/admin/edge-snapshot` reflects a healthy mocked Worker status.

## Healthy dashboard

Expected healthy values:

```text
Current Status: Edge fallback ready
status: hit
Endpoint configured: Yes
Worker KV binding: Yes
HTTP status: 200
Article count: greater than 0
Version: 1
```

## Unhealthy Worker binding

If the Worker status payload says `status: unbound` or `kvBound: false`, redeploy the Worker with `NUTSNEWS_KV_NAMESPACE_ID` set.
