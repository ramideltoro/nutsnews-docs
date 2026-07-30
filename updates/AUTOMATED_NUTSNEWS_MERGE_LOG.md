---
title: "Automated NutsNews Merge Log"
description: "Automated record of merged NutsNews product changes."
wiki:
  source_route: "/technical/updates/automated-nutsnews-merge-log"
  simple_route: "/simple/updates/automated-nutsnews-merge-log"
  slug: "updates/automated-nutsnews-merge-log"
  primary_diagram:
    file: "diagrams/updates/AUTOMATED_NUTSNEWS_MERGE_LOG.mmd"
    accTitle: "Centered mobile navigation menu behavior"
    accDescr: "When a reader opens the mobile navigation menu, a dimmed backdrop appears and the menu panel is centered in the viewport. Its labels are centered independently of their arrows, and reduced-motion preferences disable the new animations."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 1000001
  approval:
    state: automated
    publishing: allowed
    reviewed_by: "codex-merge-docs"
    reviewed_on: "2026-07-30T06:47:11.810Z"
    technical_source_hash: bf7d7ea4668526ff064e2e3e2b5908e96b2e59b0b8d3c923595812a46f4f903c
    automation:
      source_repository: "ramideltoro/nutsnews"
      pull_requests: "540"
      merge_commit: 740230f0ada1c7031703ad075f4ddc3d0f0db4eb
      workflow_run: "30520576038"
---
# Automated NutsNews Merge Log

This log records already-merged changes from supplied merge evidence. Approval metadata is automated and does not claim human review.

## Merge entries

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

PR #540 establishes the documented centered mobile-navigation behavior, including its supported motion preference. PR #539 establishes the documented privacy-route and responsive-navigation behavior. PRs #536–#538 establish the documented staging-evidence verification behavior. The supplied evidence does not establish successful production deployment, changed secret values or access policy, a new external dependency, or an operator rollback command.
