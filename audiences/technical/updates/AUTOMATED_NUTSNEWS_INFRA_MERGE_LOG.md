---
title: "Automated NutsNews Infra Merge Log (Technical)"
description: "Source-grounded log of merged NutsNews infrastructure release and rollback changes."
wiki:
  source_route: "/technical/updates/automated-nutsnews-infra-merge-log"
  simple_route: "/simple/updates/automated-nutsnews-infra-merge-log"
  slug: "updates/automated-nutsnews-infra-merge-log"
  primary_diagram:
    file: "diagrams/updates/AUTOMATED_NUTSNEWS_INFRA_MERGE_LOG.mmd"
    accTitle: "NutsNews infrastructure merge sequence"
    accDescr: "Four new merges restore an auto-idled staging Access verifier, select a production image, and bound public VPS health identity during a cache transition."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 1000003
  approval:
    state: automated
    publishing: allowed
    reviewed_by: "codex-merge-docs"
    reviewed_on: "2026-07-30T12:54:25.871Z"
    technical_source_hash: 0df376113227d86a5f4a8db08dc404af54c0d100f523cb0ed784404f929b9b60
    automation:
      source_repository: "ramideltoro/nutsnews-infra"
      pull_requests: "441,442,443,444"
      merge_commit: eb1810f45c1e0b3b7d1cd30d258ce1b88af9fd8b
      workflow_run: "30544170238"
---
# Automated NutsNews Infra Merge Log

The canonical Technical source is the authoritative record for this mirror. It records supplied merges to `ramideltoro/nutsnews-infra`, not confirmation that a deployment, recovery, or validation completed.

## Operator impact and boundaries

On 2026-07-30, the staging deploy playbook gained a fail-closed recovery for the retained, auto-idled staging Access verifier: it checks root ownership and exact reviewed modes for retained files, starts only the existing Access Compose project, and waits up to 60 seconds for `nutsnews-staging-access-verifier` to be running and healthy before live boundary verification. The production VPS inventory was changed to image `sha256:bc79ff2a104d92ea705a025bcb0457c56a0b1fe585d04ff1b0402cf5868324a5`. The protected post-apply public `/healthz` check now accepts only `vps` or `production-vps` during the documented cache transition, while requiring its deployment-target header to equal the body value; separate readiness and runtime configuration checks remain strict for `production-vps`.

Deployment completion, migration execution, configuration application, Vercel recovery completion, health-check results, compatibility beyond recorded schema values, security posture, and rollback execution are **not established by this merge**.

## Merges (newest first)

### PR [#444](https://github.com/ramideltoro/nutsnews-infra/pull/444) — 2026-07-30 — `eb1810f45c1e0b3b7d1cd30d258ce1b88af9fd8b`
Repository: `ramideltoro/nutsnews-infra`. Protected Ansible Apply now treats the cacheable public `/healthz` deployment target as a bounded set: only `vps` and `production-vps` are accepted. It still requires the exact source commit and build ID, and requires `x-nutsnews-deployment-target` to equal the deployment target in the health response body. Runtime readiness and public configuration remain separate, uncached checks requiring `production-vps`. Affected components are the protected-apply workflow and app/release-promotion regression contracts. This lets operators tolerate only the documented health-cache transition without relaxing source, build, readiness, or runtime-config identity checks. Deployment, cache settlement, migration, configuration application, compatibility, security outcome, and rollback execution are **not established by this merge**.

### PR [#443](https://github.com/ramideltoro/nutsnews-infra/pull/443) — 2026-07-30 — `6811cfa400a069d452fa41499cd7b9098b3e39aa`
Repository: `ramideltoro/nutsnews-infra`. This prior protected-apply change set the expected public `/healthz` identity to the shared image build target `vps`, while keeping runtime readiness and public configuration at `production-vps`; PR #444 subsequently bounded the cache transition to both values. Affected components are the protected-apply workflow, production smoke identity validation, release-promotion regression contract, and protected-apply runbook. The evidence identifies the distinction between static health identity and runtime identity, but deployment, health-check execution, migration, configuration application, compatibility, security outcome, and rollback execution are **not established by this merge**.

### PR [#442](https://github.com/ramideltoro/nutsnews-infra/pull/442) — 2026-07-30 — `c2265d63b09e173344e2a82ca1d9afcbeb9f5f84`
Repository: `ramideltoro/nutsnews-infra`. Production VPS inventory now selects source commit `1ee1d034951ddfe134f2a3caea9ca9341672054f`, immutable image digest `sha256:bc79ff2a104d92ea705a025bcb0457c56a0b1fe585d04ff1b0402cf5868324a5`, build `30536955102-1`, and configuration generation `production-30536955102-1-20260717113000`; its recorded migration head is `20260717113000`, rollback-compatible schema is `20260712170000`, and last-known-good digest is `sha256:26ff3c955f0dc2e265ff49deb7bae5db9c5a0241bae34d0d8fb36d43c5aa95ff`. Affected component: production VPS inventory. This changes the reviewed release selection; deployment completion, migration execution, configuration application, Vercel deployment, compatibility beyond the recorded schema value, security outcome, and rollback execution are **not established by this merge**.

### PR [#441](https://github.com/ramideltoro/nutsnews-infra/pull/441) — 2026-07-30 — `98ff7eeb197f0638628e7870f24636df13c6370a`
Repository: `ramideltoro/nutsnews-infra`. The fixed staging deploy, while holding its existing mutation lock and outside check mode, inspects the retained staging Access directory, Compose file, gateway, and environment file; each must exist with the expected file type, be owned by `root:root`, and have modes `0750`, `0644`, `0755`, and `0600` respectively. It then starts only the existing `nutsnews-staging-access` Compose project using those retained files and waits 30 times with a two-second delay (up to 60 seconds) for `nutsnews-staging-access-verifier` to report running and healthy before live boundary verification. Missing or unsafe retained files, Compose failure, or unhealthy status fail the release closed. The evidence states that no Access secret is copied into the `staging-vps` GitHub Environment; staging-only inventory, check mode, auto-idle behavior, and production isolation are preserved. Affected components are the staging deploy playbook, its deployment regression, and the staging Access runbook. The documented rollback is a revert pull request followed by Protected Ansible Apply, returning to the previous fail-closed behavior while leaving production unchanged; rollback execution, deployment completion, health results, migration, configuration application, compatibility, and broader security posture are **not established by this merge**.

### PR [#436](https://github.com/ramideltoro/nutsnews-infra/pull/436) — 2026-07-29 — `ee61807a757fe087dbcecd60d5e0b7fe07f4115a`
Repository: `ramideltoro/nutsnews-infra`. Promotion inventory: source `a3213068a1f135532f6d097103ea22764f43c580`; digest `sha256:26ff3c955f0dc2e265ff49deb7bae5db9c5a0241bae34d0d8fb36d43c5aa95ff`; build `30394139869-1`; generation `production-30394139869-1-20260717113000`; migration head `20260717113000`; schema `20260712170000`. Affected component: production VPS inventory. Deployment, migration, configuration, Vercel completion, compatibility, security, and rollback outcome are not established by this merge.

### PR [#435](https://github.com/ramideltoro/nutsnews-infra/pull/435) — 2026-07-29 — `aeffb9efa17c0f176100afacfeb092f8ac8f3147`
Repository: `ramideltoro/nutsnews-infra`. The rollback workflow resolves the current NutsNews `main` SHA through its scoped release-token path, requires a full lowercase 40-character SHA, and passes `release_smoke_helper_ref` to protected apply. Affected components: rollback dispatcher and rollback/gate-rehearsal contracts; this supports current smoke automation for older recorded images. Helper execution, deployment, migration, configuration, compatibility, security outcome, and further rollback are not established by this merge.

### PR [#434](https://github.com/ramideltoro/nutsnews-infra/pull/434) — 2026-07-29 — `7af77ce5d919edba5194594bfc567482dde32833`
Repository: `ramideltoro/nutsnews-infra`. Rollback inventory: digest `sha256:42f8b2aa36e038f48e6622733defdfa73cc8968b3f3fb9035c38cec9f73d8e68`; source `556687fa156186e3f8a3b4b8a2a653cf344815fd`; build `29957713966-1`; generation `production-29957713966-1-20260717113000`. The supplied reason cites Vercel failure for the promoted source. Affected component: production VPS inventory. Execution, recovery, configuration, migration, compatibility, security, and health validation are not established by this merge.

### PR [#433](https://github.com/ramideltoro/nutsnews-infra/pull/433) — 2026-07-29 — `3e7d4edefb5981be90d8795769d6ceb3395fbe54`
Repository: `ramideltoro/nutsnews-infra`. Promotion inventory: source `a3213068a1f135532f6d097103ea22764f43c580`; digest `sha256:26ff3c955f0dc2e265ff49deb7bae5db9c5a0241bae34d0d8fb36d43c5aa95ff`; build `30394139869-1`; generation `production-30394139869-1-20260717113000`; migration head `20260717113000`; schema `20260712170000`. Affected component: production VPS inventory. Deployment, migration, configuration, Vercel completion, compatibility, security, and rollback outcome are not established by this merge.

### PR [#432](https://github.com/ramideltoro/nutsnews-infra/pull/432) — 2026-07-29 — `bfaa08df2023aa486f94e2627878c35dbadc1168`
Repository: `ramideltoro/nutsnews-infra`. Fixed rollback now sends `sync_vercel_production=true` to protected apply; rollback, gate-rehearsal, and Vercel-sync contracts cover that input. Affected component: protected rollback workflow; stated purpose: current reviewed production runtime configuration before immutable-image and health validation. Sync, deployment, Vercel recovery, migration, compatibility, security, and rollback result are not established by this merge.

### PR [#431](https://github.com/ramideltoro/nutsnews-infra/pull/431) — 2026-07-29 — `9913f781392a8548ef13f10457048029a5adf203`
Repository: `ramideltoro/nutsnews-infra`. Rollback inventory: digest `sha256:42f8b2aa36e038f48e6622733defdfa73cc8968b3f3fb9035c38cec9f73d8e68`; source `556687fa156186e3f8a3b4b8a2a653cf344815fd`; build `29957713966-1`; generation `production-29957713966-1-20260717113000`. The supplied reason cites Vercel failure for the promoted source. Affected component: production VPS inventory. Execution, recovery, configuration, migration, compatibility, security, and health validation are not established by this merge.

### PR [#430](https://github.com/ramideltoro/nutsnews-infra/pull/430) — 2026-07-29 — `0c687e8d0b2a5eb1411a467535f882c57eb465e9`
Repository: `ramideltoro/nutsnews-infra`. Promotion inventory: source `a3213068a1f135532f6d097103ea22764f43c580`; digest `sha256:26ff3c955f0dc2e265ff49deb7bae5db9c5a0241bae34d0d8fb36d43c5aa95ff`; build `30394139869-1`; generation `production-30394139869-1-20260717113000`; migration head `20260717113000`; schema `20260712170000`. Affected component: production VPS inventory. Deployment, migration, configuration, Vercel completion, compatibility, security, and rollback outcome are not established by this merge.

### PR [#429](https://github.com/ramideltoro/nutsnews-infra/pull/429) — 2026-07-29 — `a735fe48047ae9b869cc886101d8ac950e5ba518`
Repository: `ramideltoro/nutsnews-infra`. Protected apply includes `production` in `vps_service_foundation_nutsnews_deployment_environments` when Vercel production sync is enabled or `ROLLBACK_CONFIRMATION` exactly equals `rollback-recorded-last-known-good`; otherwise it is empty. Regression contracts cover the boundary. Affected components: protected apply, production runtime rendering, rollback/Vercel-sync validation. Render, restart, deployment, migration, configuration, compatibility, security, and rollback result are not established by this merge.

### PR [#428](https://github.com/ramideltoro/nutsnews-infra/pull/428) — 2026-07-29 — `da37adb5eae8603d378903ede91b1095d4df1b83`
Repository: `ramideltoro/nutsnews-infra`. Rollback inventory: digest `sha256:42f8b2aa36e038f48e6622733defdfa73cc8968b3f3fb9035c38cec9f73d8e68`; source `556687fa156186e3f8a3b4b8a2a653cf344815fd`; build `29957713966-1`; generation `production-29957713966-1-20260717113000`. Affected component: production VPS inventory. Execution, recovery, configuration, migration, compatibility, security, and health validation are not established by this merge.
