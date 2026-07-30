---
title: "Automated NutsNews Backend Merge Log (Simple)"
description: "Plain-language records of merged backend changes."
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

## What this is

This is a record of already-merged backend changes. It says what the merge proves and what it does not prove.

## 2026-07-30 — `ramideltoro/nutsnews-backend` [PR #445](https://github.com/ramideltoro/nutsnews-backend/pull/445)

- Merge commit: `a3e88aadcc1aef0880569192c90b9f444e21ed56`.
- This merge records a clear NO-GO for starting guarded cutover-control work under worker issue #125. It adds a readiness decision record, evidence, a checker, tests, and checks in `Backend Checks`.
- Do not use the successful runtime checks as permission to cut over. Issue #125 stays open and has no named authorized approver. It does not allow cutover, production writes, or a change in who owns ingestion. A future #125 GO could start only #150; the order remains #125 → #150 → #126 → #166 → #127.
- The recorded protected and approval-free `status` runs both show shadow mode, `production_writes_enabled=false`, eight healthy services, seven queues with one consumer each, and no ready or unacknowledged messages.
- The blockers are: missing `FAILOVER_ANALYTICS` proof or decision (#157); current parity (#158); empty-broker recovery (#159); identity inventory repair (#160); PostgreSQL/API/Qwen outage drills (#161); backup and restore proof (#162); authenticated admin proof (#163); named security-risk decisions (#164); planned cutover details and owners (#165); scheduler/current-time readiness proof (#168); and a named #125 approver after those technical blockers. Building #150 or #126 is not itself a #125 blocker.
- No cutover, production-write enablement, legacy-worker or ingestion-owner change, DNS, failover, Cloudflare, infrastructure, environment-protection, or production-data change is established. No risk waiver, deployment, migration, compatibility change, or rollback procedure is established by this merge.

## 2026-07-30 — `ramideltoro/nutsnews-backend` [PR #446](https://github.com/ramideltoro/nutsnews-backend/pull/446)

- Merge commit: `ba26e7bb9fa7a4f30773216da1e69bfe7ec3bf0d`.
- This merge separates safe, read-only worker-runtime checks from protected actions.
- `check`, `status`, `logs`, `queue-inspect`, and `dlq-inspect` can now collect evidence without creating a `production-backend` pending deployment. They must use `dry_run=true` and reject confirmation and replica inputs.
- `deploy`, `promote`, `restart`, `scale`, `rollback`, `dlq-replay`, `drain`, `reconciliation`, and `smoke` stay in the protected `production-backend` route. They require the exact confirmation `backend.nutsnews.com` and use `--confirm-action`.
- Both routes check the allowed action and inputs, use strict SSH host-key checks, cannot run an arbitrary remote command, and save a `backend-worker-runtime-report`. The reviewer rule is unchanged, and the merge records no secret values.
- This changes workflow behavior and CI checks only. A mutating action, cutover, production-write enablement, ingestion-owner or legacy-ingestion change, DNS/failover or infrastructure change, migration, compatibility change, or rollback procedure is not established by this merge.

## 2026-07-29 — `ramideltoro/nutsnews-backend` [PR #444](https://github.com/ramideltoro/nutsnews-backend/pull/444)

- Merge commit: `b619cf91504eafca21f70c5d68888563f5fca7a9`.
- The merge finishes a non-mutating security review for worker uplift and makes backend workflows safer. Workflow inputs from dispatches, repositories, and events are first put into quoted step environment variables before a shell command uses them.
- `Backend Checks` now runs checks for safe GitHub Actions workflow handling, the worker-uplift security review, and the review tests. Live protected checks still wait for `production-backend` owner approval; this merge does not bypass that gate.
- The workflow security check requires fixed (immutable) action references and rejects direct dispatch, repository, or event expressions inside shell blocks. The review check covers repository, supply-chain, credential, network, RabbitMQ, PostgreSQL, backend API, AI, telemetry, and operations evidence. It allows no unresolved critical or high finding. One high finding is recorded as fixed; eight remaining, bounded risks are accepted only for shadow operation until `ramideltoro/nutsnews-worker#125`.
- Legacy worker ingestion remains the production owner. Worker uplift remains shadow-only and `production_writes_enabled=false` remains unchanged. No secret values are recorded.
- This merge changes workflow source and CI checks. A deployment, host, legacy-ingestion, Cloudflare, DNS, failover, cutover, production-write, migration, or compatibility-state change is not established by this merge. If the hardening causes a workflow regression, the recorded recovery is to revert this review commit through a pull request and rerun `Backend Checks`; no host rollback or writer-state change is established.

## 2026-07-29 — `ramideltoro/nutsnews-backend` [PR #443](https://github.com/ramideltoro/nutsnews-backend/pull/443)

- Merge commit: `f5dea5b3255471d571ba6875fa9412db7346100b`.
- Routine `Backend Credential Readiness` no longer needs approval. It checks the names of secrets and non-secret settings in `production-backend`; it does not receive protected secret values.
- Operators can run routine readiness without waiting for an Environment reviewer. After rotating a credential, use the manual `Backend Protected Value Audit` to check injected values and their shapes. That audit still requires `production-backend` approval.
- The readiness workflow uses the existing repository-level maintenance token to read GitHub Environment metadata, then gives it to `check_backend_credential_readiness.py`. It fails when a required secret name is missing, checks non-secret settings, and leaves secret value and shape checks to protected consumers. The new audit workflow, credential runbook, worker-uplift operation map, readiness checker, and tests were updated.
- The `production-backend` required-reviewer rule is unchanged. Deployment, apply, recovery, cutover, restart, DNS, and failover workflows keep their existing protection. No production secret value was read, printed, copied, or committed.
- A deployment, migration, compatibility change, configuration steps beyond the workflow behavior above, and a rollback procedure are not established by this merge.

## 2026-07-29 — `ramideltoro/nutsnews-backend` [PR #442](https://github.com/ramideltoro/nutsnews-backend/pull/442)

- Merge commit: `9060a2573befba6a9d4cb494c05a6fe9b6e307b4`.
- The merge confirms that `LOCAL_AI_API_KEY` is present in the protected `production-backend` environment. Its value was not read, copied, printed, or committed.
- Protected apply uses that one source credential to give the approval shadow service `approval-qwen-api-key` / `NUTSNEWS_APPROVAL_QWEN_API_KEY` and the translation shadow service `translation-qwen-api-key` / `NUTSNEWS_TRANSLATION_QWEN_API_KEY`. `LOCAL_AI_URL` is the non-secret gateway endpoint setting.
- The source credential must stay in place while these mappings are active. Its value must not go into application repositories or workflow artifacts. If it is absent, readiness checking fails without printing the value.
- The current setup deliberately shares one backend-owned source credential between the two service-specific runtime credentials. The separate legacy Cloudflare binding remains while legacy ingestion owns production.
- Deployment, migration, rollback, credential rotation, and replacement are not established by this merge. There is no documented host, Cloudflare, DNS, failover, legacy Worker-state, or production-write change. Legacy ingestion remains the production owner, worker-uplift remains shadow-only, and production writes remain disabled.

## If the credential is replaced later

The merge requires ready replacements for both services, a reviewed deployment change, protected check/apply, and verified service recovery before the current source credential is removed.
