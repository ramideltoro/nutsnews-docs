---
title: "Automated NutsNews Backend Merge Log (Technical)"
description: "Technical records of merged backend changes."
wiki:
  source_route: "/technical/updates/automated-nutsnews-backend-merge-log"
  simple_route: "/simple/updates/automated-nutsnews-backend-merge-log"
  slug: "updates/automated-nutsnews-backend-merge-log"
  primary_diagram:
    file: "diagrams/updates/AUTOMATED_NUTSNEWS_BACKEND_MERGE_LOG.mmd"
    accTitle: "Qwen credential readiness mapping after backend pull request 442"
    accDescr: "A protected production-backend source credential is mapped by protected apply to separate approval and translation shadow-service runtime credentials. Legacy ingestion remains the production owner."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 1000002
  approval:
    state: automated
    publishing: allowed
    reviewed_by: "codex-merge-docs"
    reviewed_on: "2026-07-29T06:06:14.693Z"
    technical_source_hash: f6b7b4b50ba2e8984a9d17e33e8fc68b58453816c99f099a2340c915c588d062
    automation:
      source_repository: "ramideltoro/nutsnews-backend"
      pull_requests: "442"
      merge_commit: 9060a2573befba6a9d4cb494c05a6fe9b6e307b4
      workflow_run: "30426987154"
---
# Automated NutsNews Backend Merge Log

## Merge entries

### 2026-07-29 — `ramideltoro/nutsnews-backend` [PR #442](https://github.com/ramideltoro/nutsnews-backend/pull/442)

- Merge commit: `9060a2573befba6a9d4cb494c05a6fe9b6e307b4`.
- Summary: reconciles worker-uplift Qwen credential inventory. `LOCAL_AI_API_KEY` is a present, retained `production-backend` source credential, not a missing blocker. Evidence is value-free: no credential value was read, copied, printed, or committed.
- Operator impact: retain the source while its mappings are active; do not store its value in application repositories or workflow artifacts.
- Technical behavior: protected apply maps `LOCAL_AI_API_KEY` to `approval-qwen-api-key` / `NUTSNEWS_APPROVAL_QWEN_API_KEY` for approval and to `translation-qwen-api-key` / `NUTSNEWS_TRANSLATION_QWEN_API_KEY` for translation. `LOCAL_AI_URL` is the non-secret gateway endpoint variable. The `worker_uplift_ai` backend credential group and value-free readiness input are added. Readiness and identity inventories record the source as ready, retained, and mapped. Validation requires every readiness entry to have one disposition and fails closed for an absent source without printing its value.
- Configuration and compatibility: one backend-owned source credential intentionally serves both service-specific runtime credentials. The legacy Cloudflare binding remains independent and retained while legacy ingestion owns production.
- Deployment, migration, security, and rollback boundary: the merge establishes secret-value handling described above, but deployment, migration, rollback, credential rotation, and replacement are not established by this merge. No host, Cloudflare, DNS, failover, legacy Worker-state, or production-write change is documented. Legacy ingestion remains the production owner, worker-uplift remains shadow-only, and production writes remain disabled.
- Future replacement boundary: ready replacements for both mappings, a reviewed deployment change, protected check/apply, and verified service recovery are required before source removal.
