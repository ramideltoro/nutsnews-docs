---
title: GitHub Pages Publishing for the NutsNews Wiki
description: Preview, validate, stage, launch, verify, and roll back the static NutsNews Wiki on GitHub Pages.
wiki:
  source_route: /technical/github-wiki-automation/
  simple_route: /simple/github-wiki-automation/
  slug: github-wiki-automation
  primary_diagram:
    file: diagrams/GITHUB_WIKI_AUTOMATION.mmd
    accTitle: "Gated GitHub Pages publishing flow"
    accDescr: "A reviewed wiki bundle passes source, build, browser, exact-commit, and artifact-safety gates before default-URL deployment. Production cutover then adds one DNS-only CNAME, deploys the root artifact, configures the custom domain, waits for HTTPS, and runs public smoke tests."
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

The repository is the source of truth. Astro/Starlight builds a pure-static artifact, Pagefind indexes it, and the pinned `.github/workflows/wiki-pages.yml` workflow deploys it to GitHub Pages.

## Current pre-cutover state

- Default HTTPS URL: `https://ramideltoro.github.io/nutsnews-docs/`
- Release target: `pre-cutover` in `scripts/wiki/wiki-release.json`
- Build site/base: `https://ramideltoro.github.io` and `/nutsnews-docs`
- Pages custom domain: not set until the production cutover
- Production destination: `https://wiki.nutsnews.com/`

The tracked root `CNAME` records the intended hostname, but the pre-cutover artifact must not contain a `CNAME` file or claim the custom domain.

## Owned paths

The publishing contract is implemented by:

- `.github/workflows/wiki-pages.yml`
- `astro.config.mjs`
- `playwright.config.mjs`
- `package.json` and `package-lock.json`
- `scripts/wiki/wiki-release.json`
- `scripts/wiki/validate-pages-artifact.mjs`
- `scripts/wiki/validate-wiki-budgets.mjs`
- `scripts/wiki/validate-wiki-secrets.mjs`
- `tests/wiki/reader-journeys.spec.mjs`
- `CNAME`

Canonical Markdown, Simple/Technical mirrors, diagrams, and approval metadata are sources. `src/content/docs/`, `_site/`, `playwright-report/`, `test-results/`, caches, and the generated inventory are outputs; do not edit or commit them.

## Local preview

Install the locked dependencies:

```bash
npm ci
```

For an authoring preview:

```bash
npm run dev -- --host 127.0.0.1 --port 4321
```

For a root-form production preview:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
```

For the actual pre-cutover project-path artifact:

```bash
WIKI_SITE_URL=https://ramideltoro.github.io WIKI_BASE_PATH=/nutsnews-docs npm run build
npm run wiki:release:stamp -- --sha="$(git rev-parse HEAD)"
WIKI_SITE_URL=https://ramideltoro.github.io WIKI_BASE_PATH=/nutsnews-docs npm run validate:pages-artifact -- --sha="$(git rev-parse HEAD)"
npm run preview -- --host 127.0.0.1 --port 4321
```

Open `http://127.0.0.1:4321/nutsnews-docs/` for that project-path preview.

## Local validation

Run these commands from the repository root:

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

The complete content gate checks all 227 canonical sources, both 227-file mirror sets, current human approvals, 227 accessible diagrams, unique routes/orders, links/fragments, images, and orphans. Broken fixtures must exit nonzero.

## GitHub Actions order

The workflow runs for every pull request, relevant push to `main`, and manual `workflow_dispatch`. Superseded runs on the same ref cancel. Every GitHub-authored Action is pinned to a full release SHA.

### Pull request

Only the quality job runs. It installs with `npm ci`, exercises authoring and broken fixtures, validates source/content/link/secret/Mermaid contracts, builds the root-form site, enforces budgets, validates built surfaces, and runs the three-viewport Playwright/axe/visual suite. A passing PR does not deploy.

### Push or manual run on `main`

1. The quality job completes and emits `validated_sha` only after every gate passes.
2. The build job depends on that output, checks out the exact SHA, and verifies both `GITHUB_SHA` and `git rev-parse HEAD`.
3. Astro builds with the allowlisted site/base for the current release target.
4. `release.json` is stamped with the exact validated SHA.
5. Budgets and `validate:pages-artifact` inspect the final upload directory.
6. The pinned Pages artifact Action uploads `_site/`.
7. The deploy job, restricted to `main` by the `github-pages` environment, deploys that artifact.

Global token access is `contents: read`. Only the deploy job has `pages: write` and `id-token: write`. Publishing consumes no repository secret and no OpenAI key; the mocked drafting test receives an empty key. Failure-only browser artifacts contain only the two Playwright output directories, exclude hidden files, and expire after seven days.

## Launch gate and production cutover

Do not start the cutover until all platform issues and local launch QA are complete and the default URL passes public smoke tests.

1. Prepare a normal site-code pull request that changes the release target from project Pages to production root:
   - `.github/workflows/wiki-pages.yml`: `WIKI_SITE_URL=https://wiki.nutsnews.com`, `WIKI_BASE_PATH=/`
   - `scripts/wiki/wiki-release.json`: mode `production`, site URL `https://wiki.nutsnews.com`, base `/`, public URL `https://wiki.nutsnews.com/`
   - `scripts/wiki/validate-pages-artifact.mjs` and its tests: accept and enforce the production target
2. Validate that pull request completely, but do not merge it yet.
3. In Cloudflare, add or update only this DNS record:

   | Type | Name | Target | Proxy |
   | --- | --- | --- | --- |
   | CNAME | `wiki` | `ramideltoro.github.io` | DNS only |

   Do not add, delete, or modify any other DNS record.
4. Merge the validated production-target pull request. Wait for its root-form Pages artifact to deploy successfully.
5. In repository **Settings → Pages**, set the custom domain to `wiki.nutsnews.com`. Do not change the Actions build source.
6. Wait for GitHub Pages to approve the certificate, then enable **Enforce HTTPS**.
7. Verify DNS, HTTPS, the exact release stamp, root routing, both audiences, search/History, diagrams, 404, and representative nested pages before declaring launch complete.

Useful read-only checks:

```bash
dig +short CNAME wiki.nutsnews.com
curl --fail --location --silent --show-error https://wiki.nutsnews.com/release.json
curl --fail --location --silent --show-error --output /dev/null https://wiki.nutsnews.com/simple/project/
curl --fail --location --silent --show-error --output /dev/null https://wiki.nutsnews.com/technical/project/
```

## Rollback

### Rollback verification contract

Record the last-good commit SHA before either rollback path. Verify `https://wiki.nutsnews.com` serves that stamped SHA after a production rollback and smoke both audiences; after a cutover fallback, verify the default project URL instead.

### Bad content or site release

1. Identify the last successful production run and its stamped commit.
2. Revert the bad commit on `main` through the contribution workflow that applies to the changed paths, or rerun the last known-good workflow run.
3. Require quality, exact-SHA, artifact, and deploy jobs to pass.
4. Confirm `release.json` reports the intended commit, then smoke both audiences and the affected routes.

### Failed custom-domain cutover

1. Redeploy the last successful pre-cutover commit so the artifact again uses `/nutsnews-docs`.
2. Remove the repository Pages custom domain and verify `https://ramideltoro.github.io/nutsnews-docs/`.
3. Remove or correct only the `wiki` CNAME if DNS itself caused the failure; leave every other DNS record unchanged.
4. Diagnose and repeat the full cutover gate instead of patching deployed HTML.

## Failure handling

| Failure stage | Check first |
| --- | --- |
| Quality | stale approval, incomplete inventory, mirror/diagram/link defect, broken fixture, axe/visual failure |
| Exact build | missing `validated_sha`, mismatched checkout SHA, wrong site/base, Astro or Pagefind failure |
| Artifact | secret/env/source file, hidden path, symlink, CNAME claim, wrong stamp, missing route, budget |
| Deploy | `main` environment policy, Pages status, deployment-only permissions, artifact availability |
| Default URL | project base `/nutsnews-docs`, asset paths, root audience redirect, release stamp |
| Custom domain | the single DNS-only CNAME, Pages custom-domain state, certificate state, HTTPS enforcement |

Fix the source, config, or external setting and rerun the complete workflow. Never edit deployed HTML, weaken a gate, expose logs/artifacts containing secrets, or use obsolete `.wiki-build`, `wiki-push`, Jekyll, or bundle commands.
