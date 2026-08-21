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

## Isolated Git Workflow and Cleanup

- Before changing files, fetch the latest remote default branch and create a new task-specific branch in a disposable clone or isolated `git worktree`. Never make task changes in a shared checkout or directly on `main` or `master`.
- Use a fresh branch, worktree, and directory for every task. Do not reuse a prior task's branch or checkout.
- Keep the task checkout isolated from unrelated repositories and user work. Preserve all pre-existing changes.
- After the work is safely committed and pushed, the pull request is opened or merged as required, and validation results are recorded, remove the disposable local checkout to avoid consuming disk space.
- For a disposable clone, verify `git status --short` is clean and all required commits exist on the remote, then delete only that exact clone directory. For a worktree, run `git worktree remove <exact-path>` from the owning repository and then `git worktree prune`.
- Delete the local task branch only after confirming it is merged or no longer needed and no unpushed commits remain.
- Never delete a shared or canonical clone, the current working directory, an unverified path, or a checkout containing uncommitted, untracked, unpushed, or unrelated work. If cleanup cannot be proven safe, stop and report the exact path and blocker instead of deleting it.
