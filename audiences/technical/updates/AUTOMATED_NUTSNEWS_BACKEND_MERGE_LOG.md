---
title: "Automated NutsNews Backend Merge Log (Technical)"
description: "Technical records of merged backend changes."
wiki:
  source_route: "/technical/updates/automated-nutsnews-backend-merge-log"
  simple_route: "/simple/updates/automated-nutsnews-backend-merge-log"
  slug: "updates/automated-nutsnews-backend-merge-log"
  primary_diagram:
    file: "diagrams/updates/AUTOMATED_NUTSNEWS_BACKEND_MERGE_LOG.mmd"
    accTitle: "Worker-uplift security controls after pull request 444"
    accDescr: "Pull request 444 moves workflow inputs through step environment variables before shell use, adds automated security-review checks, and retains shadow-only worker-uplift operation with production writes disabled."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 1000002
  approval:
    state: automated
    publishing: allowed
    reviewed_by: "codex-merge-docs"
    reviewed_on: "2026-07-29T19:39:55.371Z"
    technical_source_hash: a11b4beabe89bcd36f6b621567ab5ca31419a28255c6cf76e487c6fd0d85f759
    automation:
      source_repository: "ramideltoro/nutsnews-backend"
      pull_requests: "444"
      merge_commit: b619cf91504eafca21f70c5d68888563f5fca7a9
      workflow_run: "30485228434"
---
# Automated NutsNews Backend Merge Log

## Merge entries

### 2026-07-29 — `ramideltoro/nutsnews-backend` [PR #444](https://github.com/ramideltoro/nutsnews-backend/pull/444)

- Merge commit: `b619cf91504eafca21f70c5d68888563f5fca7a9`.
- Summary: completes a source-controlled, non-mutating worker-uplift security review and hardens backend GitHub Actions workflows against shell-template injection. Dispatch, repository, and event-derived workflow data now enter shell steps through quoted step environment variables instead of direct expressions in generated shell programs.
- Operator impact: `Backend Checks` now runs GitHub Actions security validation, worker-uplift security-review validation, and the review tests. Protected live checks remain subject to the `production-backend` owner approval gate; this merge does not bypass it.
- Technical behavior and affected components: changed backend database, PostgreSQL, cutover, Supabase, and worker-uplift workflows use environment indirection for relevant inputs and add strict shell handling where shown. `validate_backend_github_actions_security.py` requires immutable action references and rejects direct dispatch, repository, or event expressions in shell blocks. `validate_worker_uplift_security_review.py` validates repository, supply-chain, credential, network, RabbitMQ, PostgreSQL, backend API, AI, telemetry, and operations evidence; it requires no unresolved critical or high finding, while accepted residual risks are shadow-only and expire at `ramideltoro/nutsnews-worker#125`.
- Security boundary: one high finding is recorded as remediated and eight bounded residual risks are accepted only for shadow operation. Legacy worker ingestion remains the production owner, worker-uplift remains shadow-only, and `production_writes_enabled=false` remains unchanged. No secret values are recorded.
- Deployment, migration, configuration, compatibility, and rollback: workflow source and CI checks change. A deployment, host, legacy-ingestion, Cloudflare, DNS, failover, cutover, production-write, migration, or compatibility-state change is not established by this merge. The recorded workflow-regression recovery is to revert this review commit through a pull request and rerun `Backend Checks`; no host rollback or writer-state change is established.

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
