---
title: "Automated NutsNews Infra Merge Log"
description: "Source-grounded log of merged NutsNews infrastructure release and rollback changes."
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

This log records supplied merges to `ramideltoro/nutsnews-infra`. It is evidence of merged configuration and workflow changes, not confirmation that a deployment, recovery, or validation completed.

## Operator impact and boundaries

On 2026-07-30, the Cloudflare DNS-failover Worker gained a best-effort `FAILOVER_ANALYTICS` binding for the `nutsnews_dns_failover_v1` Analytics Engine dataset, plus protected, value-free proof of its deployed binding, minute watchdog, and aggregate events. A separate, explicitly confirmed `enable-analytics-engine` workflow mode can request the zero-price account capability and emits a value-free activation proof. The deployment proof now polls both the schedule inventory and aggregate event query for up to 15 minutes before failing closed. Analytics remains non-blocking: health classification, thresholds, alarms, locks, DNS state and actions, the write gate, manual controls, routes, cron, and Durable Object behavior are unchanged by these merges.

Deployment completion, account-capability activation, data ingestion, migration, configuration application, compatibility, security posture, and rollback execution are **not established by this merge**.

## Merges (newest first)

### PR [#455](https://github.com/ramideltoro/nutsnews-infra/pull/455) — 2026-07-30 — `46fc6bf28f4f73b4491049c5118440346ff35d23`

Repository: `ramideltoro/nutsnews-infra`. The protected apply proof now polls the deployed Cron Trigger inventory together with the Analytics Engine aggregate-event query every 15 seconds for up to 900 seconds. It passes only when the minute watchdog `* * * * *` is present and the query has a positive event count; otherwise it fails closed at the deadline. Affected components are the protected DNS-failover apply workflow, `verify_failover_analytics.py`, its proof tests, and the failover runbook. Operators must inspect the uploaded value-free proof rather than treat an early empty schedule sample or workflow conclusion as authoritative. Deployment completion, trigger propagation, analytics ingestion, migration, configuration application, compatibility, security posture, and rollback execution are **not established by this merge**.

### PR [#454](https://github.com/ramideltoro/nutsnews-infra/pull/454) — 2026-07-30 — `7d4e51f2b7ef1d112ae3b0f71367dcbcc903b997`

Repository: `ramideltoro/nutsnews-infra`. The protected Cloudflare DNS-failover workflow now offers an explicitly confirmed `enable-analytics-engine` mode. It requests only the zero-price `beta_analytics_engine_api` subscription, is idempotent when that subscription already exists, verifies an active zero-price result, and uploads a value-free activation proof; the proof omits account, subscription, billing-profile, payment, and secret values. The mode requires its exact confirmation and a billing token scoped for Billing Read and Billing Write, and it does not deploy the Worker, alter bindings, DNS, routes, cron, or Durable Object state. Affected components are the protected workflow, activation script and tests, guardrail validation, and runbook. Account-capability activation, deployment, DNS writes, migration, configuration application, compatibility, security posture, and rollback execution are **not established by this merge**.

### PR [#453](https://github.com/ramideltoro/nutsnews-infra/pull/453) — 2026-07-30 — `f3f4140e0cb5f0c4b8ead5ae729343ad668451e8`

Repository: `ramideltoro/nutsnews-infra`. The DNS-failover Worker declares `FAILOVER_ANALYTICS` on the `nutsnews_dns_failover_v1` dataset and adds a sanitized, best-effort writer for controller check and error events. Analytics failures return unavailable or failed status without changing health classification, thresholds, alarms, locks, DNS state, or DNS actions. Protected apply verifies the deployed analytics and Durable Object bindings, the existing minute cron, and a positive aggregate GraphQL event query, then uploads only value-free evidence. Affected components are the Worker core and entrypoint, worker configuration, protected apply and CI workflows, proof script and tests, guardrail validation, and runbook. Deployment completion, analytics ingestion, DNS writes, migration, configuration application, compatibility, security posture, and rollback execution are **not established by this merge**.

## Earlier merges

On 2026-07-30, production VPS inventory selected the immutable image digest `sha256:509da0d20b278acc383b27ba1af1a59f9468b8108b6b9e4d09d6221cc1ae935d` for source commit `ba8fd07b940d0418436b33c6ccb4d59a76caab4a`, build `30570857159-1`, and configuration generation `production-30570857159-1-20260717113000`. Promotion-check polling now classifies check status separately from GitHub transport failures: documented transient HTTP, timeout, TLS, connection, and EOF errors retry every 10 seconds within the existing one-hour deadline, while failed or cancelled checks and non-transient errors remain immediate failures.

Deployment completion, migration execution, configuration application, Vercel recovery completion, health-check results, compatibility beyond the recorded schema values, security posture, and rollback execution are **not established by this merge**.

### PR [#452](https://github.com/ramideltoro/nutsnews-infra/pull/452) — 2026-07-30 — `48748cd7fea036d14e281fe84fcde5a52d41166c`

Repository: `ramideltoro/nutsnews-infra`. The release-promotion workflow now delegates each `gh pr checks` poll to `ansible/scripts/classify_promotion_checks.py`. Check results remain `passed` only when every bucket is `pass` or `skipping`, `failed` when any bucket is `fail` or `cancel`, and `waiting` for pending, absent, or not-yet-reported checks. Empty-output transport errors matching HTTP 408, 425, 429, or 5xx, timeout, TLS/SSL handshake, connection-reset/refused/closed/aborted, temporary-network, EOF, stream, or HTTP/2 error patterns become `retry`; the workflow logs the error and retries after 10 seconds until its existing one-hour deadline. Invalid check JSON, a non-list response, authentication and other non-transient errors remain fatal. Affected components are the release-promotion workflow, the new classifier, and release-promotion regression coverage. This prevents documented transient GitHub read failures from being treated as failed checks without relaxing actual failed or cancelled checks. Deployment, merge completion beyond the recorded merge, migration, configuration application, compatibility, security outcome, and rollback execution are **not established by this merge**.

### PR [#451](https://github.com/ramideltoro/nutsnews-infra/pull/451) — 2026-07-30 — `81bd2a5305c04bc13b3bbd2fea57e99234985fac`

Repository: `ramideltoro/nutsnews-infra`. Production VPS inventory now selects immutable image digest `sha256:509da0d20b278acc383b27ba1af1a59f9468b8108b6b9e4d09d6221cc1ae935d`, source commit `ba8fd07b940d0418436b33c6ccb4d59a76caab4a`, build `30570857159-1`, and configuration generation `production-30570857159-1-20260717113000`. The recorded migration head remains `20260717113000`, the recorded rollback-compatible schema remains `20260712170000`, and the previous selected digest `sha256:bc79ff2a104d92ea705a025bcb0457c56a0b1fe585d04ff1b0402cf5868324a5` becomes the recorded last-known-good digest. Affected component: production VPS inventory. This updates the reviewed release selection and recorded rollback reference. Deployment or Vercel synchronization, migration execution, configuration application, compatibility beyond the recorded schema value, security outcome, and rollback execution are **not established by this merge**.

### PR [#444](https://github.com/ramideltoro/nutsnews-infra/pull/444) — 2026-07-30 — `eb1810f45c1e0b3b7d1cd30d258ce1b88af9fd8b`

Repository: `ramideltoro/nutsnews-infra`. Protected Ansible Apply now treats the cacheable public `/healthz` deployment target as a bounded set: only `vps` and `production-vps` are accepted. It still requires the exact source commit and build ID, and requires `x-nutsnews-deployment-target` to equal the deployment target in the health response body. Runtime readiness and public configuration remain separate, uncached checks requiring `production-vps`. Affected components are the protected-apply workflow and app/release-promotion regression contracts. This lets operators tolerate only the documented health-cache transition without relaxing source, build, readiness, or runtime-config identity checks. Deployment, cache settlement, migration, configuration application, compatibility, security outcome, and rollback execution are **not established by this merge**.

### PR [#443](https://github.com/ramideltoro/nutsnews-infra/pull/443) — 2026-07-30 — `6811cfa400a069d452fa41499cd7b9098b3e39aa`

Repository: `ramideltoro/nutsnews-infra`. This prior protected-apply change set the expected public `/healthz` identity to the shared image build target `vps`, while keeping runtime readiness and public configuration at `production-vps`; PR #444 subsequently bounded the cache transition to both values. Affected components are the protected-apply workflow, production smoke identity validation, release-promotion regression contract, and protected-apply runbook. The evidence identifies the distinction between static health identity and runtime identity, but deployment, health-check execution, migration, configuration application, compatibility, security outcome, and rollback execution are **not established by this merge**.

### PR [#442](https://github.com/ramideltoro/nutsnews-infra/pull/442) — 2026-07-30 — `c2265d63b09e173344e2a82ca1d9afcbeb9f5f84`

Repository: `ramideltoro/nutsnews-infra`. Production VPS inventory now selects source commit `1ee1d034951ddfe134f2a3caea9ca9341672054f`, immutable image digest `sha256:bc79ff2a104d92ea705a025bcb0457c56a0b1fe585d04ff1b0402cf5868324a5`, build `30536955102-1`, and configuration generation `production-30536955102-1-20260717113000`; its recorded migration head is `20260717113000`, rollback-compatible schema is `20260712170000`, and last-known-good digest is `sha256:26ff3c955f0dc2e265ff49deb7bae5db9c5a0241bae34d0d8fb36d43c5aa95ff`. Affected component: production VPS inventory. This changes the reviewed release selection; deployment completion, migration execution, configuration application, Vercel deployment, compatibility beyond the recorded schema value, security outcome, and rollback execution are **not established by this merge**.

### PR [#441](https://github.com/ramideltoro/nutsnews-infra/pull/441) — 2026-07-30 — `98ff7eeb197f0638628e7870f24636df13c6370a`

Repository: `ramideltoro/nutsnews-infra`. The fixed staging deploy, while holding its existing mutation lock and outside check mode, inspects the retained staging Access directory, Compose file, gateway, and environment file; each must exist with the expected file type, be owned by `root:root`, and have modes `0750`, `0644`, `0755`, and `0600` respectively. It then starts only the existing `nutsnews-staging-access` Compose project using those retained files and waits 30 times with a two-second delay (up to 60 seconds) for `nutsnews-staging-access-verifier` to report running and healthy before live boundary verification. Missing or unsafe retained files, Compose failure, or unhealthy status fail the release closed. The evidence states that no Access secret is copied into the `staging-vps` GitHub Environment; staging-only inventory, check mode, auto-idle behavior, and production isolation are preserved. Affected components are the staging deploy playbook, its deployment regression, and the staging Access runbook. The documented rollback is a revert pull request followed by Protected Ansible Apply, returning to the previous fail-closed behavior while leaving production unchanged; rollback execution, deployment completion, health results, migration, configuration application, compatibility, and broader security posture are **not established by this merge**.

### PR [#436](https://github.com/ramideltoro/nutsnews-infra/pull/436) — 2026-07-29 — `ee61807a757fe087dbcecd60d5e0b7fe07f4115a`

Repository: `ramideltoro/nutsnews-infra`. This promotion changed production VPS inventory to the staging-qualified `a3213068a1f135532f6d097103ea22764f43c580` image digest `sha256:26ff3c955f0dc2e265ff49deb7bae5db9c5a0241bae34d0d8fb36d43c5aa95ff`, build `30394139869-1`, and configuration generation `production-30394139869-1-20260717113000`. The recorded migration head is `20260717113000` and rollback-compatible schema is `20260712170000`. It affects the production VPS inventory. The evidence does not establish deployment completion, migration execution, configuration application, Vercel deployment completion, compatibility beyond that recorded schema value, security changes, or rollback outcome.

### PR [#435](https://github.com/ramideltoro/nutsnews-infra/pull/435) — 2026-07-29 — `aeffb9efa17c0f176100afacfeb092f8ac8f3147`

Repository: `ramideltoro/nutsnews-infra`. The protected rollback workflow resolves the current NutsNews `main` commit through its scoped release-token path, rejects a value that is not a full lowercase 40-character SHA, and passes it as `release_smoke_helper_ref` to protected apply. This affects the rollback dispatcher and rollback/gate-rehearsal regression coverage; it supports older recorded images being checked with current smoke automation. The evidence does not establish that the helper was installed or ran, any deployment result, migration, configuration application, compatibility, security outcome, or a further rollback.

### PR [#434](https://github.com/ramideltoro/nutsnews-infra/pull/434) — 2026-07-29 — `7af77ce5d919edba5194594bfc567482dde32833`

Repository: `ramideltoro/nutsnews-infra`. This recorded rollback changed production VPS inventory from the failed promotion digest to `sha256:42f8b2aa36e038f48e6622733defdfa73cc8968b3f3fb9035c38cec9f73d8e68`, source commit `556687fa156186e3f8a3b4b8a2a653cf344815fd`, build `29957713966-1`, and configuration generation `production-29957713966-1-20260717113000`. The supplied reason cites a Vercel failure for the promoted source commit. It affects the production VPS inventory. Actual rollback execution, runtime recovery, configuration application, migration, compatibility, security outcome, and health validation are not established by this merge.

### PR [#433](https://github.com/ramideltoro/nutsnews-infra/pull/433) — 2026-07-29 — `3e7d4edefb5981be90d8795769d6ceb3395fbe54`

Repository: `ramideltoro/nutsnews-infra`. This again set production VPS inventory to source commit `a3213068a1f135532f6d097103ea22764f43c580`, digest `sha256:26ff3c955f0dc2e265ff49deb7bae5db9c5a0241bae34d0d8fb36d43c5aa95ff`, build `30394139869-1`, and configuration generation `production-30394139869-1-20260717113000`; the recorded migration head is `20260717113000` and schema value is `20260712170000`. It affects production VPS inventory. Deployment, migration, configuration, Vercel completion, compatibility, security, and rollback outcome are not established by this merge.

### PR [#432](https://github.com/ramideltoro/nutsnews-infra/pull/432) — 2026-07-29 — `bfaa08df2023aa486f94e2627878c35dbadc1168`

Repository: `ramideltoro/nutsnews-infra`. Fixed rollback dispatch now sends `sync_vercel_production=true` to protected apply, with regression coverage for that input. This affects the protected rollback workflow and its rollback, gate-rehearsal, and Vercel-sync contracts; the stated purpose is to supply current reviewed production runtime configuration before immutable-image and health validation. Actual configuration sync, deployment, Vercel recovery, migration, compatibility, security result, and rollback result are not established by this merge.

### PR [#431](https://github.com/ramideltoro/nutsnews-infra/pull/431) — 2026-07-29 — `9913f781392a8548ef13f10457048029a5adf203`

Repository: `ramideltoro/nutsnews-infra`. This recorded rollback set production VPS inventory to digest `sha256:42f8b2aa36e038f48e6622733defdfa73cc8968b3f3fb9035c38cec9f73d8e68`, source commit `556687fa156186e3f8a3b4b8a2a653cf344815fd`, build `29957713966-1`, and configuration generation `production-29957713966-1-20260717113000`. The supplied reason cites a Vercel failure for the promoted source commit. It affects production VPS inventory. Rollback execution, runtime recovery, configuration, migration, compatibility, security outcome, and health validation are not established by this merge.

### PR [#430](https://github.com/ramideltoro/nutsnews-infra/pull/430) — 2026-07-29 — `0c687e8d0b2a5eb1411a467535f882c57eb465e9`

Repository: `ramideltoro/nutsnews-infra`. This promotion set production VPS inventory to source commit `a3213068a1f135532f6d097103ea22764f43c580`, digest `sha256:26ff3c955f0dc2e265ff49deb7bae5db9c5a0241bae34d0d8fb36d43c5aa95ff`, build `30394139869-1`, and configuration generation `production-30394139869-1-20260717113000`; the recorded migration head is `20260717113000` and schema value is `20260712170000`. It affects production VPS inventory. Deployment, migration, configuration, Vercel completion, compatibility, security, and rollback outcome are not established by this merge.

### PR [#429](https://github.com/ramideltoro/nutsnews-infra/pull/429) — 2026-07-29 — `a735fe48047ae9b869cc886101d8ac950e5ba518`

Repository: `ramideltoro/nutsnews-infra`. Protected Ansible Apply now includes `production` in `vps_service_foundation_nutsnews_deployment_environments` when either production Vercel sync is enabled or `ROLLBACK_CONFIRMATION` exactly equals `rollback-recorded-last-known-good`; otherwise it remains empty. Regression contracts cover the exact boundary. This affects protected apply, production runtime rendering, and rollback/Vercel-sync validation. It does not establish a render, restart, deployment, migration, configuration application, compatibility, security outcome, or rollback result.

### PR [#428](https://github.com/ramideltoro/nutsnews-infra/pull/428) — 2026-07-29 — `da37adb5eae8603d378903ede91b1095d4df1b83`

Repository: `ramideltoro/nutsnews-infra`. This recorded rollback changed production VPS inventory from the failed promotion image to digest `sha256:42f8b2aa36e038f48e6622733defdfa73cc8968b3f3fb9035c38cec9f73d8e68`, source commit `556687fa156186e3f8a3b4b8a2a653cf344815fd`, build `29957713966-1`, and configuration generation `production-29957713966-1-20260717113000`. It affects production VPS inventory. Rollback execution, runtime recovery, configuration, migration, compatibility, security outcome, and health validation are not established by this merge.
