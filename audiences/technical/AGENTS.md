---
title: AGENTS.md (Technical)
wiki:
  source_route: /technical/agents/
  simple_route: /simple/agents/
  primary_diagram: diagrams/AGENTS.mmd
  status: active
  collection: start-here
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 5f8e8d6ce9d9ebfef4f1bd6f4f9d9f3b8e4b5db3
---

# AGENTS.md (Technical)

## Purpose

- Document the contribution contract for this repository.
- Define which changes are documentation-only and which need review gates.
- Preserve the safety posture for deployment and secrets.

## Technical source of truth

- `AGENTS.md` is the authoritative technical source for this document set.
- Simple audience variants should preserve all required facts and safety constraints.

## Contribution checks

- Run static wiki checks before merging:
  - `node scripts/wiki/validate-doc-paths.mjs`
  - `node scripts/wiki/validate-wiki-budgets.mjs`
  - `node scripts/wiki/validate-wiki-secrets.mjs`
- Ensure no external Mermaid/Pagefind CDN references are introduced.
- Keep route and collection metadata synchronized with `/simple/AGENTS.md`.

## Operational constraints

- Do not modify application runtime files in this repository.
- Keep generated build and cache artifacts excluded by `.gitignore`.
- Preserve commands, commands’ intent, and recovery instructions when editing existing operational docs.

## Approval metadata

- Keep this article manually reviewed after each meaningful change.
- Update `approval.reviewed_by`, `approval.reviewed_on`, and the technical source hash when the content is refreshed.
