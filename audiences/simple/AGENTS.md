---
title: AGENTS.md (Simple)
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

# AGENTS.md (Simple)

## What this repo is

- This is the main place for NutsNews docs (product, operations, deployment, and platform documentation).
- If you are updating docs, keep updates in this repo and avoid changing app code here.

## What you should do

- Keep your edits focused and specific.
- Preserve links, code snippets, and safety instructions when you move or rewrite docs.
- Use the right folders so readers can still find the same docs they expect.
- Keep secrets and temporary credentials out of markdown.

## How docs updates move through wiki publishing

- The wiki checks markdown inventory and secret-safety.
- It also checks build size, build time, Pagefind output, and external CDN references for Mermaid/Pagefind assets.
- If checks fail, fix the file and rerun checks before opening/continuing changes.

## If you are unsure

- Pause and get a reviewer when a change affects protected workflows, secret handling, or deploy gates.
- Keep only real docs in the repo; move generated artifacts and runtime files into ignored paths.
