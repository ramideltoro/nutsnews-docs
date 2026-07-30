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

This is a record of supplied merges to `ramideltoro/nutsnews-infra`. A merged record shows what was changed in infrastructure files and workflows; it does not prove that a deployment, recovery, or check finished successfully.

## What changed for operators

On 2026-07-30, the staging release gained a safe way to restore the existing Access verifier after auto-idle. It checks that the retained files are root-owned and have the expected modes, starts only that existing Compose project, and waits up to 60 seconds for a healthy verifier before boundary checks. The production VPS inventory selected image `sha256:bc79ff2a104d92ea705a025bcb0457c56a0b1fe585d04ff1b0402cf5868324a5`. The public `/healthz` check now allows only `vps` or `production-vps` while a cache changes, and its header must match its response body; separate readiness and runtime configuration checks still require `production-vps`.

Whether deployment, migration, configuration sync, Vercel recovery, health checks, compatibility beyond the recorded schema values, security, or rollback execution actually happened is **not established by this merge**.

## Merges (newest first)

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
