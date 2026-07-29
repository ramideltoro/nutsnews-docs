---
title: "Automated NutsNews Infra Merge Log"
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

This log records the supplied merges to `ramideltoro/nutsnews-infra` on 2026-07-29. It is evidence of merged configuration and workflow changes, not confirmation that a deployment, recovery, or validation completed.

## Operator impact and boundaries

The merged changes repeatedly selected the immutable NutsNews image `sha256:26ff3c955f0dc2e265ff49deb7bae5db9c5a0241bae34d0d8fb36d43c5aa95ff` for production VPS promotion and `sha256:42f8b2aa36e038f48e6622733defdfa73cc8968b3f3fb9035c38cec9f73d8e68` for recorded rollback. Fixed rollback eligibility now requires the exact confirmation `rollback-recorded-last-known-good`; it restores production runtime materialization and sends production configuration sync. It also passes a validated current smoke-helper SHA to protected apply.

Deployment completion, migration execution, configuration application, Vercel recovery completion, health-check results, compatibility beyond the recorded schema values, security posture, and a further rollback procedure are **not established by this merge**.

## Merges (newest first)

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
