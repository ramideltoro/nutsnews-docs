---
title: "Automated NutsNews Merge Log"
description: "Merge record for reviewed staging-evidence helpers used by the Vercel production-release workflow."
wiki:
  source_route: "/technical/updates/automated-nutsnews-merge-log"
  simple_route: "/simple/updates/automated-nutsnews-merge-log"
  slug: "updates/automated-nutsnews-merge-log"
  primary_diagram:
    file: "diagrams/updates/AUTOMATED_NUTSNEWS_MERGE_LOG.mmd"
    accTitle: "Reviewed staging-evidence verification flow"
    accDescr: "The Vercel production-release workflow exports the reviewed verifier to temporary storage, supplies the checked-out app contract path, and verifies the canonical qualified report before staging a production candidate."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 229
  approval:
    state: automated
    publishing: allowed
    reviewed_by: "codex-merge-docs"
    reviewed_on: "2026-07-29T05:44:15.162Z"
    technical_source_hash: ac6748ae61d15d54007f90eba17bf4be3aa5e3dfce9cbe2e54d63563e2c71ede
    automation:
      source_repository: "ramideltoro/nutsnews"
      pull_requests: "536,537,538"
      merge_commit: d339f40a6c29b41d18d5d977575274345c73941b
      workflow_run: "30425862591"
---
# Automated NutsNews Merge Log

This log records the already-merged changes to the staging qualification evidence check that precedes Vercel production-candidate staging. Approval remains unreviewed; this record does not claim human review.

## Merge entries

### 2026-07-29 — ramideltoro/nutsnews [PR #538](https://github.com/ramideltoro/nutsnews/pull/538) — merge commit `d339f40a6c29b41d18d5d977575274345c73941b`

PR #538 binds the reviewed staging-evidence verifier, which runs from `RUNNER_TEMP`, to the admin-backend operation contract in the exact checked-out application source: `${{ github.workspace }}/api-contracts/admin-backend-operations.json`. The workflow provides that path through `NUTSNEWS_ADMIN_BACKEND_OPERATION_CONTRACT`; the verifier accepts the environment value and otherwise uses its default contract path.

For release operators, the temporary reviewed helper can validate the approved application’s operation contract instead of resolving a relative path from temporary storage. The workflow regression coverage requires both the workflow binding and verifier support. The supplied evidence says the qualified report validates 13 required operations.

Deployment behavior established by this merge is limited to the production-release workflow’s staging-evidence step. No migration, configuration outside that workflow environment variable, compatibility promise, security change, or rollback procedure is established by this merge.

### 2026-07-29 — ramideltoro/nutsnews [PR #537](https://github.com/ramideltoro/nutsnews/pull/537) — merge commit `5efea9cfc65bf77ed72bc310fc91f9cd73281304`

PR #537 makes the staging-evidence verifier select only `qualification-evidence/app/staging-qualification.json` from the qualification artifact. It fails closed when that exact archive entry is absent, rather than selecting a same-named top-level wrapper or another basename match.

For release operators, production promotion checks the qualified admin-backend smoke report rather than an attestation wrapper with the same filename. Regression coverage requires canonical-path selection and absence handling. The supplied evidence states that artifact name, run identity, deployment identity, source identity, archive path, and sensitive-field safeguards remain enforced.

No deployment procedure, migration, new configuration, compatibility commitment, security change, or rollback procedure is established by this merge beyond the verifier’s archive-entry selection and failure behavior.

### 2026-07-29 — ramideltoro/nutsnews [PR #536](https://github.com/ramideltoro/nutsnews/pull/536) — merge commit `7c4df32b262377a73cff31fd56f1d03427e3b768`

PR #536 changes the Vercel production-release workflow to export two reviewed helpers from the workflow commit to `RUNNER_TEMP`: `scripts/dual_target_web_smoke.mjs` and `scripts/staging_qualification_admin_backend_evidence.mjs`. The workflow syntax-checks both temporary files and runs the staging-evidence verifier from `RUNNER_TEMP` after its exact application-source checkout. Regression coverage rejects execution of that verifier from `scripts/` in the checked-out application source.

For release operators, the production-promotion path keeps the exact application-source checkout while using the reviewed current verifier rather than the obsolete verifier present in that checkout. The supplied evidence states that artifact identity, source ancestry, freshness, environment, archive, and sanitized-evidence checks remain unchanged.

This merge establishes no migration, compatibility commitment, security change, or rollback procedure. It does not establish deployment results outside the documented workflow behavior.

## Combined safety boundary

Together, these changes affect the Vercel production-release staging-evidence verification path: the reviewed verifier is exported to temporary storage, receives the exact checked-out operation-contract path, and reads the canonical qualified report. The supplied evidence does not establish production deployment success, a change to secret values or access policy, a new external dependency, or an operator rollback command.
