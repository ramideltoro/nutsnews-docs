# GitHub Pages publishing for the NutsNews wiki

NutsNews documentation is published as the static site at `https://wiki.nutsnews.com`.

The repository remains the source of truth. Editing markdown files in this repository and pushing to `main` updates the workflow input for the next publish run.

GitHub Actions builds the site and publishes it to GitHub Pages. Cloudflare is DNS-only for this hostname (Cloudflare does not proxy/transform HTML in this setup).

---

## Current source contract

The site is built from markdown files in this repository through the `.github/workflows/wiki-pages.yml` workflow.

Published content includes every repository markdown document that is not in an explicit ignore path. The active ignore set is maintained in `scripts/wiki/validate-doc-paths.mjs` and includes:

- `.git` and dependency directories
- `.github` and script directories
- generated artifacts (`_site`)
- editor/system files (`node_modules`, `.DS_Store`, etc.)

## What to edit

- Add, amend, or archive markdown documents in this repository.
- Do not edit generated HTML on Pages.
- Do not edit deployed pages in GitHub Pages directly.

---

## Workflow and launch gate

Publishing is controlled by

- `.github/workflows/wiki-pages.yml`
- `scripts/wiki/validate-doc-paths.mjs`
- `_config.yml`
- `index.md`

### Launch gate (order)

1. Push docs to `main` with a successful commit.
2. CI gate checks:
   - Documentation path inventory validation
   - Jekyll build pass
   - Pages artifact generation
3. Manual/manual-override deployment gate (if `wiki-pages` environment is protected in GitHub):
   - reviewer approval in GitHub Environments
4. Publish job deploys to Pages.

### Manual run (forced)

In GitHub Actions:

1. Open `wiki-pages` workflow.
2. Click **Run workflow**.
3. Select `main`.
4. Run.

---

## Preview and validation commands

Use these commands from the repository root.

### Validate source contract

```bash
node scripts/wiki/validate-doc-paths.mjs
```

### Preview build locally

```bash
bundle exec jekyll serve
```

(If `bundle` is not installed, install Jekyll with `gem install bundler jekyll` first.)

### Inspect generated route list (pre-publish)

```bash
grep -R "^" --no-messages --exclude-dir=.git --include='*.md' . | wc -l
```

---

## DNS, HTTPS, and rollback

### DNS + HTTPS

`wiki.nutsnews.com` is expected to be a CNAME to GitHub Pages.

Deployment checks expect:

- `CNAME` pointing to the GitHub Pages hostname (for example `ramideltoro.github.io`) in Cloudflare DNS.
- A matching Pages custom domain configured for this repository.
- A successful HTTPS certificate issuance after DNS propagation.

### Rollback

If a publish is bad:

1. Re-run workflow on the last-good commit SHA.
2. Verify `https://wiki.nutsnews.com` serves expected pages.
3. If needed, update DNS/Domain to the prior working Pages source branch only for emergency isolation, then republish current head.

---

## Failure handling

If publish fails:

1. Open the workflow run details for the failed job.
2. Check these common blockers first:
   - Inventory check failed (script output indicates missing/ignored content).
   - Jekyll build failed due to markdown frontmatter/structure.
   - Pages permissions missing (`contents: read`, `pages: write`, `id-token: write`).
   - CNAME misconfiguration or stale DNS record.
   - Pages build output path mismatch.

3. Fix the root cause, commit, and re-run.

For the standard NutsNews setup, publish runs without any runtime OpenAI key or API dependency.
