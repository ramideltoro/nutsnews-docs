---
title: Language switching updates the homepage automatically (Simple)
description: >-
  NutsNews language request cancellation, browser verification, staging
  recovery, and release evidence for PR 644.
wiki:
  source_route: /technical/updates/2026-10-21-language-switch-refresh
  simple_route: /simple/updates/2026-10-21-language-switch-refresh
  slug: updates/2026-10-21-language-switch-refresh
  primary_diagram:
    file: diagrams/updates/2026-10-21-language-switch-refresh.mmd
    accTitle: Language changes keep the newest article feed
    accDescr: >-
      Selecting a language cancels older feed and pagination requests. Only the
      current request may update articles. Selecting English restores the
      initial English feed.
  status: draft
  collection: product-and-reader-experience
  section: public-product
  order: 20261021
  approval:
    state: unreviewed
    publishing: blocked
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 3758ea9d0e66b46a1c7286651051b35f7172d61fa346cfb9864e20f00c599ce5
---
# Language switching updates the homepage automatically

## What changes for readers

Choose a language in NutsNews settings. The page updates its labels and translated stories automatically. You do not need to refresh. When you choose English again, the English stories return immediately.

If you change languages while an earlier request is still loading, the older request can no longer replace your latest choice. This also applies to requests that load more stories. Another browser tab can update the language preference too. Stories still follow the existing rules for missing translations.

## How this was checked

The old problem was reproduced in a browser: a delayed French response replaced English stories after English had already been selected. The fixed preview kept English in that situation and kept German when switching from French to German. Japanese stories also updated on a mobile-sized screen.

All 178 local tests, code checks, and the production build passed. The pull request passed its browser, visual, accessibility, and other checks before it was merged. [Read the change in PR #644](https://github.com/ramideltoro/nutsnews/pull/644).

## Validation environment recovery

A paused staging database initially made preview search fail. The existing database was resumed, search recovered, and the unchanged browser checks passed. [Issue #645](https://github.com/ramideltoro/nutsnews/issues/645) records this recovery.

Separate security maintenance findings were recorded for existing dependencies and Snyk account access. The production release completed successfully. The final live-browser check confirmed that French stories appear without refreshing and that switching back to English cancels an older French request. This draft is awaiting human review.
