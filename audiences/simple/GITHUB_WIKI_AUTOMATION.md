---
title: GitHub Pages Publishing for the NutsNews Wiki (Simple)
wiki:
  source_route: /technical/github-wiki-automation/
  simple_route: /simple/github-wiki-automation/
  primary_diagram:
    file: diagrams/GITHUB_WIKI_AUTOMATION.mmd
    accTitle: "Wiki publish pipeline"
    accDescr: "A flow describing doc edits, validation gates, optional manual run, and Pages publish."
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

NutsNews docs are published as the static site at `https://wiki.nutsnews.com`.

The repository is the source of truth. When you edit markdown and push to `main`, the next GitHub Actions run publishes the site update.

## Source contract

- Workflow: `.github/workflows/wiki-pages.yml`
- Published pages: all Markdown files not in excluded paths.
- Exclusions come from `scripts/wiki/validate-doc-paths.mjs` and `.gitignore`.

## What you can edit

- Add, change, or archive markdown docs.
- Update workflow and validation config when needed.

Do not edit:

- Generated Pages HTML (`_site`)
- Deployed pages directly in GitHub Pages

## Publishing process

1. Push approved docs to `main`.
2. CI validates:
   - document inventory
   - secret safety
   - Jekyll build
   - build-size/time/pagefind budgets
   - artifact upload
3. If deployment environment is protected, reviewer approval is required in GitHub Environments.
4. Publish job writes the new site to Pages.

## Manual run

If needed:

1. Open the `wiki-pages` workflow.
2. Run workflow → `main`.

## Local checks

- `node scripts/wiki/validate-doc-paths.mjs`
- `node scripts/wiki/validate-wiki-budgets.mjs`
- `node scripts/wiki/validate-wiki-secrets.mjs --smoke-test`
- `bundle exec jekyll serve`

## DNS and HTTPS

- Set DNS CNAME for `wiki.nutsnews.com` to the Pages hostname (example: `ramideltoro.github.io`).
- Confirm HTTPS is active after DNS propagation.

## Rollback

If publish is wrong:

1. Re-run workflow using the last-good commit.
2. Verify `https://wiki.nutsnews.com` is serving expected pages.
3. If needed, repoint DNS/domain to last-good source briefly and republish.

## Failure checks

If publish fails, inspect workflow logs first:

- inventory script error
- Jekyll frontmatter or markdown parse issue
- permission scope issue (`pages: write`)
- CNAME or DNS mismatch
- publish output path mismatch

No runtime OpenAI key is used for publishing.

