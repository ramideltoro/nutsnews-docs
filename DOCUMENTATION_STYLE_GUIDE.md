---
title: Documentation Style Guide
wiki:
  source_route: /technical/documentation-style-guide/
  simple_route: /simple/documentation-style-guide/
  primary_diagram: diagrams/DOCUMENTATION_STYLE_GUIDE.mmd
  status: active
  collection: start-here
  section: contributing
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: dcdf07eb939f08f4c513f2cc5df5776208e84a67d3bafd8fa1e3feb2c3ef7db3
---

# Documentation Style Guide

Use this guide when adding or updating NutsNews documentation.

---

## Goals

Good docs should help someone quickly answer:

1. What is this?
2. When should I use it?
3. What do I do next?
4. How do I confirm it worked?
5. Where do I go if it fails?

---

## Structure

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

Not every doc needs every section. Keep the useful parts and remove filler.

---

## Wording

Write in plain language.

Prefer:

- “Run this command”
- “Check this dashboard”
- “The Worker saves accepted articles”
- “If this fails, check the logs”

Avoid:

- Long background before the action
- Repeating the same idea in several places
- Dense paragraphs when a table is clearer
- Internal shorthand that future readers may not know

---

## Links

Every important doc should be reachable from [docs/README.md](README.md).

When adding a new doc:

1. Add the file under `docs/`.
2. Add it to the right category in `docs/README.md`.
3. Add related-doc links at the bottom of the new doc when useful.
4. Move one-off update notes to `docs/updates/` or `docs/archive/`.

---

## Naming

Use clear uppercase file names for long-lived docs:

```text
GOOD: DEPLOYMENT_CHECKLIST.md
GOOD: WEB_OFFLINE_E2E_REGRESSION_TEST.md
GOOD: FREE_TIER_GUARDRAILS.md
```

Use archive folders for temporary implementation notes:

```text
docs/updates/
docs/archive/
```

---

## Maintenance Rules

Update docs when a change affects:

- Deployment
- Production operations
- Monitoring
- Database shape
- Worker behavior
- AI provider behavior
- Public user flows
- Admin dashboards
- Regression tests
- Security or dependency routines

Do not leave temporary bundle READMEs in the repository root.
