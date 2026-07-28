---
title: Documentation Style Guide (Technical)
wiki:
  source_route: /technical/documentation-style-guide/
  simple_route: /simple/documentation-style-guide/
  primary_diagram:
    file: diagrams/DOCUMENTATION_STYLE_GUIDE.mmd
    accTitle: "Documentation style guide workflow"
    accDescr: "A workflow showing drafting order, terminology standardization, validation, and approval steps."
  status: active
  collection: start-here
  section: contributing
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: a9d8c4fd61750c18f8c0aa3c0cc7de13b12a7758965798725db299fb1aa1caa6
---

# Documentation Style Guide

## Purpose

Provide a standard contract for adding and updating repository documentation so readers can execute safely and quickly.

## Core goal

Each document should answer:

1. What is this?
2. When to use it?
3. What are the required actions?
4. How to verify success?
5. Where to go if it fails?

## Preferred structure

Recommended section order:

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

Optional sections are allowed when they do not add noise.

## Language constraints

Use imperative, reader-first language:

- “Run this command”
- “Check this dashboard”
- “This component persists accepted articles”
- “If this fails, review log source X”

Avoid:

- Excessive context before required action
- Duplicate statements across adjacent sections
- Dense prose when a table or short list is clearer
- Unvetted team abbreviations without definitions

## Doc discoverability

Important docs should be discoverable from [README.md](README.md). For each new document:

1. Add to the correct category in `README.md`.
2. Add related cross-links near the end.
3. Move ephemeral notes into `docs/updates/` or `docs/archive/`.

## Naming conventions

Use stable uppercase snake-case for durable documents:

- `DEPLOYMENT_CHECKLIST.md`
- `WEB_OFFLINE_E2E_REGRESSION_TEST.md`
- `FREE_TIER_GUARDRAILS.md`

Place temporary operational notes in archive locations.

## Lifecycle maintenance

Update this document when any downstream behavior changes:

- deployment mechanics
- operations and support procedures
- monitoring and runbooks
- database contracts
- worker behavior
- AI behavior and retry policies
- public user journeys
- regression checks
- security boundaries and dependencies

