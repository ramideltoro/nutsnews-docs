---
title: "Automated NutsNews Backend Merge Log (Technical)"
description: "Technical records of merged backend changes."
wiki:
  source_route: "/technical/updates/automated-nutsnews-backend-merge-log"
  simple_route: "/simple/updates/automated-nutsnews-backend-merge-log"
  slug: "updates/automated-nutsnews-backend-merge-log"
  primary_diagram:
    file: "diagrams/updates/AUTOMATED_NUTSNEWS_BACKEND_MERGE_LOG.mmd"
    accTitle: "Backend credential readiness paths after pull request 443"
    accDescr: "Routine readiness reads production-backend secret-name and variable metadata without an Environment gate, while a separate manual audit remains behind the production-backend approval gate for injected-value and shape checks."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 1000002
  approval:
    state: automated
    publishing: allowed
    reviewed_by: "codex-merge-docs"
    reviewed_on: "2026-07-29T11:26:30.163Z"
    technical_source_hash: 12b26c9de1264608a02dae97db6586a33c0a818695a1d5e2441c60274147afa7
    automation:
      source_repository: "ramideltoro/nutsnews-backend"
      pull_requests: "443"
      merge_commit: f5dea5b3255471d571ba6875fa9412db7346100b
      workflow_run: "30447354125"
---
# Automated NutsNews Backend Merge Log

## Merge entries

### 2026-07-29 — `ramideltoro/nutsnews-backend` [PR #443](https://github.com/ramideltoro/nutsnews-backend/pull/443)

- Merge commit: `f5dea5b3255471d571ba6875fa9412db7346100b`.
- Summary: `Backend Credential Readiness` becomes approval-free by validating `production-backend` credential metadata instead of injecting protected values. A manual `Backend Protected Value Audit` is added for protected injected-value and shape checks.
- Operator impact: routine readiness can run without an Environment reviewer gate. After credential rotation, run the approval-gated protected-value audit for value and shape checks. Routine readiness does not expose a secret value.
- Technical behavior and affected components: readiness no longer declares `production-backend`; it uses the existing repository-level maintenance token to query GitHub Environment secret names and non-secret variables and passes the responses to `check_backend_credential_readiness.py`. Metadata mode fails closed for missing required secret names, validates non-secret variables, and defers secret value and shape checks to protected consumers. The manual audit declares `production-backend` and performs the injected-value audit. The credential runbook, worker-uplift operation map, readiness checker, and tests changed with these workflows.
- Configuration, compatibility, security, deployment, migration, and rollback: the `production-backend` required-reviewer rule is unchanged, and deployment, apply, recovery, cutover, restart, DNS, and failover workflows retain their existing protection. No production secret value was read, printed, copied, or committed. A deployment, migration, compatibility change, configuration steps beyond the workflow behavior above, and a rollback procedure are not established by this merge.

### 2026-07-29 — `ramideltoro/nutsnews-backend` [PR #442](https://github.com/ramideltoro/nutsnews-backend/pull/442)

- Merge commit: `9060a2573befba6a9d4cb494c05a6fe9b6e307b4`.
- Summary: reconciles worker-uplift Qwen credential inventory. `LOCAL_AI_API_KEY` is a present, retained `production-backend` source credential, not a missing blocker. Evidence is value-free: no credential value was read, copied, printed, or committed.
- Operator impact: retain the source while its mappings are active; do not store its value in application repositories or workflow artifacts.
- Technical behavior: protected apply maps `LOCAL_AI_API_KEY` to `approval-qwen-api-key` / `NUTSNEWS_APPROVAL_QWEN_API_KEY` for approval and to `translation-qwen-api-key` / `NUTSNEWS_TRANSLATION_QWEN_API_KEY` for translation. `LOCAL_AI_URL` is the non-secret gateway endpoint variable. The `worker_uplift_ai` backend credential group and value-free readiness input are added. Readiness and identity inventories record the source as ready, retained, and mapped. Validation requires every readiness entry to have one disposition and fails closed for an absent source without printing its value.
- Configuration and compatibility: one backend-owned source credential intentionally serves both service-specific runtime credentials. The legacy Cloudflare binding remains independent and retained while legacy ingestion owns production.
- Deployment, migration, security, and rollback boundary: the merge establishes secret-value handling described above, but deployment, migration, rollback, credential rotation, and replacement are not established by this merge. No host, Cloudflare, DNS, failover, legacy Worker-state, or production-write change is documented. Legacy ingestion remains the production owner, worker-uplift remains shadow-only, and production writes remain disabled.
- Future replacement boundary: ready replacements for both mappings, a reviewed deployment change, protected check/apply, and verified service recovery are required before source removal.
