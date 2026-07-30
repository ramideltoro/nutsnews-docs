---
title: "Automated NutsNews Backend Merge Log (Technical)"
description: "Technical records of merged backend changes."
wiki:
  source_route: "/technical/updates/automated-nutsnews-backend-merge-log"
  simple_route: "/simple/updates/automated-nutsnews-backend-merge-log"
  slug: "updates/automated-nutsnews-backend-merge-log"
  primary_diagram:
    file: "diagrams/updates/AUTOMATED_NUTSNEWS_BACKEND_MERGE_LOG.mmd"
    accTitle: "Worker-uplift runtime evidence and readiness decision after pull requests 445 and 446"
    accDescr: "Pull request 446 separates approval-free read-only runtime evidence from protected actions. Pull request 445 records a NO-GO decision, current blockers, and unchanged shadow-only production boundaries."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 1000002
  approval:
    state: automated
    publishing: allowed
    reviewed_by: "codex-merge-docs"
    reviewed_on: "2026-07-30T20:08:33.963Z"
    technical_source_hash: e636c59f9c472e738c68e8e012e44f841c0892f7ff3a1ea4d0e73cad1c2aa3c1
    automation:
      source_repository: "ramideltoro/nutsnews-backend"
      pull_requests: "446,445"
      merge_commit: a3e88aadcc1aef0880569192c90b9f444e21ed56
      workflow_run: "30577386413"
---
# Automated NutsNews Backend Merge Log

## Merge entries

### 2026-07-30 — `ramideltoro/nutsnews-backend` [PR #445](https://github.com/ramideltoro/nutsnews-backend/pull/445)

- Merge commit: `a3e88aadcc1aef0880569192c90b9f444e21ed56`.
- Summary: records an explicit NO-GO for beginning guarded cutover-control implementation under worker tracking issue #125. It adds the production-readiness decision runbook, machine-readable evidence, validator, tests, and `Backend Checks` coverage.
- Operator impact: do not treat successful runtime evidence as cutover authorization. Issue #125 remains open, has no named authorized approver, and authorizes neither cutover, production writes, nor an ingestion-owner change. A later #125 GO could begin only #150; the ordered path remains #125 → #150 → #126 → #166 → #127.
- Technical behavior and affected components: the readiness evidence incorporates protected `status` run `30513933114` and approval-free read-only status run `30573044860`. Both report shadow mode, `production_writes_enabled=false`, eight healthy services, seven required queues with one consumer each, and zero ready or unacknowledged messages. The decision validator and 18 focused tests enforce the recorded readiness boundary.
- Current blockers: #157 needs a `FAILOVER_ANALYTICS` disposition or proof; #158 current-candidate parity; #159 current-topology empty-broker recovery; #160 runtime-identity inventory reconciliation; #161 current PostgreSQL/API/Qwen outage drills; #162 backup and isolated restore evidence; #163 authenticated production-admin evidence; #164 named dispositions for SEC-124-002 through SEC-124-009; #165 planned watermark, rollback deadline, observation window, thresholds, and owners; #168 scheduler adapter and current-time readiness proof; and a named authorized #125 approver after technical blockers resolve. Missing implementation of #150 and #126 is explicitly not a #125 blocker.
- Deployment, migration, configuration, compatibility, security, and rollback: no cutover, production-write enablement, legacy-worker change, ingestion-owner change, DNS, failover, Cloudflare, production-infrastructure, environment-protection, or production-data change is established by this merge. No risk waiver or approver decision is established. A deployment, migration, compatibility change, or rollback procedure is not established by this merge.

### 2026-07-30 — `ramideltoro/nutsnews-backend` [PR #446](https://github.com/ramideltoro/nutsnews-backend/pull/446)

- Merge commit: `ba26e7bb9fa7a4f30773216da1e69bfe7ec3bf0d`.
- Summary: separates worker-runtime dispatch validation, approval-free read-only evidence, and protected runtime operations. It adds workflow-boundary validation and focused regression tests.
- Operator impact: `check`, `status`, `logs`, `queue-inspect`, and `dlq-inspect` can produce read-only evidence without creating a `production-backend` pending deployment. Protected actions remain approval-gated and require the exact typed confirmation `backend.nutsnews.com`.
- Technical behavior and affected components: `validate-dispatch` runs without an Environment reference. `read-only-runtime` accepts only the five read-only actions, requires `dry_run=true`, rejects `confirm_target` and replica input, has no GitHub Environment reference, and always invokes the fixed remote operation with `--dry-run`. `protected-runtime` accepts only `deploy`, `promote`, `restart`, `scale`, `rollback`, `dlq-replay`, `drain`, `reconciliation`, and `smoke`; it declares `production-backend` and always passes `--confirm-action`. Both paths validate bounded tail and queue-kind inputs, use strict SSH host-key checking, do not accept a free-form remote command, and upload `backend-worker-runtime-report`.
- Security and configuration boundary: the environment reviewer rule remains unchanged. Read-only and protected routes are mutually exclusive; a protected action cannot enter the read-only job and vice versa. The merge records secret names and security controls, not secret values.
- Deployment, migration, compatibility, and rollback: this merge changes workflow behavior and CI validation. A mutating action, cutover, uplift production-write enablement, ingestion-owner change, legacy-ingestion modification, DNS/failover change, production-infrastructure change, migration, compatibility change, or rollback procedure is not established by this merge.

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
