---
title: "Automated NutsNews Android Merge Log (Simple)"
description: "Plain-language record of Android feed controls and Play closed-testing promotion changes, including the fixed-width Read Story control."
wiki:
  source_route: "/technical/updates/automated-nutsnews-android-merge-log"
  simple_route: "/simple/updates/automated-nutsnews-android-merge-log"
  slug: "updates/automated-nutsnews-android-merge-log"
  primary_diagram:
    file: "diagrams/updates/AUTOMATED_NUTSNEWS_ANDROID_MERGE_LOG.mmd"
    accTitle: "Fixed-width centered Read Story button after merge 143"
    accDescr: "PR 143 renders the home-feed Read Story control at 160 by 48 dp and centers its one-line label; its regression test checks the dimensions and label center."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 1000004
  approval:
    state: automated
    publishing: allowed
    reviewed_by: "codex-merge-docs"
    reviewed_on: "2026-07-30T11:30:18.525Z"
    technical_source_hash: 448b7cf7f8e27fedee0ea6cb0d2583a0ad0bfa8de1c8d6133694ac390f0da823
    automation:
      source_repository: "ramideltoro/nutsnews-android"
      pull_requests: "143"
      merge_commit: 4868451e13786353677d1089c4970ce412f4da09
      workflow_run: "30538554281"
---
# Automated NutsNews Android Merge Log

This log records merged Android changes. It is an unreviewed draft; approval metadata remains present and does not claim human review.

## Merge entries

### 2026-07-30 — [PR #143](https://github.com/ramideltoro/nutsnews-android/pull/143): Center and widen Read Story button

- **Repository:** `ramideltoro/nutsnews-android`
- **Merge commit:** `4868451e13786353677d1089c4970ce412f4da09`
- **Affected components:** the home-feed `ReadStoryButton` in `app/src/main/kotlin/com/nutsnews/app/feature/feed/ArticleCard.kt` and its regression test in `app/src/test/kotlin/com/nutsnews/app/feature/feed/ArticleCardTest.kt`.
- **Behavior:** Read Story now uses a `Box` that is fixed at 160 dp wide and 48 dp high. It keeps the existing shadow, clipping, border, click handling, and `article_read_story` test tag. The Box centers its content. The `Read Story` label fills the available width, stays on one line, and is centered. The regression test checks the 160 dp width, 48 dp height, and that the label and button have the same horizontal and vertical centers.
- **Reader and operator impact:** On the home feed, Read Story is wider and its label is centered inside a fixed 160 × 48 dp control. The test protects those dimensions and alignment.
- **Safety boundary:** Deployment, migration, configuration, compatibility, security, rollback, release, and execution facts are not established by this merge.

### 2026-07-30 — [PR #142](https://github.com/ramideltoro/nutsnews-android/pull/142): Add guarded Play Alpha promotion

- **Repository:** `ramideltoro/nutsnews-android`
- **Merge commit:** `2ce2ee0aec3d64079b41764c6430413e1498bb16`
- **Affected components:** `.github/workflows/play-closed-promotion.yml`, `config/play/closed-testing.json`, `scripts/promote-play-closed.sh`, its validator and contract test, Android CI validation, and release-operations documentation.
- **Behavior:** A manually started workflow on `main` takes a version name, numeric version code, English (United States) release notes, and the exact `REPLACE_ALPHA_REVIEW` acknowledgement. It runs in `play-internal`, checks that the requested deterministic version is on Internal, checks Alpha, and either reports `already-present` or requires a version code greater than Alpha's current maximum. It moves the verified Internal bundle to `alpha` as a completed rollout, commits with `CANCEL_IN_REVIEW_AND_SUBMIT`, then checks Alpha again for that version. Only one promotion can run at a time; a running one is not cancelled.
- **Reader and operator impact:** Replacing an Alpha release already in Play review is an explicit, traceable action instead of an implicit edit behavior. The exact acknowledgement is required before the workflow can replace and resubmit the review; a version already on Alpha does not create a new submission.
- **Safety boundary:** The workflow uses the `play-internal` environment and the Play service-account secret, creates restricted temporary credential files, and has no signing or production access. It does not upload or sign an artifact; the bundle must already be verified on Internal. The supplied evidence establishes no deployment outside this workflow, migration, compatibility guarantee, successful Play promotion, or rollback procedure. Those facts are not established by this merge.

### 2026-07-30 — [PR #141](https://github.com/ramideltoro/nutsnews-android/pull/141): Use a standard Read Story button shape

- **Repository:** `ramideltoro/nutsnews-android`
- **Merge commit:** `fc6d4d8dfeb8a6d310c7a379bc01e405d90f5ffc`
- **Affected components:** the home-feed `ReadStoryButton` in `ArticleCard.kt` and `ArticleCardTest.kt`.
- **Behavior:** Read Story now gets one `RoundedCornerShape` from `NutsNewsTheme.dimensions.controlCornerRadius` and uses it for the shadow, clip, and border. A regression test makes the shape at 120 by 48 and checks a 16 dp corner radius that is less than half the control height, so it cannot return to capsule geometry.
- **Reader and operator impact:** The home-feed Read Story control now has the standard rounded-rectangle outline instead of a circle-based capsule on text-width buttons. Its gradient, glow animation, border behavior, button accessibility role, and 48 dp minimum touch target remain in place.
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
