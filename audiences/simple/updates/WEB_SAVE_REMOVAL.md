---
title: Website Save Functionality Removal
description: >-
  This article explains that the NutsNews website no longer has Save buttons or
  a Saved Stories link, while mobile apps and existing browser-saved stories are
  unaffected.
wiki:
  source_route: /technical/updates/web-save-removal
  simple_route: /simple/updates/web-save-removal
  slug: updates/web-save-removal
  primary_diagram:
    file: diagrams/updates/WEB_SAVE_REMOVAL.mmd
    accTitle: Website Save Functionality Removal authoring flow
    accDescr: >-
      The expert source and primary diagram feed a Simple draft, which then
      passes automated quality checks before it can become public wiki content.
      If publication requirements are not met, it remains an unreviewed draft.
  status: draft
  collection: product-and-reader-experience
  section: public-product
  order: 10000
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 910a9ab1d46ad22f4312551faab55afa2a62ae8d86bc8c61999f0bbd8c9f827b
---
# Website Save Functionality Removal

## What changed

The NutsNews website no longer shows Save buttons or a Saved Stories navigation entry. Readers can still open articles and publisher links normally.

## What is in scope

This change applies to the website only. Android and iOS functionality is unchanged.

Existing browser-saved stories are not deleted. However, the website no longer reads or updates that saved data. Readers can clear website data in their browser if they want to remove it.

## Technical details

App PR [#640](https://github.com/ramideltoro/nutsnews/pull/640) merged as commit `5897b8c4ceae953ccbb7800c7f58d3a22f43226f`.

The change removed these website features and code paths:

- `ArticleFeed` no longer renders `SavedStoryButton`
- `SiteFooter` no longer links to `/saved`
- the saved-stories component was removed
- the browser-storage library was removed
- the `/saved` route now permanently redirects to `/` using Next.js `permanentRedirect`
- feature-only CSS and translations were removed

The localized privacy disclosures explain the retirement and the handling of historical browser data.

## Validation

All PR checks passed, including:

- 39 component tests
- nine translation tests
- TypeScript
- lint
- build
- accessibility
- visual regression
- public-reader smoke tests
- offline end-to-end checks
- live Vercel preview checks

The public-reader suite verifies the `/saved` redirect, while component and visual checks verify the absence of Save controls.

The merged main commit followed the normal immutable-container, staging qualification, and production promotion workflows. At the time this documentation was prepared, production promotion was still being monitored.

OSV and Snyk reported dependency vulnerabilities that were also present on earlier main runs; no dependencies changed in this PR.

## Documentation publication

The automatic merged-PR documentation queue is paused on older failed work. This entry is prepared for review and must pass the repository publication requirements before it becomes public wiki content.
