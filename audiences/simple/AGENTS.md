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
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 27bc875fa80fa0dee4b2d09a3db0f8d90e528904723e025f645d4fc5a485a617
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
