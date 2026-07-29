---
title: "Automated NutsNews Android Merge Log (Simple)"
description: "Plain-language record of Android Play Store metadata publishing changes."
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

This is an unreviewed record of merged changes to the Android Play Store metadata publisher. The approval fields are present, but they do not say that a person has reviewed it.

## Newest merge: 2026-07-29 — [PR #140](https://github.com/ramideltoro/nutsnews-android/pull/140)

- **Repository and commit:** `ramideltoro/nutsnews-android`, `411c4d1b3d0a3f6cfb0966c459a61665aaa5d492`.
- The publisher now lets Play use the app's automatic review-submission mode. It sends `changesInReviewBehavior=ERROR_IF_IN_REVIEW` but no longer sends `changesNotSentForReview`.
- `scripts/publish-play-store-metadata.sh`, its fake transaction test, and `scripts/validate-play-store-metadata.sh` changed. The test requires that same request, and the validator rejects a publisher that contains the removed parameter.
- For operators, this avoids the Play rejection caused by that parameter while keeping the request to stop with an error when changes are already in review.
- The evidence says this does not cancel, combine, or bypass changes already in review. Deployment, migration, configuration changes beyond the existing review mode, compatibility beyond the reported Play behavior, security, and rollback are not established by this merge.

## Earlier merge: 2026-07-29 — [PR #139](https://github.com/ramideltoro/nutsnews-android/pull/139)

- **Repository and commit:** `ramideltoro/nutsnews-android`, `33c2bb254c6f3a3237d370d36b89daebd2af3dfe`.
- If Play rejects a metadata commit, the publisher now keeps the response and reports Play's non-empty structured error message. If Play provides none, it reports `Play returned no structured error message.`
- `scripts/publish-play-store-metadata.sh` and `scripts/tests/test-play-store-metadata.sh` changed; the test covers a rejected commit with a structured error. This helps operators see the immediate Play rejection reason rather than treating every HTTP 400 as an in-review conflict.
- This merge retained the guarded commit behavior then in use; PR #140 later changed the request URL as described above. Deployment, migration, configuration, compatibility, security, and rollback are not established by this merge.

## What this record does not prove

The supplied evidence only proves changes to the publisher, validator, and tests. It does not prove a release, use in any environment, a successful Play submission, extra setup requirements, or a command that operators should run.
