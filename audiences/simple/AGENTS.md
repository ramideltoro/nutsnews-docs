---
title: AGENTS.md (Simple)
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

# AGENTS.md (Simple)

## What this repo is

- This repository is the main home for NutsNews documentation.
- The original Technical documents live at the root or in `archive/`, `ios/`, `reports/`, and `updates/`.
- Every original document has a Simple copy, a Technical copy, and a Mermaid diagram in the matching `audiences/` and `diagrams/` paths.

## Which workflow to use

- Documentation-only changes may go directly to `main` after all wiki checks pass.
- The protected merge-documentation workflow may automatically publish a complete documentation-only update after a NutsNews pull request is merged and every safety check passes.
- Changes to the site, tests, tools, dependencies, configuration, or GitHub Actions need a branch, a normal pull request, passing checks, and explicit approval before merge.
- A change that mixes docs and site code uses the pull-request workflow.

## Keep the complete document set current

- Update the original document, its Simple copy, its Technical copy, and its accessible diagram together.
- A real content change makes the old approval stale. Normal authoring requires human review. The merge workflow is the only automatic exception: Codex drafts the bundle without write access, then trusted checks record the repository, PR, merge commit, workflow run, and source hash.
- Codex cannot commit, push, or change workflows. Any unrelated file change blocks publication.
- Do not edit generated site files, test output, caches, or the generated inventory.

## Exact commands

For a new document:

```bash
npm run docs:new -- <canonical-source.md> --collection <collection> --section <section>
npm run docs:prepare -- <canonical-source.md> --force
```

Use `--force` only for the blocked bundle just created by `docs:new`, not to replace unrelated existing work.

After human review:

```bash
npm run docs:approve -- <canonical-source.md> --reviewed-by "<human-reviewer>" --confirm-human-review
```

The separate `docs:auto-approve` command belongs only to the trusted merge workflow and is not a shortcut for manual work.

Before a documentation-only commit:

```bash
npm run wiki:prepare
npm run validate:content
npm run validate:links
npm run validate:mermaid
npm run test:content-routes
npm run build
```

Keep secrets and local environment files out of documents and generated artifacts. Preserve unrelated work and every existing safety boundary.
