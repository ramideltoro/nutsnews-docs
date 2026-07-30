---
title: "Automated NutsNews Merge Log (Technical)"
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

PR #541 makes a successful same-repository merge to `main` enter the automatic production release chain. `Container Image` builds and smoke-tests an immutable image, then publishes exact-run metadata containing the source commit, source workflow run ID, build ID, image digest, migration head, schema version, and production Supabase project reference. `automatic-production-release.yml` is the automatic post-`main` release owner: it revalidates the triggering successful `main` run and its artifact before dispatching the candidate to the protected infra release chain.

For readers and operators, normal successful `main` merges now request protected VPS staging deployment and qualification, VPS production promotion, and Vercel production release. The documented chain deploys VPS staging, runs staging qualification, applies VPS production, deploys and smokes Vercel production, and automatically rolls VPS back if Vercel promotion fails. Manual `Container Image` runs remain build-only, and typed manual recovery workflows remain available.

The handoff accepts only complete, expected metadata for the same repository, a full source SHA, an immutable `sha256` image digest, matching run/build identity, matching migration and schema values, and a production project reference. Fork, failed, non-`main`, mutable-image, mismatched-run or SHA, incomplete, and unexpected metadata are rejected. The app-side handoff has read-only GitHub permissions and uses only the staging dispatch token; staging secrets remain in protected infra environments and production credentials remain downstream in protected environments. No workflow pushes or merges `main`.

Production database migrations remain separately protected. If the exact application source requires a migration that production has not applied, promotion fails closed until the protected production migration workflow has run, after which the release can be retried. This merge also adds the `automatic-release` environment for the post-`main` handoff and the `staging-recovery` environment for manual staging recovery; the evidence states that these have protected-branch restrictions and no reviewer wait. The Vercel workflow is renamed to describe its protected release role.

This merge does not establish that a staging or production deployment completed, any changed secret value, a new external dependency, a database migration, a configuration value beyond the documented workflow and environment behavior, compatibility beyond the stated release-contract checks, or an operator rollback command. It establishes automatic VPS rollback only for the documented Vercel-promotion failure path.

### 2026-07-30 — ramideltoro/nutsnews [PR #540](https://github.com/ramideltoro/nutsnews/pull/540) — merge commit `740230f0ada1c7031703ad075f4ddc3d0f0db4eb`

PR #540 changes the existing mobile navigation so its open panel is fixed at the center of the viewport rather than positioned beside the top-left toggle. The panel width is limited to `min(21rem, calc(100vw - 2rem))` and its height to `min(30rem, calc(100dvh - 6rem))`; it remains vertically scrollable. A fixed, dimmed and blurred backdrop is rendered while the menu is open. The panel fades and scales into view, and menu options animate in with staggered delays. With `prefers-reduced-motion: reduce`, those backdrop, panel, and option animations are disabled.

For readers on narrow browsers, the mobile menu is centered so its choices and labels remain visible. Each option now uses a three-column grid: the label occupies the center column while the trailing arrow is placed independently at the end column. The changed browser coverage uses a 320×568 viewport and verifies that the panel center and every option-label center are within one pixel of the viewport’s horizontal center; it also verifies visibility, existing routes, Escape focus restoration, and closing by an outside click.

The affected components are `web/app/components/MobileSiteNavigation.tsx`, `web/app/globals.css`, and `web/tests/public-reader-smoke.spec.ts`. The component adds a backdrop element, wraps its toggle and panel in a positioned content container, and adds label and arrow elements to each link. The evidence does not establish a deployment result or procedure, migration, configuration requirement, compatibility promise beyond the documented mobile-navigation behavior, security-policy or access-policy change, new dependency, or rollback procedure.

### 2026-07-29 — ramideltoro/nutsnews [PR #539](https://github.com/ramideltoro/nutsnews/pull/539) — merge commit `75890e1107d8b3cb709f5c7ac363ce91917a5281`

PR #539 makes `/privacy` a privacy-policy selector and moves the existing localized website/iOS policy to `/privacy/ios`. The iOS policy wording is described as unchanged by the supplied evidence. The selector offers Android and iOS policy cards; the Android card targets `https://www.nutsnews.com/privacy/android`, and the iOS card targets `/privacy/ios`. Sitemap and smoke/accessibility coverage include `/privacy`, `/privacy/android`, and `/privacy/ios`.

For readers, `/privacy` now starts with a platform choice rather than the full iOS policy. On viewports below the existing 720px breakpoint, Apps, Saved, About, Contact, and Privacy move from the footer into a fixed top-left hamburger menu. At desktop widths, the footer retains those links and the mobile menu is hidden.

The new `MobileSiteNavigation` component owns the menu state. Its toggle exposes `aria-expanded` and `aria-controls`; opening the menu renders a labelled navigation panel. Escape closes the panel and returns focus to the toggle, an outside pointer action closes it, and selecting a navigation link closes it. The changed component and browser coverage also exercise keyboard navigation. The menu is positioned with top/left safe-area insets, and the panel can scroll within its maximum viewport height.

This merge establishes public-route and interface behavior only. It does not establish a deployment result or procedure, a migration, configuration requirements, a compatibility promise beyond the documented routes and responsive behavior, a security-policy change, changed secrets or access policy, a new external dependency, or a rollback procedure.

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

PR #541 establishes the guarded automatic release handoff and its documented Vercel-failure VPS rollback path. PR #540 establishes the documented centered mobile-navigation behavior, including its supported motion preference. PR #539 establishes the documented privacy-route and responsive-navigation behavior. PRs #536–#538 establish the documented staging-evidence verification behavior. The supplied evidence does not establish successful production deployment, changed secret values or access policy, a new external dependency, a database migration, or an operator rollback command.
