---
title: "Automated NutsNews Backend Merge Log (Simple)"
description: "Plain-language records of merged backend changes."
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

## What this is

This is a record of already-merged backend changes. It says what the merge proves and what it does not prove.

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
