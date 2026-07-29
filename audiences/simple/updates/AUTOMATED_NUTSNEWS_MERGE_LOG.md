---
title: "Automated NutsNews Merge Log (Simple)"
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
  order: 1000001
  approval:
    state: automated
    publishing: allowed
    reviewed_by: "codex-merge-docs"
    reviewed_on: "2026-07-29T05:44:15.162Z"
    technical_source_hash: 6b3808c3abac20968c73c27126eaf719dc84cc2303bb0b5a11e42a039182275b
    automation:
      source_repository: "ramideltoro/nutsnews"
      pull_requests: "536,537,538"
      merge_commit: d339f40a6c29b41d18d5d977575274345c73941b
      workflow_run: "30425862591"
---
# Automated NutsNews Merge Log

This log records merged changes to the check that runs before a Vercel production candidate is staged. It is unreviewed and does not claim human review.

## Merge entries

### 2026-07-29 — ramideltoro/nutsnews [PR #538](https://github.com/ramideltoro/nutsnews/pull/538) — merge commit `d339f40a6c29b41d18d5d977575274345c73941b`

The reviewed evidence checker runs from `RUNNER_TEMP`. PR #538 gives it the admin-backend operation contract from the exact checked-out app source: `${{ github.workspace }}/api-contracts/admin-backend-operations.json`, using `NUTSNEWS_ADMIN_BACKEND_OPERATION_CONTRACT`. The checker uses that supplied path or its normal default path.

This lets the temporary checker validate the approved app’s operation contract rather than look for a relative file beside itself. Regression coverage requires both parts. The supplied evidence says the qualified report checks 13 required operations.

This merge only establishes behavior for the production-release staging-evidence step. It does not establish a migration, configuration outside that workflow variable, compatibility promise, security change, or rollback procedure.

### 2026-07-29 — ramideltoro/nutsnews [PR #537](https://github.com/ramideltoro/nutsnews/pull/537) — merge commit `5efea9cfc65bf77ed72bc310fc91f9cd73281304`

PR #537 makes the checker read only `qualification-evidence/app/staging-qualification.json` in the qualification artifact. If that exact file is missing, the check fails instead of using a same-named wrapper or another file with the same ending.

This means production promotion checks the qualified admin-backend smoke report, not an attestation wrapper with the same name. Regression coverage checks this choice and the missing-file failure. The supplied evidence says artifact name, run, deployment, source, archive, and sensitive-field safeguards remain enforced.

This merge does not establish a deployment procedure, migration, new configuration, compatibility commitment, security change, or rollback procedure beyond that file-selection and failure behavior.

### 2026-07-29 — ramideltoro/nutsnews [PR #536](https://github.com/ramideltoro/nutsnews/pull/536) — merge commit `7c4df32b262377a73cff31fd56f1d03427e3b768`

PR #536 copies two reviewed helpers from the workflow commit to `RUNNER_TEMP`: `scripts/dual_target_web_smoke.mjs` and `scripts/staging_qualification_admin_backend_evidence.mjs`. It syntax-checks both and runs the evidence checker from temporary storage after checking out the exact app source. Regression coverage rejects running that checker from the app’s `scripts/` directory.

For operators, the workflow keeps the exact app checkout but uses the current reviewed checker instead of an older checker in that checkout. The supplied evidence says artifact identity, source ancestry, freshness, environment, archive, and sanitized-evidence checks remain unchanged.

This merge does not establish a migration, compatibility commitment, security change, rollback procedure, or deployment result beyond the documented workflow behavior.

## Combined safety boundary

Together, these changes make the production-release staging-evidence path use a reviewed temporary checker, the checked-out app contract, and the canonical qualified report. The supplied evidence does not establish production deployment success, changed secret values or access policy, a new external dependency, or an operator rollback command.
