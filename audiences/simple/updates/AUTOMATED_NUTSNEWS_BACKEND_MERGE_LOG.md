---
title: "Automated NutsNews Backend Merge Log (Simple)"
description: "Plain-language records of merged backend changes."
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

## What this is

This is a record of already-merged backend changes. It says what the merge proves and what it does not prove.

## 2026-07-29 — `ramideltoro/nutsnews-backend` [PR #442](https://github.com/ramideltoro/nutsnews-backend/pull/442)

- Merge commit: `9060a2573befba6a9d4cb494c05a6fe9b6e307b4`.
- The merge confirms that `LOCAL_AI_API_KEY` is present in the protected `production-backend` environment. Its value was not read, copied, printed, or committed.
- Protected apply uses that one source credential to give the approval shadow service `approval-qwen-api-key` / `NUTSNEWS_APPROVAL_QWEN_API_KEY` and the translation shadow service `translation-qwen-api-key` / `NUTSNEWS_TRANSLATION_QWEN_API_KEY`. `LOCAL_AI_URL` is the non-secret gateway endpoint setting.
- The source credential must stay in place while these mappings are active. Its value must not go into application repositories or workflow artifacts. If it is absent, readiness checking fails without printing the value.
- The current setup deliberately shares one backend-owned source credential between the two service-specific runtime credentials. The separate legacy Cloudflare binding remains while legacy ingestion owns production.
- Deployment, migration, rollback, credential rotation, and replacement are not established by this merge. There is no documented host, Cloudflare, DNS, failover, legacy Worker-state, or production-write change. Legacy ingestion remains the production owner, worker-uplift remains shadow-only, and production writes remain disabled.

## If the credential is replaced later

The merge requires ready replacements for both services, a reviewed deployment change, protected check/apply, and verified service recovery before the current source credential is removed.
