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
    accDescr: "Three release promotions alternate with recorded-digest rollbacks; workflow changes restore rollback runtime configuration and a smoke-helper reference."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 1000003
  approval:
    state: automated
    publishing: allowed
    reviewed_by: "codex-merge-docs"
    reviewed_on: "2026-07-29T06:08:57.922Z"
    technical_source_hash: 7b4cd5b57a9096230ae6263a26d01779cd66ad84f612e1062060a9c9bfec16ee
    automation:
      source_repository: "ramideltoro/nutsnews-infra"
      pull_requests: "428,429,430,431,432,433,434,435,436"
      merge_commit: ee61807a757fe087dbcecd60d5e0b7fe07f4115a
      workflow_run: "30426987154"
---
# Automated NutsNews Infra Merge Log

The canonical Technical source is the authoritative record for this mirror. It records supplied merges to `ramideltoro/nutsnews-infra` on 2026-07-29, not confirmation that a deployment, recovery, or validation completed.

## Operator impact and boundaries

The merged changes repeatedly selected promotion digest `sha256:26ff3c955f0dc2e265ff49deb7bae5db9c5a0241bae34d0d8fb36d43c5aa95ff` and rollback digest `sha256:42f8b2aa36e038f48e6622733defdfa73cc8968b3f3fb9035c38cec9f73d8e68`. Fixed rollback now requires `rollback-recorded-last-known-good`, restores production runtime materialization, sends production configuration sync, and passes a validated current smoke-helper SHA to protected apply.

Deployment completion, migration execution, configuration application, Vercel recovery completion, health-check results, compatibility beyond recorded schema values, security posture, and further rollback procedure are **not established by this merge**.

## Merges (newest first)

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
