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
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 27bc875fa80fa0dee4b2d09a3db0f8d90e528904723e025f645d4fc5a485a617
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
