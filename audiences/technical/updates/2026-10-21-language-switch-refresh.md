---
title: Language switching updates the homepage automatically
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
    technical_source_hash: 976785af7f152ec41054b89d7b7b34eb1d15edc3a1d7e8e4cd6f8c556e119c5f
---
# Language switching updates the homepage automatically

## Reader outcome

Selecting a language updates homepage labels and loads translated article titles and summaries without a page refresh. Returning to English restores the initial English feed immediately. Translation availability and existing server fallback rules continue to determine individual article content.

The app change is [NutsNews PR #644](https://github.com/ramideltoro/nutsnews/pull/644), merged as `b9439ab3c59cfae05cd0071bf787cd44a4605a4f`.

## Cause and implementation

The homepage previously allowed several asynchronous requests to update the same article state. An earlier translated home response or pagination response could finish after a newer language selection and overwrite it. An initial timer could also apply an obsolete selection after the reader interacted.

`web/app/components/ArticleFeed.tsx` now owns an AbortController for the current feed request. Language changes abort superseded home and pagination requests. Both API paths receive the abort signal. After response parsing, and in error and loading-state handlers, aborted requests return without updating the page. The fallback home endpoint remains available for failed primary responses.

The English branch restores initial articles, category sections, pagination state, and degradation state, clears errors and loading state, and cancels pending translations. An initially empty English feed is fetched again. Feed requests are cancelled on unmount. Storage events synchronize feed data when another tab changes the language preference.

`web/app/components/useSelectedLanguage.ts` cancels its initial timer when a language event arrives, applies event selections directly, and clears its timer and listeners on cleanup. Existing article-detail cancellation and translation validation remain in place.

## Validation

Local checks passed: 46 component tests, 9 i18n tests, 123 route tests, TypeScript, full ESLint, and the production build. Seven added timing regressions cover out-of-order translations, returning to English, stale failures, old-language pagination, cross-tab changes, unmount cancellation, and initial language synchronization. The new suite reproduced five failures against the previous implementation.

Chrome DevTools MCP reproduced the production bug by delaying a French home response for two seconds and selecting English before it finished. The saved preference remained English, but the old response changed the document and articles to French. On the PR preview, the same sequence retained English after both requests settled. French-to-German switching retained German, and Japanese titles appeared automatically at a 390-pixel mobile viewport.

All PR checks passed before merge, including visual, accessibility, public-reader, offline, and deployed-preview browser checks. [Preview verification attempt 2](https://github.com/ramideltoro/nutsnews/actions/runs/39717920925/attempts/2) passed after the staging recovery below.

## Staging recovery and separate maintenance findings

The first preview check failed because archive search returned HTTP 500. Vercel logs showed a DNS lookup failure for the paused `nutsnews-staging` Supabase project. Resuming that existing project restored ACTIVE_HEALTHY status and HTTP 200 search responses. No test was skipped, and no schema or credential change was made. [Issue #645](https://github.com/ramideltoro/nutsnews/issues/645) records the recovery and successful unchanged rerun.

Post-merge security checks reported existing dependency findings and Snyk authentication failure. The app change did not modify dependency manifests, workflows, or security credentials. These findings are tracked separately in [dependency issue #646](https://github.com/ramideltoro/nutsnews/issues/646) and [Snyk issue #647](https://github.com/ramideltoro/nutsnews/issues/647).

The [manual merge-docs run](https://github.com/ramideltoro/nutsnews-docs/actions/runs/39719130187) discovered no processable updates because the app documentation cursor is blocked on an older three-PR batch after three failures. This complete manual bundle is pending human review under the repository contribution contract.

## Release tracking

The [production container workflow](https://github.com/ramideltoro/nutsnews/actions/runs/39719125563) tracks the exact merged commit. Production deployment and final browser verification are being monitored; this draft will record the outcome before review.
