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
    reviewed_on: "2026-07-29T04:08:08.086Z"
    technical_source_hash: 96e85d5e0b029d83352b5c00319b3e3d1060bd23901701fc5de6d67e7c3c73af
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
- `.github/workflows/automated-merge-docs.yml` may publish merge-sourced documentation directly only after its fixed path boundary, immutable provenance, full content, and build gates pass.
- Site-code, tooling, test, dependency, configuration, workflow, and mixed changes require a branch, a ready pull request, passing checks, and explicit merge approval.
- Preserve existing work and operational boundaries unless explicitly superseded.

## Approval and diagram gate

- Keep the canonical source, both audience mirrors, and accessible Mermaid diagram current together.
- A substantive source edit invalidates the old hash. A human must review the current Simple mirror and diagram before running:

```bash
npm run docs:approve -- <canonical-source.md> --reviewed-by "<human-reviewer>" --confirm-human-review
```

Manual generator, pending, stale, or missing approval cannot publish. The merge workflow may use the distinct `automated` state only with repository, pull-request, merge-SHA, workflow-run, and current-source-hash provenance. Codex receives no GitHub write token; deterministic post-agent steps approve, validate, and publish.

`docs:auto-approve` is workflow-internal and must not replace `docs:approve` for ordinary authoring.

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
