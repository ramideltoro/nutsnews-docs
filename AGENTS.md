---
title: AGENTS.md (Technical)
description: NutsNews repository-wide contribution contract for documentation.
wiki:
  source_route: /technical/agents/
  simple_route: /simple/agents/
  primary_diagram: diagrams/AGENTS.mmd
  collection: start-here
  section: start-here
  status: active
  order: 0
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T22:39:38.524Z"
    technical_source_hash: 12f023586ae81d7be116edbb0b1bb12a502add3efdd703038a035c22c0ed105b
  slug: agents
---

# AGENTS.md (Technical)

## Audience

This technical article is for engineers, platform operators, and maintainers who execute repository changes.

## What this repository is for

- This repository is the canonical source for NutsNews product, operations, deployment, cache, automation, environment, architecture, runbook, and cross-repo documentation.
- The repository is owned by the NutsNews wiki and operations program.

## Path ownership

- Canonical Technical sources live at the repository root or under `archive/`, `ios/`, `reports/`, and `updates/`.
- Each canonical `<source>.md` owns exactly three tracked companions: `audiences/simple/<source>.md`, `audiences/technical/<source>.md`, and `diagrams/<source-without-md>.mmd`.
- Site code and platform tooling live in `src/`, `scripts/wiki/`, `tests/wiki/`, `.github/workflows/`, `astro.config.mjs`, `playwright.config.mjs`, and the npm manifests.
- `src/content/docs/`, `_site/`, test results, reports, caches, and the generated inventory are build outputs. Do not edit or commit them.

## Change policy

- A documentation-only change may be validated, committed, and pushed directly to `main` under repository policy.
- A site-code, tooling, test, dependency, configuration, or workflow change requires a branch, a normal ready-to-merge pull request, passing checks, and explicit merge approval.
- A mixed documentation and site-code change follows the pull-request policy.
- Preserve existing work and operational boundaries unless the task explicitly supersedes them.

## Required document bundle

- The canonical source is authoritative, but its Simple mirror, Technical mirror, and accessible Mermaid diagram must all describe the current source.
- A meaningful Technical source edit makes the prior approval stale. Publication requires a human-reviewed Simple mirror and a current approval hash; automation, bots, and model identities cannot approve.
- Never remove or bypass approval, diagram, inventory, link, route, accessibility, secret, or build gates to publish a change.

## Exact commands

For a new canonical document:

```bash
npm run docs:new -- <canonical-source.md> --collection <collection> --section <section>
npm run docs:prepare -- <canonical-source.md> --force
```

The `--force` form is the intentional next step for the blocked bundle just created by `docs:new`; do not use it to overwrite an unrelated existing bundle.

After a human reviews the Technical source, Simple mirror, Technical mirror, and diagram:

```bash
npm run docs:approve -- <canonical-source.md> --reviewed-by "<human-reviewer>" --confirm-human-review
```

Before committing any documentation-only update:

```bash
npm run wiki:prepare
npm run validate:content
npm run validate:links
npm run validate:mermaid
npm run test:content-routes
npm run build
```

## Safety notes

- Do not put credentials, secrets, temporary secrets, or local environment files in sources, mirrors, diagrams, logs, or artifacts.
- Use `.gitignore` and the wiki tooling for generated files. Do not discard unrelated work or use destructive Git cleanup.
- If this contract changes, update this canonical source, both audience mirrors, and its diagram together, then obtain current human approval.
