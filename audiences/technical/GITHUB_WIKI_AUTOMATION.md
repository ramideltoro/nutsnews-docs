---
title: GitHub Pages Publishing for the NutsNews Wiki (Technical)
description: The technical preview, validation, deployment, cutover, HTTPS, rollback, and failure contract for the static wiki.
wiki:
  source_route: /technical/github-wiki-automation/
  simple_route: /simple/github-wiki-automation/
  slug: github-wiki-automation
  primary_diagram:
    file: diagrams/GITHUB_WIKI_AUTOMATION.mmd
    accTitle: "Wiki publish pipeline"
    accDescr: "A reviewed wiki change passes quality and exact-commit checks before GitHub Pages deployment. Production cutover then adds one DNS-only CNAME, deploys the root artifact, configures the custom domain, waits for HTTPS, and either passes smoke tests or rolls back."
  status: active
  collection: start-here
  section: contributing
  order: 42
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-29T04:08:08.420Z"
    technical_source_hash: 346276feb40a25072366fbef0bd3b69f54846df6f6ecfc5a60bc3d9a16e8787c
---

# GitHub Pages publishing for the NutsNews wiki

Astro/Starlight and Pagefind build a pure-static site. The pinned `.github/workflows/wiki-pages.yml` publishes only an exact-SHA, inspected `_site/` artifact.

## Targets and paths

The production target is `https://wiki.nutsnews.com/`; `scripts/wiki/wiki-release.json` allowlists that site, base `/`, and mode `production`.

The active contract includes `.github/workflows/wiki-pages.yml`, Astro/Playwright and npm configuration, `scripts/wiki/wiki-release.json`, artifact/budget/secret validators, browser tests, and the tracked `CNAME`. Generated content, `_site/`, reports, caches, and inventory output are not editable sources.

## Merge-triggered documentation

The central `.github/workflows/automated-merge-docs.yml` schedule discovers new merged PRs across every active public `ramideltoro/nutsnews*` repository except `nutsnews-docs`. It batches pending PRs per repository, checks out the exact latest merge, and prepares bounded untrusted evidence.

The pinned Codex Action receives only the OpenAI credential proxy and a writable documentation checkout; it receives no GitHub write token. A deterministic post-agent boundary allows only canonical Markdown, matching Simple/Technical mirrors, review manifests, and Mermaid diagrams. It rejects deletions and ownerless artifacts, records repository/PR/SHA/run/hash provenance, runs the complete gate, advances the cursor, commits, and dispatches Pages. Failure leaves the cursor unchanged and creates or updates an incident. Identical merge batches retry at most three times to bound API spend; a newer merge clears the effective pause by creating a new batch that still includes the earlier pending merges.

## Preview and validation

```bash
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
```

```bash
npm run wiki:prepare
npm run validate:content
npm run validate:links
npm run validate:mermaid
npm run test:content-routes
npm run test:workflow
npm run test:pages-artifact
npm run test:browser
npm run build
```

Pre-cutover artifact reproduction:

```bash
WIKI_SITE_URL=https://ramideltoro.github.io WIKI_BASE_PATH=/nutsnews-docs npm run build
npm run wiki:release:stamp -- --sha="$(git rev-parse HEAD)"
WIKI_SITE_URL=https://ramideltoro.github.io WIKI_BASE_PATH=/nutsnews-docs npm run validate:pages-artifact -- --sha="$(git rev-parse HEAD)"
```

## Actions dependency chain

Pull requests run quality only. Relevant `main` pushes and manual runs execute:

1. full source/fixture/build/browser validation
2. `validated_sha` output
3. exact-SHA checkout and verification
4. allowlisted site/base build
5. release stamp
6. budget and final artifact inspection
7. pinned Pages artifact upload
8. `main`-restricted Pages deployment

Concurrency cancels superseded same-ref runs. Global permission is `contents: read`; only deploy receives `pages: write` and `id-token: write`. The Pages workflow consumes no OpenAI key; only the isolated merge-documentation workflow does.

## Production launch

1. Complete all platform and local launch gates against the default URL.
2. Prepare a checked site-code PR changing the workflow, release manifest, artifact validator, and tests from project Pages to `https://wiki.nutsnews.com/` at base `/`.
3. Add or update only Cloudflare DNS-only `CNAME wiki → ramideltoro.github.io`; do not touch other records.
4. Merge the validated target PR and wait for the root artifact deployment.
5. Configure repository Pages custom domain `wiki.nutsnews.com`.
6. Wait for certificate approval, enable HTTPS enforcement, and run production smoke tests.

The smoke covers `release.json`, root resolution, Simple and Technical representative/nested routes, Pagefind and History, Mermaid/fullscreen, 404, assets, and HTTPS behavior.

## Rollback

### Rollback verification contract

Record the last-good commit SHA before changing the deployment. Verify `https://wiki.nutsnews.com` serves that release after a production rollback and smoke both audiences; after a cutover fallback, verify the default project URL.

For a bad release, revert or rerun the stamped last-good production commit, require the full chain, and verify routes.

For cutover failure, deploy the last pre-cutover `/nutsnews-docs` commit first, remove the Pages custom domain, verify the default URL, then remove or repair only the `wiki` CNAME if necessary. Do not modify other DNS records.

## Failure analysis

- Quality: approval, inventory, mirror, diagram, link, secret fixture, axe, visual
- Build: missing/mismatched ready SHA, site/base, Astro, Pagefind, budget
- Artifact: wrong stamp, source/env/secret/hidden/symlink/CNAME file, missing route
- Deploy: environment branch policy, Pages status, permissions, artifact
- Domain: DNS-only CNAME, custom-domain setting, certificate, HTTPS

Repair the source of failure and rerun. Deployed HTML is immutable output. `.wiki-build`, `wiki-push`, Jekyll, and bundle commands are obsolete and must not appear in the workflow.
