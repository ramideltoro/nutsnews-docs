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

## Audience

This technical article is for engineers, platform operators, and maintainers who execute repository changes.

## What this repository is for

- This repository is the canonical source for NutsNews product, operations, deployment, cache, automation, environment, architecture, runbook, and cross-repo documentation.
- The repository is owned by the NutsNews wiki and operations program.

## Core constraints

- Keep documentation-only updates in this repository; avoid unrelated application/runtime changes.
- Preserve existing repo structure and place updates in the best existing location.
- Documented behaviors should be specific and actionable for implementation.
- Do not include credentials, secrets, or temporary secrets in markdown files.
- Use the ignore and validation patterns from `.gitignore` and wiki tooling when generating artifacts.

## Collaboration contract

- Changes must preserve prior work unless explicitly superseded.
- PRs touching non-documentation assets in this repo still require a normal review workflow unless explicitly overridden.
- Reviewers should confirm that hidden operations and safety boundaries are still preserved after edits.

## GitHub Pages workflow gates (current)

- **Inventory validation** (`scripts/wiki/validate-doc-paths.mjs`)
- **Secret safety checks** (`scripts/wiki/validate-wiki-secrets.mjs`)
- **Jekyll build**
- **Artifact budget checks** (`scripts/wiki/validate-wiki-budgets.mjs`)

## Release behavior

- When only docs change, prefer low-friction change paths and coordinate with downstream deployment expectations.
- Keep branch history reviewable by grouping logically related documentation edits.

## Safety notes

- Treat this file as a contribution contract only; runtime secrets stay in GitHub Actions variables/secrets or secure runner inputs.
- If a required instruction changes, update this article first and run full validation.
