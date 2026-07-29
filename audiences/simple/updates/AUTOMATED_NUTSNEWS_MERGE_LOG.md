---
title: "Automated NutsNews Merge Log (Simple)"
description: "Automated record of merged NutsNews product changes."
wiki:
  source_route: "/technical/updates/automated-nutsnews-merge-log"
  simple_route: "/simple/updates/automated-nutsnews-merge-log"
  slug: "updates/automated-nutsnews-merge-log"
  primary_diagram:
    file: "diagrams/updates/AUTOMATED_NUTSNEWS_MERGE_LOG.mmd"
    accTitle: "Privacy selection and responsive navigation flow"
    accDescr: "Readers choose an Android or iOS privacy policy at the privacy selector. On narrow screens, a top-left menu provides the public navigation links; the desktop footer keeps those links."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 1000001
  approval:
    state: automated
    publishing: allowed
    reviewed_by: "codex-merge-docs"
    reviewed_on: "2026-07-29T20:39:48.176Z"
    technical_source_hash: 722af9fb732cc44a7541972d3a469f78cdc76063777be15b85d6b48ddb7c1829
    automation:
      source_repository: "ramideltoro/nutsnews"
      pull_requests: "539"
      merge_commit: 75890e1107d8b3cb709f5c7ac363ce91917a5281
      workflow_run: "30489054881"
---
# Automated NutsNews Merge Log

This log records already-merged changes from supplied merge evidence. Approval metadata is automated and does not claim human review.

## Merge entries

### 2026-07-29 — ramideltoro/nutsnews [PR #539](https://github.com/ramideltoro/nutsnews/pull/539) — merge commit `75890e1107d8b3cb709f5c7ac363ce91917a5281`

PR #539 makes `/privacy` a page where readers choose a platform policy. The existing localized website/iOS policy moved to `/privacy/ios`; the supplied evidence describes its wording as unchanged. The selector has Android and iOS cards. The Android card goes to `https://www.nutsnews.com/privacy/android`, and the iOS card goes to `/privacy/ios`. The sitemap and route checks include `/privacy`, `/privacy/android`, and `/privacy/ios`.

On screens below the existing 720px breakpoint, Apps, Saved, About, Contact, and Privacy move from the footer to a fixed top-left menu. On desktop screens, those links stay in the footer and the mobile menu is hidden.

The menu reports whether it is open and connects its button to its navigation panel. Escape closes it and puts focus back on the button. Clicking outside closes it, and choosing a link closes it. The merge also covers keyboard navigation. The menu respects top and left safe areas, and its panel can scroll if it is too tall for the viewport.

This merge establishes only public pages and interface behavior. It does not establish a deployment result or procedure, migration, configuration requirement, compatibility promise beyond these routes and responsive behavior, security-policy change, changed secrets or access policy, new external dependency, or rollback procedure.

### 2026-07-29 — ramideltoro/nutsnews [PR #538](https://github.com/ramideltoro/nutsnews/pull/538) — merge commit `d339f40a6c29b41d18d5d977575274345c73941b`

PR #538 lets the temporary staging-evidence checker use the admin-backend operation contract from the exact checked-out app source: `${{ github.workspace }}/api-contracts/admin-backend-operations.json`. The workflow supplies it with `NUTSNEWS_ADMIN_BACKEND_OPERATION_CONTRACT`; otherwise the checker uses its default path.

This lets the temporary checker validate the approved app’s contract rather than look for a nearby relative file. The supplied evidence says the qualified report checks 13 required operations.

This merge only establishes behavior for the production-release staging-evidence step. It does not establish a migration, configuration outside that workflow variable, compatibility promise, security change, or rollback procedure.

### 2026-07-29 — ramideltoro/nutsnews [PR #537](https://github.com/ramideltoro/nutsnews/pull/537) — merge commit `5efea9cfc65bf77ed72bc310fc91f9cd73281304`

PR #537 makes the checker read only `qualification-evidence/app/staging-qualification.json` from the qualification artifact. If that exact file is missing, the check fails instead of using a same-named wrapper or another matching file.

This means production promotion checks the qualified admin-backend smoke report, not a wrapper with the same filename. The supplied evidence says artifact name, run, deployment, source, archive, and sensitive-field safeguards remain enforced.

This merge does not establish a deployment procedure, migration, new configuration, compatibility commitment, security change, or rollback procedure beyond that file-selection and failure behavior.

### 2026-07-29 — ramideltoro/nutsnews [PR #536](https://github.com/ramideltoro/nutsnews/pull/536) — merge commit `7c4df32b262377a73cff31fd56f1d03427e3b768`

PR #536 copies two reviewed helpers from the workflow commit to `RUNNER_TEMP`: `scripts/dual_target_web_smoke.mjs` and `scripts/staging_qualification_admin_backend_evidence.mjs`. It syntax-checks both and runs the evidence checker from temporary storage after checking out the exact app source. Regression coverage rejects running that checker from the app’s `scripts/` directory.

For operators, the workflow keeps the exact app checkout but uses the current reviewed checker instead of an older checker in that checkout. The supplied evidence says artifact identity, source ancestry, freshness, environment, archive, and sanitized-evidence checks remain unchanged.

This merge does not establish a migration, compatibility commitment, security change, rollback procedure, or deployment result beyond the documented workflow behavior.

## Combined safety boundary

PR #539 establishes the documented privacy pages and responsive menu. PRs #536–#538 establish the documented staging-evidence checks. The supplied evidence does not establish successful production deployment, changed secret values or access policy, a new external dependency, or an operator rollback command.
