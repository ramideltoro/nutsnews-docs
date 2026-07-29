---
title: "Automated NutsNews Infra Merge Log (Simple)"
description: "Plain-language log of merged NutsNews infrastructure release and rollback changes."
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

This is a record of nine merges to `ramideltoro/nutsnews-infra` on 2026-07-29. A merged record shows what was changed in infrastructure files and workflows; it does not prove that a deployment, recovery, or check finished successfully.

## What changed for operators

The release records selected image `sha256:26ff3c955f0dc2e265ff49deb7bae5db9c5a0241bae34d0d8fb36d43c5aa95ff`; the recorded rollback records selected `sha256:42f8b2aa36e038f48e6622733defdfa73cc8968b3f3fb9035c38cec9f73d8e68`. A fixed rollback needs the exact confirmation `rollback-recorded-last-known-good`. It now restores the production runtime selection, asks protected apply to sync production configuration, and supplies a checked current smoke-helper commit reference.

Whether deployment, migration, configuration sync, Vercel recovery, health checks, compatibility beyond the recorded schema values, security, or another rollback actually happened is **not established by this merge**.

## Merges (newest first)

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
