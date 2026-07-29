---
title: Documentation Style Guide (Technical)
description: The technical contract for equivalent, safe, and accessible dual-audience wiki articles.
wiki:
  source_route: /technical/documentation-style-guide/
  simple_route: /simple/documentation-style-guide/
  slug: documentation-style-guide
  primary_diagram:
    file: diagrams/DOCUMENTATION_STYLE_GUIDE.mmd
    accTitle: "Documentation style guide workflow"
    accDescr: "A workflow showing drafting order, terminology standardization, validation, and approval steps."
  status: active
  collection: start-here
  section: contributing
  order: 37
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-29T04:08:08.257Z"
    technical_source_hash: 01c303443caa804a613dfd40492fd1ec3bb179e7a2bc836af1ca3869105696b0
---

# Documentation Style Guide

## Authoring invariant

The canonical source, Simple mirror, Technical mirror, and primary Mermaid diagram form one review unit. Audience wording may differ, but facts, inputs, outputs, commands, cautions, success signals, failure handling, and rollback must remain equivalent.

Simple content defines terms and explains intent. Technical content names implementation detail, ownership, dependencies, defaults, state transitions, observability, and recovery precisely. Neither audience may omit a safety boundary.

## Metadata contract

New sources include `title`, `description`, `slug`, `collection`, `section`, `status`, and a unique numeric `order`. Explicit internal routes omit trailing slashes.

```yaml
title: "Cache Invalidation Guide (Technical)"
description: "How NutsNews invalidates cached reader content safely."
wiki:
  source_route: "/technical/cache-invalidation-guide"
  simple_route: "/simple/cache-invalidation-guide"
  slug: "cache-invalidation-guide"
  primary_diagram:
    file: "diagrams/CACHE_INVALIDATION_GUIDE.mmd"
    accTitle: "Cache invalidation flow"
    accDescr: "An operator verifies scope, purges the selected cache, checks the reader response, and rolls back or escalates when verification fails."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 228
  approval:
    state: unreviewed
    publishing: blocked
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: pending
```

Valid statuses are `active`, `draft`, `deprecated`, and `obsolete`. The collection/section pair must exist in the executable contract.

## Full author path

```bash
npm run docs:new -- CACHE_INVALIDATION_GUIDE.md --collection platform-and-data --section core-platform
npm run docs:prepare -- CACHE_INVALIDATION_GUIDE.md --force
```

Replace all scaffold markers. Verify implementation claims, links, commands, warnings, status, observability, failure behavior, and rollback. Reconcile both mirrors and the diagram; generation never grants approval.

For manual work, after a human reviews the current complete bundle:

```bash
npm run docs:approve -- CACHE_INVALIDATION_GUIDE.md --reviewed-by "<human-reviewer>" --confirm-human-review
```

Run the publication contract:

```bash
npm run wiki:prepare
npm run validate:content
npm run validate:links
npm run validate:mermaid
npm run test:content-routes
npm run build
```

Documentation-only delivery may go directly to `main` after validation. Site-code and mixed changes require a checked, explicitly approved pull request under [AGENTS.md](AGENTS.md).

The merge-documentation workflow is the only automated approval path. Codex receives no GitHub write token. Deterministic post-agent code enforces allowed documentation paths, writes immutable repository/PR/SHA/run/hash provenance, and runs the complete publication contract. `docs:auto-approve` is workflow-internal.

## Stale approval

Any substantive canonical edit invalidates the stored Technical-source hash. The correct remediation is:

1. update both audience mirrors and the diagram
2. preserve all facts and safety controls
3. obtain human review of the current bundle for manual work
4. rerun `docs:approve`, or allow the trusted merge workflow to record its distinct automated provenance
5. rerun the complete gate

Never edit only the hash or weaken validation.

## Visual and accessibility contract

- Provide one primary Mermaid diagram with accurate `accTitle` and `accDescr`.
- Use diagrams for meaningful sequence, state, dependency, hierarchy, or mapping—not decoration.
- Keep Mermaid local, renderable, and understandable through the text fallback.
- Use screenshots only for materially useful visual state. Require meaningful alt text, a caption, a resolvable local asset, and redaction of secrets or personal data.

## Links and History

- Use repository-relative canonical Markdown links and exact heading fragments.
- Add important current guides to [README.md](README.md) and a focused **Related docs** section.
- `updates/`, `reports/`, `archive/`, and `ios/` map to the four History groups. Search excludes History by default.
- Link historical evidence to the current operating contract; do not misclassify current instructions as History.

## Safety review

- [ ] Prerequisites, scope, exact commands, warnings, success signals, diagnostics, and rollback match across audiences.
- [ ] Metadata, paths, routes, order, status, links, and History placement match the contract.
- [ ] Diagram accessibility and screenshot alt/caption rules pass.
- [ ] Approval is current human review or valid trusted merge provenance and matches the current source hash.
- [ ] No credentials, local environment values, private data, or secret-bearing output is present.
- [ ] Every publication command passes.

## Related docs

- [Repository contribution rules](AGENTS.md)
- [GitHub Pages wiki publishing](GITHUB_WIKI_AUTOMATION.md)
- [Documentation index](README.md)
