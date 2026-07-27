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
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: pending
  slug: agents
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
- PRs touching non-documentation assets in this repo still require standard review workflow unless explicitly overridden.
- Reviewers should confirm that hidden operations and safety boundaries are still preserved after edits.

## Wiki workflow gates

- Validate markdown inventory (`node scripts/wiki/validate-doc-paths.mjs`).
- Validate wiki contracts (`node scripts/wiki/validate-wiki-contracts.mjs`).
- Validate secret safety (`node scripts/wiki/validate-wiki-secrets.mjs`).
- Build and validate the static site (`npm run build`).

## Safety notes

- Treat this file as a contribution contract only; runtime secrets stay in GitHub Actions variables/secrets or secure runner inputs.
- If a required instruction changes, update this article first and run full validation.
