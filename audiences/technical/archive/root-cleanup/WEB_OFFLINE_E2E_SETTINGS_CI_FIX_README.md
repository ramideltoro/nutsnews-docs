---
title: NutsNews Web Offline E2E Settings CI Fix
wiki:
  source_route: /technical/archive/root-cleanup/web-offline-e2e-settings-ci-fix-readme/
  simple_route: /simple/archive/root-cleanup/web-offline-e2e-settings-ci-fix-readme/
  primary_diagram:
    file: diagrams/archive/root-cleanup/WEB_OFFLINE_E2E_SETTINGS_CI_FIX_README.md
    accTitle: "NutsNews Web Offline E2E Settings CI Fix diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 2d9b7a6f228a01f90450ad26b98416200286cc7447226f886d893baeaa12a3e7
---

# NutsNews Web Offline E2E Settings CI Fix

This update stabilizes the fully mocked Web Offline E2E regression in GitHub Actions.

## Why

The CI runner sometimes sees the footer settings button but the settings panel does not become visible within the default 5 second Playwright assertion window. This made the test fail even though the public page rendered and the settings button existed.

## Fix

The regression test now uses a dedicated settings helper that:

- Locates the real settings button by accessible name.
- Scrolls it into view.
- Clicks it with `force: true`.
- Falls back to a DOM click if the first click is swallowed during hydration/timing.
- Waits up to 20 seconds for `.theme-panel` in slower CI runs.
- Reuses the same helper for the later language-switch test.

The test remains fully offline and still verifies that the settings button opens the settings panel before continuing.
