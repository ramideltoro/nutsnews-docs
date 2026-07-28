---
title: Documentation Style Guide (Simple)
description: A plain-language guide to creating matching and safe Simple and Technical wiki articles.
wiki:
  source_route: /technical/documentation-style-guide/
  simple_route: /simple/documentation-style-guide/
  slug: documentation-style-guide
  primary_diagram:
    file: diagrams/DOCUMENTATION_STYLE_GUIDE.mmd
    accTitle: "Documentation style guide workflow"
    accDescr: "A flow for writing a doc from audience-first structure to validation and publish."
  status: active
  collection: start-here
  section: contributing
  order: 37
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T22:50:31.364Z"
    technical_source_hash: a6928f078a0e14b28290ed7ff6c09ad655ac183e523f80b764d7e51e72793a78
---

# Documentation Style Guide

Use this guide when writing the Simple version of a NutsNews Wiki article or reviewing it against the Technical version.

## “Simple” still means complete

The Simple and Technical articles must agree about:

- what the system does
- who may perform an action
- exact commands, values, URLs, and limits
- warnings and stop conditions
- how to check success
- what to do when it fails
- how to roll back safely

Use shorter sentences and explain technical words. Do not remove a fact or safety step just because it is complicated.

## The files that belong together

One original Technical source has:

- `audiences/simple/<source>.md`
- `audiences/technical/<source>.md`
- `diagrams/<source-without-md>.mmd`

Update all four tracked files together. Generated site files, reports, caches, and inventory files are not hand-edited sources.

## Where a document belongs

- Current guides usually stay at the repository root.
- `updates/` appears in History as Updates.
- `reports/` appears as Reports.
- `archive/` appears as Archives.
- `ios/` appears as Classified notes.

History is not shown in search unless the reader enables **Include History**.

## New-document example

Create a valid blocked scaffold:

```bash
npm run docs:new -- CACHE_INVALIDATION_GUIDE.md --collection platform-and-data --section core-platform
npm run docs:prepare -- CACHE_INVALIDATION_GUIDE.md --force
```

The source uses a numeric unused order and metadata like this:

```yaml
title: "Cache Invalidation Guide (Technical)"
description: "How NutsNews invalidates cached reader content safely."
wiki:
  source_route: "/technical/cache-invalidation-guide"
  simple_route: "/simple/cache-invalidation-guide"
  slug: "cache-invalidation-guide"
  primary_diagram:
    file: "diagrams/CACHE_INVALIDATION_GUIDE.mmd"
    accTitle: "Cache invalidation flow"
    accDescr: "An operator verifies scope, purges the selected cache, checks the reader response, and rolls back or escalates when verification fails."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 228
  approval:
    state: unreviewed
    publishing: blocked
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: pending
```

Replace every `TODO`. Check the Technical source, Simple article, Technical mirror, diagram, commands, warnings, links, verification, and rollback.

After a human reviews the current bundle:

```bash
npm run docs:approve -- CACHE_INVALIDATION_GUIDE.md --reviewed-by "<human-reviewer>" --confirm-human-review
```

Then run:

```bash
npm run wiki:prepare
npm run validate:content
npm run validate:links
npm run validate:mermaid
npm run test:content-routes
npm run build
```

## When an old approval becomes stale

Changing the original Technical source makes its old approval invalid.

1. Update both audience copies and the diagram.
2. Keep every command, warning, success check, failure step, and rollback.
3. Ask a human to review the current files.
4. Run `docs:approve` again.
5. Rerun all checks. Never edit only the hash or skip a failing gate.

## Diagrams, screenshots, and links

- Every article needs one useful Mermaid diagram with a clear `accTitle` and `accDescr`.
- Use screenshots only when they make a control or visual state easier to find.
- Every image needs useful alt text, a caption, and a local file. Remove secrets and personal data from images.
- Link to original Markdown files with clear link text and exact heading fragments.
- Add useful current guides to [README.md](README.md), and link History records back to the current guide.

## Before publishing

- [ ] Simple and Technical facts match.
- [ ] No command, warning, check, or rollback is missing.
- [ ] Metadata and History placement are valid.
- [ ] Diagram text and any screenshot text are accessible.
- [ ] Human approval is current.
- [ ] Every required command passes.

Documentation-only work may go directly to `main` after validation. Any site-code or mixed change follows the pull-request policy in [AGENTS.md](AGENTS.md).

## Related docs

- [Repository contribution rules](AGENTS.md)
- [GitHub Pages wiki publishing](GITHUB_WIKI_AUTOMATION.md)
- [Documentation index](README.md)
