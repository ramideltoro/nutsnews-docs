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
    reviewed_on: "2026-07-28T22:39:38.524Z"
    technical_source_hash: 12f023586ae81d7be116edbb0b1bb12a502add3efdd703038a035c22c0ed105b
---

# AGENTS.md (Simple)

## What this repo is

- This repository is the main home for NutsNews documentation.
- The original Technical documents live at the root or in `archive/`, `ios/`, `reports/`, and `updates/`.
- Every original document has a Simple copy, a Technical copy, and a Mermaid diagram in the matching `audiences/` and `diagrams/` paths.

## Which workflow to use

- Documentation-only changes may go directly to `main` after all wiki checks pass.
- Changes to the site, tests, tools, dependencies, configuration, or GitHub Actions need a branch, a normal pull request, passing checks, and explicit approval before merge.
- A change that mixes docs and site code uses the pull-request workflow.

## Keep the complete document set current

- Update the original document, its Simple copy, its Technical copy, and its accessible diagram together.
- A real content change makes the old approval stale. A human must review the current Simple copy and diagram and record a new approval; a bot or AI cannot approve.
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
