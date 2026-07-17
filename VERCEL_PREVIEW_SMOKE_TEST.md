# Vercel Preview Smoke Test

This regression runs against the real Vercel Preview deployment created for a pull request.

## Simple Summary

NutsNews checks every preview site before merge. The check opens the live preview, clicks through the public reader controls, and makes sure the site still works.

## Intermediate Summary

The preview smoke test verifies real deployed behavior instead of mocked local fixtures. Language checks allow the documented English fallback and do not require the same first article title across every live API response, because production preview data can refresh or reorder between language requests.

## Expert Summary

The workflow is `.github/workflows/vercel-preview-smoke.yml` and the test entry point is `web/tests/vercel-preview-smoke.spec.ts`. The language regression validates that each language selection makes a successful `/api/articles?lang=<code>` request, updates the document `lang`, renders the first card in the requested language or `en`, and keeps a visible article title. It intentionally does not compare fallback languages against a fixed English title, because live Vercel preview responses can contain different current article ordering while still honoring English fallback semantics.

## What it verifies

The Playwright smoke test opens the deployed preview URL and verifies:

1. The homepage renders article cards.
2. Apps, About, Contact, and Privacy pages load from the preview.
3. The footer Home button scrolls the homepage back to the top with animated movement.
4. Footer search for `dogs` returns at least one result.
5. The Settings menu opens and every theme can be applied and persisted.
6. The Language menu requests French, Japanese, Swiss German, German, and Greek feeds; each response succeeds, updates the page language, and renders article cards in the requested language or documented English fallback.

## How it runs

The workflow `.github/workflows/vercel-preview-smoke.yml` listens for `deployment_status` events. When Vercel reports a successful non-production `vercel.app` deployment, GitHub Actions runs:

```bash
cd web
PLAYWRIGHT_BASE_URL="https://your-vercel-preview-url.vercel.app" npm run test:e2e:preview
```

The same workflow can be started manually with `workflow_dispatch` by entering a preview URL.

Local runs against protected Vercel preview URLs need the same automation bypass secret. Without that local environment value, the suite may time out before article cards render even though the GitHub Actions job can reach the deployment.

## Immutable test policy

The preview smoke test, the immutable guard, and the offline public web E2E regression remain high-signal review surfaces. The immutable guard reports protected test/workflow changes in CI so reviewers can inspect them, but it no longer requires a standalone manual approval token before every pull request.

## Protected Vercel preview deployments

If Vercel Deployment Protection or Vercel Authentication is enabled for preview deployments, GitHub Actions must send Vercel's automation bypass secret with the Playwright requests.

1. In Vercel, open the NutsNews project.
2. Go to Settings -> Deployment Protection.
3. Under Protection Bypass for Automation, create a secret for GitHub Actions / Playwright.
4. Add the same value to the GitHub repository secret named `VERCEL_AUTOMATION_BYPASS_SECRET`.

The Playwright config sends the secret as the `x-vercel-protection-bypass` header and sets `x-vercel-set-bypass-cookie: true` so browser follow-up requests can reach the protected deployment. Do not commit the secret.
