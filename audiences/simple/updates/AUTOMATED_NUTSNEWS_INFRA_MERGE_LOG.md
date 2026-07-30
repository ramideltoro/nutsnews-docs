---
title: "Automated NutsNews Infra Merge Log (Simple)"
description: "Plain-language log of merged NutsNews infrastructure release and rollback changes."
wiki:
  source_route: "/technical/updates/automated-nutsnews-infra-merge-log"
  simple_route: "/simple/updates/automated-nutsnews-infra-merge-log"
  slug: "updates/automated-nutsnews-infra-merge-log"
  primary_diagram:
    file: "diagrams/updates/AUTOMATED_NUTSNEWS_INFRA_MERGE_LOG.mmd"
    accTitle: "NutsNews infrastructure merge updates"
    accDescr: "Three July 30 failover-analytics merges add best-effort telemetry, guarded account activation, and bounded deployment-proof polling. Operational outcomes are not established by the merges."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 1000003
  approval:
    state: automated
    publishing: allowed
    reviewed_by: "codex-merge-docs"
    reviewed_on: "2026-07-30T22:34:27.748Z"
    technical_source_hash: 4b1683f99f205ed7e4b99b3e9a7d001b7e66ccadb3f16d5bb422e21739477739
    automation:
      source_repository: "ramideltoro/nutsnews-infra"
      pull_requests: "453,454,455"
      merge_commit: 46fc6bf28f4f73b4491049c5118440346ff35d23
      workflow_run: "30587476848"
---
# Automated NutsNews Infra Merge Log

This is a record of supplied merges to `ramideltoro/nutsnews-infra`. A merged record shows what was changed in infrastructure files and workflows; it does not prove that a deployment, recovery, or check finished successfully.

## What changed for operators

On 2026-07-30, the Cloudflare DNS-failover Worker received a best-effort `FAILOVER_ANALYTICS` link to the `nutsnews_dns_failover_v1` Analytics Engine dataset. The protected workflow can produce a value-free proof of the deployed analytics link, minute watchdog, and aggregate events. It also has a separately confirmed `enable-analytics-engine` mode that can request the zero-price account capability and saves a value-free activation proof. The deployment proof now checks both the schedule and the event query for up to 15 minutes before failing closed. Analytics cannot change health decisions, thresholds, alarms, locks, DNS state or actions, the write gate, manual controls, routes, cron, or Durable Object behavior.

Whether deployment, account activation, data ingestion, migration, configuration, compatibility, security, or rollback execution actually happened is **not established by this merge**.

## Merges (newest first)

### PR [#455](https://github.com/ramideltoro/nutsnews-infra/pull/455) — 2026-07-30 — `46fc6bf28f4f73b4491049c5118440346ff35d23`

Repository: `ramideltoro/nutsnews-infra`. The protected proof checks the deployed Cron Trigger and Analytics Engine aggregate events every 15 seconds for up to 900 seconds. It passes only when the `* * * * *` watchdog is present and the event count is positive; otherwise it fails closed at the deadline. This affects the protected apply workflow, analytics-proof script and tests, and runbook. Operators should inspect the uploaded value-free proof, not treat an early empty schedule result or workflow conclusion as final. Deployment, trigger propagation, analytics ingestion, migration, configuration, compatibility, security, and rollback execution are **not established by this merge**.

### PR [#454](https://github.com/ramideltoro/nutsnews-infra/pull/454) — 2026-07-30 — `7d4e51f2b7ef1d112ae3b0f71367dcbcc903b997`

Repository: `ramideltoro/nutsnews-infra`. The protected workflow now has an explicitly confirmed `enable-analytics-engine` mode. It requests only the zero-price `beta_analytics_engine_api` subscription, does nothing new if that subscription already exists, checks for an active zero-price result, and uploads a value-free proof that omits account, subscription, billing, payment, and secret values. It needs the exact confirmation and a Billing Read and Billing Write token. It does not deploy the Worker or change bindings, DNS, routes, cron, or Durable Object state. This affects the workflow, activation script and tests, guardrails, and runbook. Account activation, deployment, DNS writes, migration, configuration, compatibility, security, and rollback execution are **not established by this merge**.

### PR [#453](https://github.com/ramideltoro/nutsnews-infra/pull/453) — 2026-07-30 — `f3f4140e0cb5f0c4b8ead5ae729343ad668451e8`

Repository: `ramideltoro/nutsnews-infra`. The DNS-failover Worker now declares `FAILOVER_ANALYTICS` for `nutsnews_dns_failover_v1` and writes sanitized controller check and error events on a best-effort basis. If analytics is unavailable or fails, it reports that status without changing health decisions, thresholds, alarms, locks, DNS state, or DNS actions. Protected apply checks the deployed analytics and Durable Object links, existing minute cron, and a positive aggregate event query, then uploads value-free evidence. This affects Worker code and configuration, protected apply and CI, proof scripts and tests, validation, and the runbook. Deployment, analytics ingestion, DNS writes, migration, configuration, compatibility, security, and rollback execution are **not established by this merge**.

## Earlier merges

On 2026-07-30, production VPS inventory selected immutable image `sha256:509da0d20b278acc383b27ba1af1a59f9468b8108b6b9e4d09d6221cc1ae935d` for source commit `ba8fd07b940d0418436b33c6ccb4d59a76caab4a`, build `30570857159-1`, and configuration generation `production-30570857159-1-20260717113000`. Promotion-check polling now separates check results from GitHub connection problems: documented temporary HTTP, timeout, TLS, connection, and EOF errors retry every 10 seconds within the existing one-hour deadline, but failed or cancelled checks and non-temporary errors still fail immediately.

Whether deployment, migration, configuration sync, Vercel recovery, health checks, compatibility beyond the recorded schema values, security, or rollback execution actually happened is **not established by this merge**.

### PR [#452](https://github.com/ramideltoro/nutsnews-infra/pull/452) — 2026-07-30 — `48748cd7fea036d14e281fe84fcde5a52d41166c`

Repository: `ramideltoro/nutsnews-infra`. The release-promotion workflow now uses `ansible/scripts/classify_promotion_checks.py` for every `gh pr checks` poll. Checks pass only when every result is `pass` or `skipping`; any `fail` or `cancel` result still fails, while pending, absent, or not-yet-reported checks wait. With no check output, documented temporary HTTP 408, 425, 429, or 5xx errors; timeouts; TLS/SSL handshake failures; connection reset/refused/closed/aborted errors; temporary-network errors; EOF; stream errors; and HTTP/2 errors are retried. The workflow logs the error and retries after 10 seconds until its existing one-hour deadline. Bad check JSON, a response that is not a list, authentication failures, and other non-temporary errors remain fatal. This affects the release-promotion workflow, the new classifier, and its regression checks. It prevents known temporary GitHub read failures from looking like failed checks without weakening real failed or cancelled checks. Deployment, merge completion beyond the recorded merge, migration, configuration application, compatibility, security outcome, and rollback execution are **not established by this merge**.

### PR [#451](https://github.com/ramideltoro/nutsnews-infra/pull/451) — 2026-07-30 — `81bd2a5305c04bc13b3bbd2fea57e99234985fac`

Repository: `ramideltoro/nutsnews-infra`. Production VPS inventory now selects immutable image `sha256:509da0d20b278acc383b27ba1af1a59f9468b8108b6b9e4d09d6221cc1ae935d`, source commit `ba8fd07b940d0418436b33c6ccb4d59a76caab4a`, build `30570857159-1`, and configuration generation `production-30570857159-1-20260717113000`. The recorded migration head remains `20260717113000`; the recorded rollback-compatible schema remains `20260712170000`; and the previous selected image `sha256:bc79ff2a104d92ea705a025bcb0457c56a0b1fe585d04ff1b0402cf5868324a5` is now the recorded last-known-good image. This affects production VPS inventory by updating the reviewed release selection and recorded rollback reference. Deployment or Vercel synchronization, migration execution, configuration application, compatibility beyond the recorded schema value, security outcome, and rollback execution are **not established by this merge**.

### PR [#444](https://github.com/ramideltoro/nutsnews-infra/pull/444) — 2026-07-30 — `eb1810f45c1e0b3b7d1cd30d258ce1b88af9fd8b`
Repository: `ramideltoro/nutsnews-infra`. The protected release check accepts only `vps` and `production-vps` from cacheable public `/healthz`. It still checks the exact source commit and build ID, and the health header must equal the target in the response body. Readiness and public configuration are uncached checks that still require `production-vps`. This affects the protected-apply workflow and app/release-promotion checks, allowing only the documented cache transition without weakening identity checks. Deployment, cache settlement, migration, configuration, compatibility, security, and rollback execution are **not established by this merge**.

### PR [#443](https://github.com/ramideltoro/nutsnews-infra/pull/443) — 2026-07-30 — `6811cfa400a069d452fa41499cd7b9098b3e39aa`
Repository: `ramideltoro/nutsnews-infra`. This earlier change expected `vps` from public `/healthz`, the shared image build target, but kept readiness and public configuration at `production-vps`; PR #444 then bounded the transition to both values. It affects protected apply, production smoke identity checks, release-promotion checks, and the runbook. Deployment, health-check execution, migration, configuration, compatibility, security, and rollback execution are **not established by this merge**.

### PR [#442](https://github.com/ramideltoro/nutsnews-infra/pull/442) — 2026-07-30 — `c2265d63b09e173344e2a82ca1d9afcbeb9f5f84`
Repository: `ramideltoro/nutsnews-infra`. Production VPS inventory now selects source `1ee1d034951ddfe134f2a3caea9ca9341672054f`, image `sha256:bc79ff2a104d92ea705a025bcb0457c56a0b1fe585d04ff1b0402cf5868324a5`, build `30536955102-1`, and generation `production-30536955102-1-20260717113000`; recorded migration head: `20260717113000`, rollback-compatible schema: `20260712170000`, last-known-good image: `sha256:26ff3c955f0dc2e265ff49deb7bae5db9c5a0241bae34d0d8fb36d43c5aa95ff`. It affects production VPS inventory. Deployment, migration, configuration, Vercel deployment, compatibility beyond the recorded schema value, security, and rollback execution are **not established by this merge**.

### PR [#441](https://github.com/ramideltoro/nutsnews-infra/pull/441) — 2026-07-30 — `98ff7eeb197f0638628e7870f24636df13c6370a`
Repository: `ramideltoro/nutsnews-infra`. While holding the staging change lock and outside check mode, the staging deploy checks the retained Access directory, Compose file, gateway, and environment file. They must have the right type, be `root:root`, and have modes `0750`, `0644`, `0755`, and `0600`. It then starts only the retained `nutsnews-staging-access` project and waits up to 60 seconds for `nutsnews-staging-access-verifier` to be running and healthy before boundary checks. Missing or unsafe files, a Compose failure, or an unhealthy verifier stop the release safely. No Access secret is copied into the `staging-vps` GitHub Environment; staging-only inventory, check mode, auto-idle, and production isolation stay unchanged. This affects the staging deploy playbook, regression check, and runbook. The documented rollback is a revert pull request followed by Protected Ansible Apply, returning to the earlier fail-closed behavior while leaving production unchanged; rollback execution, deployment, health results, migration, configuration, compatibility, and broader security posture are **not established by this merge**.

### PR [#436](https://github.com/ramideltoro/nutsnews-infra/pull/436) — 2026-07-29 — `ee61807a757fe087dbcecd60d5e0b7fe07f4115a`
Repository: `ramideltoro/nutsnews-infra`. This promotion set production VPS inventory to source `a3213068a1f135532f6d097103ea22764f43c580`, image `sha256:26ff3c955f0dc2e265ff49deb7bae5db9c5a0241bae34d0d8fb36d43c5aa95ff`, build `30394139869-1`, and generation `production-30394139869-1-20260717113000`; recorded migration head: `20260717113000`, schema: `20260712170000`. It affects production VPS inventory. Deployment, migration, configuration, Vercel completion, compatibility, security, and rollback outcome are not established by this merge.

### PR [#435](https://github.com/ramideltoro/nutsnews-infra/pull/435) — 2026-07-29 — `aeffb9efa17c0f176100afacfeb092f8ac8f3147`
Repository: `ramideltoro/nutsnews-infra`. The rollback workflow finds the current NutsNews `main` commit through its scoped release-token path, accepts only a full lowercase 40-character SHA, and sends it as `release_smoke_helper_ref` to protected apply. It affects the rollback dispatcher and its regression checks, helping older recorded images use current smoke automation. Running the helper, deployment, migration, configuration, compatibility, security outcome, and another rollback are not established by this merge.

### PR [#434](https://github.com/ramideltoro/nutsnews-infra/pull/434) — 2026-07-29 — `7af77ce5d919edba5194594bfc567482dde32833`
Repository: `ramideltoro/nutsnews-infra`. This rollback set production VPS inventory to image `sha256:42f8b2aa36e038f48e6622733defdfa73cc8968b3f3fb9035c38cec9f73d8e68`, source `556687fa156186e3f8a3b4b8a2a653cf344815fd`, build `29957713966-1`, and generation `production-29957713966-1-20260717113000`. The supplied reason cites Vercel failure for the promoted source. It affects production VPS inventory. Execution, recovery, configuration, migration, compatibility, security, and health checks are not established by this merge.

### PR [#433](https://github.com/ramideltoro/nutsnews-infra/pull/433) — 2026-07-29 — `3e7d4edefb5981be90d8795769d6ceb3395fbe54`
Repository: `ramideltoro/nutsnews-infra`. This promotion set production VPS inventory to source `a3213068a1f135532f6d097103ea22764f43c580`, image `sha256:26ff3c955f0dc2e265ff49deb7bae5db9c5a0241bae34d0d8fb36d43c5aa95ff`, build `30394139869-1`, and generation `production-30394139869-1-20260717113000`; recorded migration head: `20260717113000`, schema: `20260712170000`. It affects production VPS inventory. Deployment, migration, configuration, Vercel completion, compatibility, security, and rollback outcome are not established by this merge.

### PR [#432](https://github.com/ramideltoro/nutsnews-infra/pull/432) — 2026-07-29 — `bfaa08df2023aa486f94e2627878c35dbadc1168`
Repository: `ramideltoro/nutsnews-infra`. A fixed rollback now sends `sync_vercel_production=true` to protected apply, and checks cover that input. It affects the protected rollback workflow; its stated purpose is to provide reviewed production runtime configuration before image and health checks. Sync, deployment, Vercel recovery, migration, compatibility, security, and rollback result are not established by this merge.

### PR [#431](https://github.com/ramideltoro/nutsnews-infra/pull/431) — 2026-07-29 — `9913f781392a8548ef13f10457048029a5adf203`
Repository: `ramideltoro/nutsnews-infra`. This rollback set production VPS inventory to image `sha256:42f8b2aa36e038f48e6622733defdfa73cc8968b3f3fb9035c38cec9f73d8e68`, source `556687fa156186e3f8a3b4b8a2a653cf344815fd`, build `29957713966-1`, and generation `production-29957713966-1-20260717113000`. The supplied reason cites Vercel failure for the promoted source. It affects production VPS inventory. Execution, recovery, configuration, migration, compatibility, security, and health checks are not established by this merge.

### PR [#430](https://github.com/ramideltoro/nutsnews-infra/pull/430) — 2026-07-29 — `0c687e8d0b2a5eb1411a467535f882c57eb465e9`
Repository: `ramideltoro/nutsnews-infra`. This promotion set production VPS inventory to source `a3213068a1f135532f6d097103ea22764f43c580`, image `sha256:26ff3c955f0dc2e265ff49deb7bae5db9c5a0241bae34d0d8fb36d43c5aa95ff`, build `30394139869-1`, and generation `production-30394139869-1-20260717113000`; recorded migration head: `20260717113000`, schema: `20260712170000`. It affects production VPS inventory. Deployment, migration, configuration, Vercel completion, compatibility, security, and rollback outcome are not established by this merge.

### PR [#429](https://github.com/ramideltoro/nutsnews-infra/pull/429) — 2026-07-29 — `a735fe48047ae9b869cc886101d8ac950e5ba518`
Repository: `ramideltoro/nutsnews-infra`. Protected apply selects `production` in `vps_service_foundation_nutsnews_deployment_environments` when Vercel production sync is enabled or `ROLLBACK_CONFIRMATION` is exactly `rollback-recorded-last-known-good`; otherwise it selects no production environment. Checks cover this boundary. It affects protected apply, production runtime rendering, and rollback/Vercel-sync validation. Rendering, restart, deployment, migration, configuration, compatibility, security, and rollback result are not established by this merge.

### PR [#428](https://github.com/ramideltoro/nutsnews-infra/pull/428) — 2026-07-29 — `da37adb5eae8603d378903ede91b1095d4df1b83`
Repository: `ramideltoro/nutsnews-infra`. This rollback set production VPS inventory to image `sha256:42f8b2aa36e038f48e6622733defdfa73cc8968b3f3fb9035c38cec9f73d8e68`, source `556687fa156186e3f8a3b4b8a2a653cf344815fd`, build `29957713966-1`, and generation `production-29957713966-1-20260717113000`. It affects production VPS inventory. Execution, recovery, configuration, migration, compatibility, security, and health checks are not established by this merge.
