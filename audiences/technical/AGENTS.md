---
title: AGENTS.md (Technical)
wiki:
  source_route: /technical/agents/
  simple_route: /simple/agents/
  primary_diagram: diagrams/AGENTS.mmd
  status: active
  collection: start-here
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T22:39:38.524Z"
    technical_source_hash: 12f023586ae81d7be116edbb0b1bb12a502add3efdd703038a035c22c0ed105b
---

# AGENTS.md (Technical)

## Purpose

- Define repository path ownership, contribution boundaries, approval rules, and exact validation commands.
- Preserve the direct-main policy for documentation-only work and the pull-request policy for site-code work.

## Path ownership

- `AGENTS.md` is authoritative.
- Canonical sources live at the root or in `archive/`, `ios/`, `reports/`, and `updates/`.
- Each source owns `audiences/simple/<source>.md`, `audiences/technical/<source>.md`, and `diagrams/<source-without-md>.mmd`.
- `src/`, `scripts/wiki/`, `tests/wiki/`, `.github/workflows/`, Astro/Playwright configuration, and npm manifests are site-code or platform paths.
- Generated content, `_site/`, reports, caches, and the generated inventory are outputs, not editable sources.

## Contribution boundary

- Documentation-only changes may be validated and pushed directly to `main`.
- Site-code, tooling, test, dependency, configuration, workflow, and mixed changes require a branch, a ready pull request, passing checks, and explicit merge approval.
- Preserve existing work and operational boundaries unless explicitly superseded.

## Approval and diagram gate

- Keep the canonical source, both audience mirrors, and accessible Mermaid diagram current together.
- A substantive source edit invalidates the old hash. A human must review the current Simple mirror and diagram before running:

```bash
npm run docs:approve -- <canonical-source.md> --reviewed-by "<human-reviewer>" --confirm-human-review
```

Generator, bot, model, pending, stale, or missing approval cannot publish.

## Exact commands

```bash
npm run docs:new -- <canonical-source.md> --collection <collection> --section <section>
npm run docs:prepare -- <canonical-source.md> --force
npm run wiki:prepare
npm run validate:content
npm run validate:links
npm run validate:mermaid
npm run test:content-routes
npm run build
```

The `--force` preparation command is only for the blocked bundle created by `docs:new`.

Do not commit credentials, local environment files, generated content, build output, reports, or caches. Never bypass a failing publication gate.
