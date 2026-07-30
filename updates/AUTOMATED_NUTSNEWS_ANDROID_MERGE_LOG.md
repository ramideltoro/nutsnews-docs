---
title: "Automated NutsNews Android Merge Log"
description: "Merge record for Android feed controls and Play closed-testing promotion changes."
wiki:
  source_route: "/technical/updates/automated-nutsnews-android-merge-log"
  simple_route: "/simple/updates/automated-nutsnews-android-merge-log"
  slug: "updates/automated-nutsnews-android-merge-log"
  primary_diagram:
    file: "diagrams/updates/AUTOMATED_NUTSNEWS_ANDROID_MERGE_LOG.mmd"
    accTitle: "Read Story shape and guarded Alpha promotion after merges 141 and 142"
    accDescr: "PR 141 applies the standard rounded control shape to Read Story. PR 142 verifies an Internal version, then promotes it to Alpha only after an exact review-replacement acknowledgement and verifies Alpha afterward."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 1000004
  approval:
    state: automated
    publishing: allowed
    reviewed_by: "codex-merge-docs"
    reviewed_on: "2026-07-30T06:49:36.365Z"
    technical_source_hash: 80d9a61a3f26ce67786227f0107f8f64e6cee75b315979bae9eb22746ffac798
    automation:
      source_repository: "ramideltoro/nutsnews-android"
      pull_requests: "141,142"
      merge_commit: 2ce2ee0aec3d64079b41764c6430413e1498bb16
      workflow_run: "30520576038"
---
# Automated NutsNews Android Merge Log

This log records merged Android changes. It is an unreviewed draft; approval metadata remains present and does not claim human review.

## Merge entries

### 2026-07-30 — [PR #142](https://github.com/ramideltoro/nutsnews-android/pull/142): Add guarded Play Alpha promotion

- **Repository:** `ramideltoro/nutsnews-android`
- **Merge commit:** `2ce2ee0aec3d64079b41764c6430413e1498bb16`
- **Affected components:** `.github/workflows/play-closed-promotion.yml`, `config/play/closed-testing.json`, `scripts/promote-play-closed.sh`, its validator and contract test, Android CI validation, and release-operations documentation.
- **Behavior:** A manually dispatched workflow on `main` accepts a version name, numeric version code, English (United States) release notes, and the exact `REPLACE_ALPHA_REVIEW` acknowledgement. It runs in `play-internal`, verifies the requested deterministic version is present on the Internal track, queries Alpha, and either reports `already-present` or requires a version code greater than Alpha's current maximum. It assigns the verified Internal bundle to `alpha` as a completed rollout, commits with `CANCEL_IN_REVIEW_AND_SUBMIT`, then queries Alpha again for the requested version. The workflow allows only one promotion at a time and does not cancel an in-progress workflow.
- **Reader and operator impact:** Replacing an Alpha release that is already in Play review is an explicit, auditable action rather than an implicit edit behavior. The acknowledgement is required before the workflow can replace and resubmit the review; a version already on Alpha does not create a new submission.
- **Safety boundary:** The workflow uses the `play-internal` environment and the Play service-account secret, creates restricted temporary credential files, and has no signing or production access. It does not upload or sign an artifact; the bundle must already be verified on Internal. The supplied evidence establishes no deployment outside this workflow, migration, compatibility guarantee, successful Play promotion, or rollback procedure. Those facts are not established by this merge.

### 2026-07-30 — [PR #141](https://github.com/ramideltoro/nutsnews-android/pull/141): Use a standard Read Story button shape

- **Repository:** `ramideltoro/nutsnews-android`
- **Merge commit:** `fc6d4d8dfeb8a6d310c7a379bc01e405d90f5ffc`
- **Affected components:** the home-feed `ReadStoryButton` in `ArticleCard.kt` and `ArticleCardTest.kt`.
- **Behavior:** Read Story now derives one `RoundedCornerShape` from `NutsNewsTheme.dimensions.controlCornerRadius` and uses it for shadow, clipping, and border. The regression test creates the shape at 120 by 48 and verifies a 16 dp corner radius that is less than half the control height, preventing capsule geometry.
- **Reader and operator impact:** The home-feed Read Story control has the standard rounded-rectangle outline instead of a circle-derived capsule on text-width buttons. Its gradient, glow animation, border behavior, button accessibility role, and 48 dp minimum touch target remain in place.
- **Safety boundary:** No deployment, migration, configuration, compatibility, security, or rollback facts are established by this merge.

### 2026-07-29 — [PR #140](https://github.com/ramideltoro/nutsnews-android/pull/140): Use Play automatic review submission

- **Repository:** `ramideltoro/nutsnews-android`
- **Merge commit:** `411c4d1b3d0a3f6cfb0966c459a61665aaa5d492`
- **Affected components:** `scripts/publish-play-store-metadata.sh`, its fake transaction test, and `scripts/validate-play-store-metadata.sh`.
- **Behavior:** The publisher now sends the metadata-edit commit request with `changesInReviewBehavior=ERROR_IF_IN_REVIEW` and omits `changesNotSentForReview`. The validator requires the retained in-review behavior and rejects a publisher that contains `changesNotSentForReview`.
- **Reader and operator impact:** Metadata publishing follows the app's automatic review-submission mode instead of sending the parameter that Play rejected. The retained guard still requests an error if changes are already in review.
- **Safety boundary:** The evidence states that this change does not cancel, combine, or bypass changes already in review. Deployment procedure, migration steps, configuration changes beyond the app's existing review mode, compatibility beyond the reported Play behavior, security impact, and rollback procedure are not established by this merge.

### 2026-07-29 — [PR #139](https://github.com/ramideltoro/nutsnews-android/pull/139): Report Play metadata commit errors

- **Repository:** `ramideltoro/nutsnews-android`
- **Merge commit:** `33c2bb254c6f3a3237d370d36b89daebd2af3dfe`
- **Affected components:** `scripts/publish-play-store-metadata.sh` and `scripts/tests/test-play-store-metadata.sh`.
- **Behavior:** When the Play metadata commit fails, the publisher captures the response, reads a non-empty `.error.message` through `jq` when available, and fails with that sanitized message. If no structured message is available, it reports `Play returned no structured error message.` The test covers a rejected commit that returns a structured error.
- **Reader and operator impact:** Operators receive the reported Play API error instead of every HTTP 400 being presented as an in-review conflict, making the immediate rejection reason more diagnosable.
- **Safety boundary:** This merge preserved the guarded commit behavior then in use; PR #140 subsequently changed its URL as recorded above. Deployment procedure, migration, configuration changes, compatibility, security impact, and rollback procedure are not established by this merge.

## Scope and evidence boundary

The supplied evidence establishes the documented source, workflow, configuration, script, validator, test, CI, and release-documentation changes only. It does not establish a release, execution in any environment, a successful Play submission or promotion, additional configuration requirements, or any command for operators to run.
