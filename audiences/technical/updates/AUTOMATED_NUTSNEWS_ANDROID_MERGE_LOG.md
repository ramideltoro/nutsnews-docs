---
title: "Automated NutsNews Android Merge Log (Technical)"
description: "Merge record for Android Play Store metadata publishing changes."
wiki:
  source_route: "/technical/updates/automated-nutsnews-android-merge-log"
  simple_route: "/simple/updates/automated-nutsnews-android-merge-log"
  slug: "updates/automated-nutsnews-android-merge-log"
  primary_diagram:
    file: "diagrams/updates/AUTOMATED_NUTSNEWS_ANDROID_MERGE_LOG.mmd"
    accTitle: "Android Play metadata commit behavior after merges 139 and 140"
    accDescr: "The metadata publisher commits an edit with the in-review guard. A successful response completes the commit; a rejected response reports its structured Play error when available."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 1000004
  approval:
    state: automated
    publishing: allowed
    reviewed_by: "codex-merge-docs"
    reviewed_on: "2026-07-29T13:15:32.792Z"
    technical_source_hash: e26daf592ffa19b628f64878d4e343d8a73785f16bff4b4b2eb4abd2b74d9eba
    automation:
      source_repository: "ramideltoro/nutsnews-android"
      pull_requests: "139,140"
      merge_commit: 411c4d1b3d0a3f6cfb0966c459a61665aaa5d492
      workflow_run: "30455045680"
---
# Automated NutsNews Android Merge Log

This log records merged changes to the Android Play Store metadata publisher. It is an unreviewed draft; approval metadata remains present and does not claim human review.

## Merge entries

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

The supplied merge evidence establishes changes to the metadata publisher, its validator, and its test contracts only. It does not establish a release, execution of the publisher in any environment, a successful Play submission, additional configuration requirements, or any command for operators to run.
