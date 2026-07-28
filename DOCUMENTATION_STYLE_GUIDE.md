---
title: Documentation Style Guide
description: How to author equivalent, safe, and accessible Simple and Technical NutsNews Wiki articles.
wiki:
  source_route: /technical/documentation-style-guide/
  simple_route: /simple/documentation-style-guide/
  slug: documentation-style-guide
  primary_diagram:
    file: diagrams/DOCUMENTATION_STYLE_GUIDE.mmd
    accTitle: "Dual-audience wiki authoring flow"
    accDescr: "A canonical Technical source becomes matching Simple and Technical articles plus an accessible diagram, receives current human approval, passes the complete gate, and publishes through the documentation or site-code workflow."
  status: active
  collection: start-here
  section: contributing
  order: 37
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T22:50:31.364Z"
    technical_source_hash: a6928f078a0e14b28290ed7ff6c09ad655ac183e523f80b764d7e51e72793a78
---

# Documentation Style Guide

Use this guide to create or update a complete NutsNews Wiki document bundle without losing facts, commands, cautions, or accessibility.

## Equivalence contract

Every canonical Technical source owns:

- one Simple mirror at `audiences/simple/<source>.md`
- one Technical mirror at `audiences/technical/<source>.md`
- one accessible Mermaid diagram at `diagrams/<source-without-md>.mmd`

The two audience articles may use different wording and detail, but they must agree on observable behavior, prerequisites, values, commands, warnings, verification, failure handling, and rollback. Simple means easier to understand; it never means incomplete or less safe.

### Simple article

- Define specialized terms before using them.
- Prefer short sentences, concrete verbs, numbered actions, and one idea per paragraph.
- Explain why a command or warning matters.
- Preserve exact commands, identifiers, URLs, thresholds, limitations, verification, and rollback.
- Link to the same relevant sources as the Technical article.

### Technical article

- Name components, dependencies, inputs, outputs, defaults, state changes, and ownership precisely.
- Include exact commands and the conditions under which they are safe.
- Describe failure modes, observability, verification, recovery, and rollback.
- Distinguish current behavior from a proposal or historical behavior.

## Canonical paths and History

Current canonical sources live at the repository root. Put time-bounded records in the matching source area:

| Canonical path | History group |
| --- | --- |
| `updates/` | Updates |
| `reports/` | Reports |
| `archive/` | Archives |
| `ios/` | Classified notes |

History pages remain directly browsable. Search excludes them by default until the reader enables **Include History**. Do not move a current operating contract into History merely to avoid updating it.

## Required metadata

New sources use every expert field: `title`, `description`, `slug`, `collection`, `section`, `status`, and `order`. Internal routes omit the trailing slash; published routes add it.

This schema-valid new-document state is intentionally blocked:

```yaml
---
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
---
```

Valid status values are `active`, `draft`, `deprecated`, and `obsolete`. Use only a collection/section pair defined by the wiki contract, and choose an unused numeric order.

## Full new-document path

1. Create the tracked five-file scaffold:

   ```bash
   npm run docs:new -- CACHE_INVALIDATION_GUIDE.md --collection platform-and-data --section core-platform
   ```

2. Replace every Technical `TODO`. Verify claims, commands, links, warnings, current status, verification, and rollback.
3. Prepare the Simple draft and diagram for the new blocked bundle:

   ```bash
   npm run docs:prepare -- CACHE_INVALIDATION_GUIDE.md --force
   ```

4. Reconcile the generated Simple text and Technical mirror with the canonical source. Generation is a draft aid, not approval.
5. Make the Mermaid diagram accurate and accessible. Resolve every item in the adjacent review manifest.
6. Have a human review the current Technical source, both mirrors, and diagram.
7. Record approval only after that review:

   ```bash
   npm run docs:approve -- CACHE_INVALIDATION_GUIDE.md --reviewed-by "<human-reviewer>" --confirm-human-review
   ```

8. Run the complete documentation gate:

   ```bash
   npm run wiki:prepare
   npm run validate:content
   npm run validate:links
   npm run validate:mermaid
   npm run test:content-routes
   npm run build
   ```

9. Follow [AGENTS.md](AGENTS.md): documentation-only changes may go directly to `main` after validation; site-code or mixed changes require a checked and explicitly approved pull request.

## Existing document and stale-review path

A substantive canonical edit invalidates the old hash even if the approval fields still say `approved`.

```bash
npm run wiki:prepare
npm run validate:content
```

The expected failure identifies stale approval. Do not change only the hash or bypass the gate.

1. Update the Simple mirror, Technical mirror, and diagram to match the new source.
2. Preserve every safety-critical fact, command, caution, verification, and rollback.
3. Have a human review the complete current bundle.
4. Run the exact `docs:approve` command for that canonical source.
5. Rerun the complete gate until it passes.

## Safety content that cannot be omitted

| Technical content | Simple equivalent must retain |
| --- | --- |
| Prerequisites and scope | Who may act, what is affected, and what is excluded |
| Exact command or setting | The unchanged command or value plus a plain-language explanation |
| Warning or destructive boundary | The same warning before the risky step |
| Expected result | A concrete success signal |
| Failure handling | Stop conditions, diagnostic location, and escalation |
| Rollback or recovery | The complete safe reversal and post-rollback verification |

Never publish real credentials, local environment values, private contact/payment data, or secret-bearing output. Use placeholders that cannot be mistaken for working secrets.

## Diagrams, screenshots, and accessibility

- Every canonical source has one primary Mermaid diagram with valid `accTitle` and specific `accDescr` text in frontmatter and diagram source.
- The diagram must communicate a useful flow, state change, hierarchy, or relationship; do not add a decorative chart.
- Keep Mermaid local and text-readable. Preserve the text fallback and never use an external diagram CDN.
- Use a screenshot only when a visual state or control location is materially clearer than prose.
- Give each image meaningful alt text, a caption, and a resolvable local asset. Redact secrets, personal data, and irrelevant browser or desktop content.

Schema-valid Markdown image form:

```markdown
![Search dialog with Include History enabled](public/wiki-assets/search-history.png "Search results with History enabled")
```

## Links and discoverability

- Add important current documents to the appropriate section of [README.md](README.md).
- Link to canonical Markdown sources with repository-relative paths. The generator resolves the active audience route.
- Use exact heading fragments and descriptive link text; validate both paths and fragments.
- End substantial guides with a short **Related docs** section when it helps the next action.
- Link a historical record to the current operating contract when one exists.

## Final author check

- [ ] Simple and Technical versions agree on every fact and safety boundary.
- [ ] Metadata, routes, status, collection, section, and order are valid.
- [ ] The accessible diagram is current; screenshots have alt text and captions.
- [ ] Related links and History placement are correct.
- [ ] Approval names a human and matches the current source hash.
- [ ] The complete documentation gate passes before delivery.

## Related docs

- [Repository contribution rules](AGENTS.md)
- [GitHub Pages wiki publishing](GITHUB_WIKI_AUTOMATION.md)
- [Documentation index](README.md)
