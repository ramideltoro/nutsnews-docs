---
title: "Automated NutsNews Backend Merge Log (Simple)"
description: "Plain-language records of merged backend changes."
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

## What this is

This is a record of already-merged backend changes. It says what the merge proves and what it does not prove.

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
