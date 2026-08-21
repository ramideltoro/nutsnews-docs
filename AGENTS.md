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
    reviewed_on: "2026-07-29T04:08:08.086Z"
    technical_source_hash: 96e85d5e0b029d83352b5c00319b3e3d1060bd23901701fc5de6d67e7c3c73af
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
- The pinned `automated-merge-docs` workflow is the only bot exception: it may publish a complete documentation-only bundle for an already-merged NutsNews pull request after provenance, path-boundary, content, link, Mermaid, secret, and build gates pass.
- A site-code, tooling, test, dependency, configuration, or workflow change requires a branch, a normal ready-to-merge pull request, passing checks, and explicit merge approval.
- A mixed documentation and site-code change follows the pull-request policy.
- Preserve existing work and operational boundaries unless the task explicitly supersedes them.

## Required document bundle

- The canonical source is authoritative, but its Simple mirror, Technical mirror, and accessible Mermaid diagram must all describe the current source.
- A meaningful Technical source edit makes the prior approval stale. Manual publication requires human review. Merge-triggered publication may instead use `state: automated` only when the trusted workflow records the source repository, every merged PR, the merge SHA, workflow run, and current Technical-source hash after Codex exits.
- Codex cannot grant itself write access, commit, push, or bypass a gate. The post-agent workflow rejects prohibited paths and records automated provenance deterministically.
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

`docs:auto-approve` is reserved for `.github/workflows/automated-merge-docs.yml`. Do not run it as a substitute for human review during normal authoring.

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
- If this contract changes manually, update this canonical source, both audience mirrors, and its diagram together, then obtain current human approval.

## Isolated Git Workflow and Cleanup

- Before changing files, fetch the latest remote default branch and create a new task-specific branch in a disposable clone or isolated `git worktree`. Never make task changes in a shared checkout or directly on `main` or `master`.
- Use a fresh branch, worktree, and directory for every task. Do not reuse a prior task's branch or checkout.
- Keep the task checkout isolated from unrelated repositories and user work. Preserve all pre-existing changes.
- After the work is safely committed and pushed, the pull request is opened or merged as required, and validation results are recorded, remove the disposable local checkout to avoid consuming disk space.
- For a disposable clone, verify `git status --short` is clean and all required commits exist on the remote, then delete only that exact clone directory. For a worktree, run `git worktree remove <exact-path>` from the owning repository and then `git worktree prune`.
- Delete the local task branch only after confirming it is merged or no longer needed and no unpushed commits remain.
- Never delete a shared or canonical clone, the current working directory, an unverified path, or a checkout containing uncommitted, untracked, unpushed, or unrelated work. If cleanup cannot be proven safe, stop and report the exact path and blocker instead of deleting it.
