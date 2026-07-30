---
title: "Automated NutsNews Android Merge Log (Simple)"
description: "Plain-language record of Android changes, including launcher-icon safe-zone rendering."
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
- **Behavior:** After putting the verified bundle on Alpha, the script first commits the Play edit normally. It retries with `changesNotSentForReview=true` only when Play returns HTTP 400 with the exact message that changes cannot be sent for review automatically and asks for that parameter. When that retry succeeds, the script reports `pending-console-review`. Other first-attempt failures still use the existing Alpha-commit error path; retry failures say that Play could not be reached or rejected the deferred Alpha commit. The workflow accepts `pending-console-review` and says the required action is to send changes for review from Google Play Console. The validator requires the fallback parameter and status, and a negative test checks that changing the parameter makes validation fail.
- **Reader and operator impact:** If the specified Play review requirement appears, the promotion can stage Alpha instead of failing immediately. The workflow summary tells the operator to send the staged changes for review in Google Play Console.
- **Safety boundary:** This merge establishes only the exact HTTP-400/message-gated fallback, its status, workflow summary, validator, and test. Deployment, migration, configuration beyond that request parameter, compatibility, security, rollback, a successful Play promotion, Console submission, release, and execution facts are not established by this merge.

### 2026-07-30 — [PR #145](https://github.com/ramideltoro/nutsnews-android/pull/145): Report Google Play Alpha commit errors

- **Repository:** `ramideltoro/nutsnews-android`
- **Merge commit:** `bfefe83ebedd25f5fa6ea7afc38d79ecb9d8c4c8`
- **Affected components:** `scripts/promote-play-closed.sh`, `scripts/validate-play-closed-promotion.sh`, and `scripts/tests/test-play-closed-promotion.sh`.
- **Behavior:** The Alpha promotion script saves the Play commit reply in `commit-response.json` and records the HTTP status. If it cannot reach Play, it reports that. If Play returns a non-2xx status, it uses the `.error.message` from the reply when `jq` can read one; otherwise it says `Play returned no structured error message.` It then reports `Play rejected the Alpha release commit (HTTP <status>): <message>`. The commit still uses `changesInReviewBehavior=${review_behavior}`. The validator checks for the saved reply, status capture, and Alpha-specific error message. A negative test confirms that changing the message makes validation fail.
- **Reader and operator impact:** When an Alpha promotion is rejected, operators can see the HTTP status and a Play error message when Play supplies one.
- **Safety boundary:** This merge changes Alpha commit diagnostics only. Deployment, migration, configuration, compatibility, security, rollback, a successful Play promotion, release, and execution facts are not established by this merge.

### 2026-07-30 — [PR #144](https://github.com/ramideltoro/nutsnews-android/pull/144): Make Play Internal deployment review-safe

- **Repository:** `ramideltoro/nutsnews-android`
- **Merge commit:** `9c18d7dce6b11299f0aef61d3a77367dddc2df21`
- **Affected components:** `scripts/deploy-play-internal.sh`, `scripts/validate-tagged-release.sh`, and `scripts/tests/test-tagged-release.sh`.
- **Behavior:** The Internal deployment script commits its Play edit with `changesNotSentForReview=true`. It saves the reply in `commit-response.json` and records the HTTP status. If it cannot reach Play, it reports that. If Play returns a non-2xx status, it uses the `.error.message` when `jq` can read one; otherwise it says `Play returned no structured error message.` It then reports `Play rejected the internal release commit (HTTP <status>): <message>`. Tagged-release validation requires the review-safe parameter and the Internal error message. A negative test confirms that removing the parameter makes validation fail.
- **Reader and operator impact:** Internal commits explicitly request that changes are not sent for review, and a rejected commit now includes its HTTP status and a Play error message when available.
- **Safety boundary:** The evidence supports only the Internal commit parameter and diagnostics. Whether this changes an active Alpha review, any deployment result, migration, configuration, compatibility, security, rollback, release, and execution facts are not established by this merge.

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
