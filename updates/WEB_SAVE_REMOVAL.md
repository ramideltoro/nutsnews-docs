---
title: "Website Save Functionality Removal"
description: "Draft documentation for Website Save Functionality Removal."
wiki:
  source_route: "/technical/updates/web-save-removal"
  simple_route: "/simple/updates/web-save-removal"
  slug: "updates/web-save-removal"
  primary_diagram:
    file: "diagrams/updates/WEB_SAVE_REMOVAL.mmd"
    accTitle: "Website Save Functionality Removal authoring flow"
    accDescr: "The expert source and primary diagram feed a Simple draft that passes automated quality checks before publication."
  status: draft
  collection: product-and-reader-experience
  section: public-product
  order: 10000
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: d444d650d82f246cda0dfc3d483b9fb9363deb15cefb255697ec8bf490bc079f
---
# Website Save Functionality Removal

## Purpose

The NutsNews website no longer offers Save buttons or a Saved Stories navigation entry. Readers continue to open articles and publisher links normally.

## Scope

This change applies to the website only. Android and iOS functionality is unchanged. Historical browser-saved stories are not deleted, but the website no longer reads or updates that data; readers can clear website data in their browser to remove it.

## Technical details

[App PR #640](https://github.com/ramideltoro/nutsnews/pull/640) merged as commit 5897b8c4ceae953ccbb7800c7f58d3a22f43226f. ArticleFeed no longer renders SavedStoryButton, SiteFooter no longer links to /saved, and the saved-stories component and browser-storage library were removed. The /saved route permanently redirects to / using Next.js permanentRedirect. Feature-only CSS and translations were removed. The localized privacy disclosures explain the retirement and historical browser data.

## Validation

All PR checks passed, including 39 component tests, nine translation tests, TypeScript, lint, build, accessibility, visual regression, public-reader smoke, offline end-to-end checks, and live Vercel preview checks. The public-reader suite verifies the /saved redirect, while component and visual checks verify the absence of Save controls.

The merged main commit follows the normal immutable-container, staging qualification, and production promotion workflows. At the time this documentation was prepared, production promotion was still being monitored. OSV and Snyk reported dependency vulnerabilities also present on earlier main runs; no dependencies changed in this PR.

## Documentation publication

The automatic merged-PR documentation queue is paused on older failed work. This entry is prepared for review and must pass the repository publication requirements before it becomes public wiki content.
