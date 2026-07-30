---
title: "Automated NutsNews Android Merge Log (Technical)"
description: "Merge record for Android changes, including launcher-icon safe-zone rendering."
wiki:
  source_route: "/technical/updates/automated-nutsnews-android-merge-log"
  simple_route: "/simple/updates/automated-nutsnews-android-merge-log"
  slug: "updates/automated-nutsnews-android-merge-log"
  primary_diagram:
    file: "diagrams/updates/AUTOMATED_NUTSNEWS_ANDROID_MERGE_LOG.mmd"
    accTitle: "Android launcher icon rendering after PR 148"
    accDescr: "PR 148 places the complete iOS icon composition inside Android's centered 66dp adaptive-icon safe zone, uses full-composition legacy assets, and removes the Play listing icon crop."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 1000004
  approval:
    state: automated
    publishing: allowed
    reviewed_by: "codex-merge-docs"
    reviewed_on: "2026-07-30T20:06:07.395Z"
    technical_source_hash: 78b94b591677da02503a3cce52e429f3de80d0fbb5a396a5b98bbe78c869b499
    automation:
      source_repository: "ramideltoro/nutsnews-android"
      pull_requests: "148"
      merge_commit: 9724b3a88ac840c077853dac5dcd0be589466d45
      workflow_run: "30577386413"
---
# Automated NutsNews Android Merge Log

This log records merged Android changes. It is an unreviewed draft; approval metadata remains present and does not claim human review.

## Merge entries

### 2026-07-30 — [PR #148](https://github.com/ramideltoro/nutsnews-android/pull/148): Match Android launcher icon to the iOS artwork

- **Repository:** `ramideltoro/nutsnews-android`
- **Merge commit:** `9724b3a88ac840c077853dac5dcd0be589466d45`
- **Affected components:** `app/src/main/res/drawable/ic_launcher_foreground.xml`; legacy `ic_launcher.png` resources in the `mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, and `xxxhdpi` families; `docs/branding/android-brand-assets.md`; `scripts/generate-brand-assets.swift`; `scripts/generate-play-store-assets.swift`; `fastlane/metadata/android/en-US/images/icon.png` and its SHA-256 manifest entry; and `scripts/validate-brand-assets.sh`.
- **Behavior:** The adaptive foreground now wraps `@drawable/brand_icon` in an inset of `19.4444%` on every edge. This fits the complete iOS composition into Android's centered 66dp safe zone of the 108dp adaptive-icon layer, so launcher masks do not enlarge or clip the upper-right highlights. Legacy square and round assets are generated as full-composition resizes at 48, 72, 96, 144, and 192 pixels; round variants retain only Android's circular clip. The Play listing's 512px icon is rendered without the removed rounded-corner crop, and its SHA-256 manifest value changes accordingly. Brand validation now requires the four foreground insets and `@drawable/brand_icon` source reference.
- **Reader and operator impact:** Android launchers and the Play listing use the iOS icon composition without the prior Android-only framing or listing crop. The validation script checks the adaptive safe-zone contract; no new operator command is established by this merge.
- **Safety boundary:** This merge establishes the documented asset rendering, generator, checksum-manifest, and validation changes only. Deployment, migration, configuration, compatibility, security, rollback, release version, execution, and successful Play listing publication facts are not established by this merge.

### 2026-07-30 — [PR #146](https://github.com/ramideltoro/nutsnews-android/pull/146): Stage Alpha when Play requires Console review

- **Repository:** `ramideltoro/nutsnews-android`
- **Merge commit:** `b97a5f4951a3529366f5cc47be1953a8d4a5938f`
- **Affected components:** `.github/workflows/play-closed-promotion.yml`, `scripts/promote-play-closed.sh`, `scripts/validate-play-closed-promotion.sh`, and `scripts/tests/test-play-closed-promotion.sh`.
- **Behavior:** After assigning the verified bundle to Alpha, the promotion script first commits the Play edit normally. It retries with `changesNotSentForReview=true` only when Play returns HTTP 400 and the error message exactly states that changes cannot be sent for review automatically and requests that query parameter. If that retry succeeds, the script returns `pending-console-review`; other initial failures retain the existing Alpha-commit rejection path, and retry failures report that Play could not be reached or rejected the deferred Alpha commit. The workflow accepts `pending-console-review` as a valid result and adds the required action: send changes for review from Google Play Console. The validator requires both the fallback parameter and status, and a negative test verifies that changing the parameter causes validation to fail.
- **Reader and operator impact:** A promotion that encounters the specified Play review requirement can stage Alpha instead of failing immediately. Its workflow summary tells the operator that the remaining action is to send the staged changes for review in Google Play Console.
- **Safety boundary:** This merge establishes only the exact HTTP-400/message-gated fallback, its status, workflow summary, validator, and test. Deployment, migration, configuration beyond that request parameter, compatibility, security, rollback, a successful Play promotion, Console submission, release, and execution facts are not established by this merge.

### 2026-07-30 — [PR #145](https://github.com/ramideltoro/nutsnews-android/pull/145): Report Google Play Alpha commit errors

- **Repository:** `ramideltoro/nutsnews-android`
- **Merge commit:** `bfefe83ebedd25f5fa6ea7afc38d79ecb9d8c4c8`
- **Affected components:** `scripts/promote-play-closed.sh`, `scripts/validate-play-closed-promotion.sh`, and `scripts/tests/test-play-closed-promotion.sh`.
- **Behavior:** The Alpha promotion script saves the Play edit-commit response to `commit-response.json` and captures the HTTP status. A network failure reports that Play could not be reached while committing the Alpha release. A non-2xx response reads `.error.message` with `jq` when available, otherwise uses `Play returned no structured error message.`, and fails with `Play rejected the Alpha release commit (HTTP <status>): <message>`. The existing commit query continues to use `changesInReviewBehavior=${review_behavior}`. The validator requires response output, HTTP-status capture, and the Alpha-specific rejection message; a negative regression test verifies that changing that message causes validation to fail.
- **Reader and operator impact:** Alpha-promotion failures now report the HTTP status and a structured Play error message when one is returned, making the immediate rejection more diagnosable.
- **Safety boundary:** This merge changes diagnostic handling around the Alpha commit only. Deployment, migration, configuration, compatibility, security, rollback, a successful Play promotion, release, and execution facts are not established by this merge.

### 2026-07-30 — [PR #144](https://github.com/ramideltoro/nutsnews-android/pull/144): Make Play Internal deployment review-safe

- **Repository:** `ramideltoro/nutsnews-android`
- **Merge commit:** `9c18d7dce6b11299f0aef61d3a77367dddc2df21`
- **Affected components:** `scripts/deploy-play-internal.sh`, `scripts/validate-tagged-release.sh`, and `scripts/tests/test-tagged-release.sh`.
- **Behavior:** The Internal deployment script commits its Play edit with `changesNotSentForReview=true`. It saves the commit response to `commit-response.json` and captures the HTTP status. A network failure reports that Play could not be reached while committing the Internal release. A non-2xx response reads `.error.message` with `jq` when available, otherwise uses `Play returned no structured error message.`, and fails with `Play rejected the internal release commit (HTTP <status>): <message>`. Tagged-release validation requires both the review-safe commit parameter and the structured Internal-commit rejection message; a negative regression test verifies that removing the parameter causes validation to fail.
- **Reader and operator impact:** Internal deployment commits explicitly request that changes are not sent for review, while commit failures now expose the HTTP status and structured Play error when available.
- **Safety boundary:** The supplied evidence supports the Internal commit parameter and diagnostics only. Whether this changes an active Alpha review, any deployment result, migration, configuration, compatibility, security, rollback, release, and execution facts are not established by this merge.

### 2026-07-30 — [PR #143](https://github.com/ramideltoro/nutsnews-android/pull/143): Center and widen Read Story button

- **Repository:** `ramideltoro/nutsnews-android`
- **Merge commit:** `4868451e13786353677d1089c4970ce412f4da09`
- **Affected components:** the home-feed `ReadStoryButton` in `app/src/main/kotlin/com/nutsnews/app/feature/feed/ArticleCard.kt` and its regression test in `app/src/test/kotlin/com/nutsnews/app/feature/feed/ArticleCardTest.kt`.
- **Behavior:** The control now uses a `Box` with a fixed `ReadStoryButtonWidth` of 160 dp and a 48 dp height. Its existing modifier chain, including shadow, clipping, border, click handling, and the `article_read_story` test tag, is retained. The Box centers its content; the `Read Story` text fills the available width, is limited to one line, and uses centered text alignment. The regression test checks the 160 dp width, 48 dp height, and matching horizontal and vertical centers of the button and label.
- **Reader and operator impact:** On the home feed, Read Story is wider and its label is centered within a fixed-size 160 × 48 dp control. The test guards those dimensions and alignment.
- **Safety boundary:** Deployment, migration, configuration, compatibility, security, rollback, release, and execution facts are not established by this merge.

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
