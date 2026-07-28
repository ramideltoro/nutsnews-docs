---
title: GitHub Pages Publishing for the NutsNews Wiki (Technical)
wiki:
  source_route: /technical/github-wiki-automation/
  simple_route: /simple/github-wiki-automation/
  primary_diagram:
    file: diagrams/GITHUB_WIKI_AUTOMATION.mmd
    accTitle: "Wiki publish pipeline"
    accDescr: "A flow showing CI checks, optional manual trigger, and publish/deploy handoff to GitHub Pages."
  status: active
  collection: start-here
  section: contributing
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 677dde95bad57c958c952bba026751f4b76411e54ac77e593541f73a108fa640
---

# GitHub Pages publishing for the NutsNews wiki

NutsNews documentation is built and published from this repository to `https://wiki.nutsnews.com` by GitHub Actions.

GitHub Pages builds the site from markdown and serves it from a static artifact; Cloudflare remains DNS-only.

## Source contract

The published set is governed by:

- `.github/workflows/wiki-pages.yml`
- `scripts/wiki/validate-doc-paths.mjs`
- `scripts/wiki/validate-wiki-budgets.mjs`
- `scripts/wiki/validate-wiki-secrets.mjs`
- `_config.yml`
- `index.md`

Generated artifacts and non-doc tooling paths are excluded by ignore policies.

## Publishing controls

1. Push docs to `main` and create a successful commit.
2. CI runs ordered checks:
   - markdown inventory
   - secret-safety scan
   - Jekyll build
   - budget validation
   - Pages artifact upload
3. Environment protection review (if configured for `wiki-pages`).
4. Deploy to Pages from the artifact.

## Manual workflow run

Use GitHub Actions **Run workflow**:

1. Open `wiki-pages` workflow
2. Select branch `main`
3. Execute run

## Validation commands

- `node scripts/wiki/validate-doc-paths.mjs`
- `node scripts/wiki/validate-wiki-budgets.mjs`
- `node scripts/wiki/validate-wiki-secrets.mjs --smoke-test`
- `node scripts/wiki/validate-wiki-secrets.mjs`
- `bundle exec jekyll serve`

## DNS and HTTPS checks

- `CNAME` in Cloudflare/registrar must resolve to the repository Pages domain (example: `ramideltoro.github.io`).
- Repository Pages custom domain and HTTPS status must match.

## Rollback procedure

1. Re-run publish on last verified-good commit.
2. Confirm `https://wiki.nutsnews.com` content.
3. If needed, repoint to prior Pages source as temporary containment and republish.

## Failure analysis checklist

When publish fails, inspect workflow run:

- missing docs or unexpected ignore behavior
- build failure from markdown structure/frontmatter
- workflow permissions (`contents: read`, `pages: write`, `id-token: write`)
- CNAME/DNS mismatch
- artifact/output path mismatch

The publish flow has no runtime OpenAI/API key dependency.

