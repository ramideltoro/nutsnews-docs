---
title: Documentation Style Guide (Simple)
wiki:
  source_route: /technical/documentation-style-guide/
  simple_route: /simple/documentation-style-guide/
  primary_diagram:
    file: diagrams/DOCUMENTATION_STYLE_GUIDE.mmd
    accTitle: "Documentation style guide workflow"
    accDescr: "A flow for writing a doc from audience-first structure to validation and publish."
  status: active
  collection: start-here
  section: contributing
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: dcdf07eb939f08f4c513f2cc5df5776208e84a67d3bafd8fa1e3feb2c3ef7db3
---

# Documentation Style Guide

## Goal

Write docs so a reader can answer five things fast:

1. What is this?
2. When should I use it?
3. What do I do next?
4. How do I confirm it worked?
5. Where should I go if it fails?

## Recommended structure

Use this order for most docs:

```text
# Clear title

One-sentence summary.

## When to use this
## What it covers
## Required setup
## Steps
## Verify
## Troubleshooting
## Related docs
```

You do not need every section in every doc. Use the minimum needed.

## Plain language

Use direct language:

- “Run this command”
- “Check this dashboard”
- “The Worker saves accepted articles”
- “If this fails, check the logs”

Avoid:

- Long background before the action
- Repeating the same idea in multiple places
- Dense paragraphs when a table is clearer
- Internal shorthand your future readers might not know

## Links

Every important doc should be reachable from [README.md](README.md).

When adding a new doc:

1. Add it with the correct repo naming pattern.
2. Put it in the right category in `README.md`.
3. Add related-doc links near the end if useful.
4. Move one-off update notes to `docs/updates/` or `docs/archive/`.

## Naming

Use clear uppercase names for long-lived docs:

- `DEPLOYMENT_CHECKLIST.md`
- `WEB_OFFLINE_E2E_REGRESSION_TEST.md`
- `FREE_TIER_GUARDRAILS.md`

Use archive folders for temporary notes:

- `docs/updates/`
- `docs/archive/`

## Keep docs current

Update docs when changes affect deployment, operations, monitoring, data flows, worker behavior, AI behavior, user flows, regression tests, security, or dependencies.
Move short-lived notes to updates or archive locations.

