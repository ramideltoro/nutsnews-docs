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
    reviewed_on: "2026-07-28T23:05:55.928Z"
    technical_source_hash: a08bcae6eae07cf2afe5dcfd32c4021a2c8f12014da8d5a458f34966b964494e
---

# GitHub Pages publishing for the NutsNews wiki

Astro/Starlight and Pagefind build a pure-static site. The pinned `.github/workflows/wiki-pages.yml` publishes only an exact-SHA, inspected `_site/` artifact.

## Targets and paths

The current pre-cutover target is `https://ramideltoro.github.io/nutsnews-docs/`; `scripts/wiki/wiki-release.json` allowlists site `https://ramideltoro.github.io`, base `/nutsnews-docs`, and mode `pre-cutover`. Production will use `https://wiki.nutsnews.com/` at base `/`.

The active contract includes `.github/workflows/wiki-pages.yml`, Astro/Playwright and npm configuration, `scripts/wiki/wiki-release.json`, artifact/budget/secret validators, browser tests, and the tracked `CNAME`. Generated content, `_site/`, reports, caches, and inventory output are not editable sources.

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

Concurrency cancels superseded same-ref runs. Global permission is `contents: read`; only deploy receives `pages: write` and `id-token: write`. No repository secret or OpenAI key is consumed.

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
