---
title: GitHub Pages Publishing for the NutsNews Wiki (Simple)
description: A plain-language guide to previewing, checking, launching, and rolling back the static NutsNews Wiki.
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

The repository is the source of truth. Astro builds the docs into static files, and GitHub Actions publishes only a checked artifact.

## Where the wiki is now

- Public URL: `https://wiki.nutsnews.com/`
- GitHub Pages uses the custom domain and enforced HTTPS.

Do not edit `_site/`, generated content, reports, caches, or the live Pages files.

## What happens after a NutsNews merge

Every five minutes, one central workflow checks all active public `nutsnews*` repositories for newly merged pull requests. New matching repositories are included automatically.

1. It gathers the merged PR facts and changed-file patches.
2. Codex updates a repository merge log and any wiki guide made stale by the merge.
3. Codex has no GitHub write token and cannot publish by itself.
4. A fixed safety step rejects deleted files, tooling edits, or incomplete document bundles.
5. The workflow records the source repository, PR numbers, merge commit, workflow run, and source hash.
6. Every content, link, diagram, secret, and build check must pass.
7. Only then does the workflow commit to `main` and start a Pages deployment.

Failures do not advance the merge cursor and are reported as GitHub issues. The same merge batch gets at most three attempts, which prevents endless API spending. A later merge automatically starts the repository again and includes all changes that are still waiting.

## Preview and check locally

```bash
npm ci
npm run dev -- --host 127.0.0.1 --port 4321
```

For a production preview:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
```

Run the documentation and browser gates:

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

## What Actions does

Pull requests run checks but never deploy.

A push or manual run on `main` follows this order:

1. Check at least the original 227 sources plus every later source, both mirror sets, approvals, diagrams, links, secrets, routes, build, budgets, accessibility, keyboard flows, and screenshots.
2. Mark the exact commit as ready only after every check passes.
3. Check out that same commit in the Pages build.
4. Build, stamp, and inspect the final artifact.
5. Upload it.
6. Deploy it from the `main`-only Pages environment.

Only deployment can write to Pages. The workflow does not use a repository secret or an OpenAI key.

## Launch order

1. Finish every platform and local QA gate. Smoke-test the default URL.
2. Prepare and fully validate the production-target site-code pull request, but do not merge it.
3. In Cloudflare, change only this record:

   | Type | Name | Target | Proxy |
   | --- | --- | --- | --- |
   | CNAME | `wiki` | `ramideltoro.github.io` | DNS only |

   Do not change any other DNS record.
4. Merge the ready production-target pull request and wait for its root artifact to deploy.
5. Set the repository Pages custom domain to `wiki.nutsnews.com`.
6. Wait for GitHub’s certificate, then turn on **Enforce HTTPS**.
7. Test the release stamp, root, both audiences, search/History, diagrams, 404, and nested pages.

## Rollback

### Rollback verification contract

Record the last-good commit SHA first. Verify `https://wiki.nutsnews.com` serves it after a production rollback and test both audiences; after a cutover fallback, verify the default project URL instead.

For a bad production release, revert or rerun the last good commit, require every gate, confirm `release.json`, and smoke the affected routes.

For a failed domain cutover:

1. Redeploy the last pre-cutover `/nutsnews-docs` artifact.
2. Remove the repository custom domain and verify the default URL.
3. Remove or correct only the `wiki` CNAME if DNS caused the failure.
4. Leave every other DNS record unchanged and repeat the full gate.

## When something fails

- Quality: check approval, inventory, mirrors, diagrams, links, or browser results.
- Build: check the exact commit, site/base, Astro, Pagefind, and budgets.
- Artifact: check the stamp and blocked secret/env/source/CNAME files.
- Deploy: check the `main` environment, Pages status, permissions, and artifact.
- Domain: check the one DNS-only CNAME, custom-domain status, certificate, and HTTPS.

Fix the source and rerun. Do not edit deployed HTML or use `.wiki-build`, `wiki-push`, Jekyll, or bundle commands.
