---
title: "Automated NutsNews Merge Log (Simple)"
description: "Automated record of merged NutsNews product changes."
wiki:
  source_route: "/technical/updates/automated-nutsnews-merge-log"
  simple_route: "/simple/updates/automated-nutsnews-merge-log"
  slug: "updates/automated-nutsnews-merge-log"
  primary_diagram:
    file: "diagrams/updates/AUTOMATED_NUTSNEWS_MERGE_LOG.mmd"
    accTitle: "Automatic production release handoff"
    accDescr: "A successful same-repository main build publishes an immutable release candidate. A guarded handoff validates its exact metadata before dispatching it to protected staging, qualification, VPS production, and Vercel production steps; a Vercel promotion failure triggers VPS rollback."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 1000001
  approval:
    state: automated
    publishing: allowed
    reviewed_by: "codex-merge-docs"
    reviewed_on: "2026-07-30T11:28:20.155Z"
    technical_source_hash: 46d583fc757d201827f3de82dbf67a7944084b4be18b802402499483934ea46f
    automation:
      source_repository: "ramideltoro/nutsnews"
      pull_requests: "541"
      merge_commit: 1ee1d034951ddfe134f2a3caea9ca9341672054f
      workflow_run: "30538554281"
---
# Automated NutsNews Merge Log

This log records already-merged changes from supplied merge evidence. Approval metadata is automated and does not claim human review.

## Merge entries

### 2026-07-30 — ramideltoro/nutsnews [PR #541](https://github.com/ramideltoro/nutsnews/pull/541) — merge commit `1ee1d034951ddfe134f2a3caea9ca9341672054f`

PR #541 makes a successful merge to this repository’s `main` branch start the automatic production release chain. `Container Image` builds and smoke-tests an immutable image, then records the exact source commit, workflow run ID, build ID, image digest, migration head, schema version, and production Supabase project reference. `automatic-production-release.yml` checks the successful `main` run and that exact metadata before asking the protected infra release chain to continue.

For readers and operators, normal successful `main` merges now request protected VPS staging deployment and checks, VPS production promotion, and Vercel production release. The documented chain deploys VPS staging, runs staging checks, applies VPS production, deploys and smoke-tests Vercel production, and rolls VPS back automatically if Vercel promotion fails. Manual `Container Image` runs still only build images, and the typed manual recovery workflows remain available.

The handoff rejects fork, failed, non-`main`, mutable-image, mismatched run or source SHA, incomplete, and unexpected metadata. It requires the expected repository, a full source SHA, an immutable `sha256` image digest, matching run and build identity, matching migration and schema values, and a production project reference. It has read-only GitHub permissions and uses only the staging dispatch token. Staging secrets stay in protected infra environments, production credentials stay in protected downstream environments, and no workflow pushes or merges `main`.

Production database migrations are still separately protected. If this app version needs a migration that production has not applied, promotion stops safely until the protected production migration workflow has run; the release can then be retried. This merge adds `automatic-release` for the post-`main` handoff and `staging-recovery` for manual staging recovery. The evidence says both have protected-branch restrictions and no reviewer wait. The Vercel workflow is renamed to describe its protected release role.

This merge does not establish that staging or production deployment completed, any changed secret value, a new external dependency, a database migration, a configuration value beyond the documented workflow and environment behavior, compatibility beyond the stated release-contract checks, or an operator rollback command. It establishes automatic VPS rollback only for the documented Vercel-promotion failure path.

### 2026-07-30 — ramideltoro/nutsnews [PR #540](https://github.com/ramideltoro/nutsnews/pull/540) — merge commit `740230f0ada1c7031703ad075f4ddc3d0f0db4eb`

PR #540 moves the open mobile menu from beside its top-left button to the center of the screen. Its width is limited to `min(21rem, calc(100vw - 2rem))` and its height to `min(30rem, calc(100dvh - 6rem))`; it can still scroll when needed. When open, it shows a dimmed, blurred backdrop. The menu fades and scales in, and its choices appear one after another. If a reader prefers reduced motion, those animations are turned off.

For readers on narrow browsers, the menu and its choices stay centered and visible. Each choice now has a centered label and a separately positioned trailing arrow. The changed browser check uses a 320×568 viewport. It checks that the menu and every label are within one pixel of the screen center, that choices are visible and keep their existing routes, that Escape returns focus to the button, and that clicking outside closes the menu.

The affected parts are `web/app/components/MobileSiteNavigation.tsx`, `web/app/globals.css`, and `web/tests/public-reader-smoke.spec.ts`. The component now adds a backdrop, groups the button and panel in a positioned container, and gives every link separate label and arrow elements. This merge does not establish a deployment result or procedure, migration, configuration requirement, compatibility promise beyond this mobile-menu behavior, security-policy or access-policy change, new dependency, or rollback procedure.

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

PR #541 establishes the guarded automatic release handoff and its documented Vercel-failure VPS rollback path. PR #540 establishes the documented centered mobile menu, including its motion preference. PR #539 establishes the documented privacy pages and responsive menu. PRs #536–#538 establish the documented staging-evidence checks. The supplied evidence does not establish successful production deployment, changed secret values or access policy, a new external dependency, a database migration, or an operator rollback command.
