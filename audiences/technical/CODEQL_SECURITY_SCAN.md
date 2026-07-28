---
title: CodeQL Security Scan
wiki:
  source_route: /technical/codeql-security-scan/
  simple_route: /simple/codeql-security-scan/
  primary_diagram:
    file: diagrams/CODEQL_SECURITY_SCAN.mmd
    accTitle: "CodeQL Security Scan diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: platform-and-data
  section: core-platform
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 99b19629bb0dfd6cfc8f56f953c0937b322f8365a3edb335f531091f7aef1301
---

# CodeQL Security Scan

NutsNews uses GitHub CodeQL for security scanning.

## What it scans

- `web/` Next.js app
- `worker/` Cloudflare Workers code
- `.github/workflows/` GitHub Actions workflows

## What it helps catch

- JavaScript and TypeScript security issues
- Unsafe code patterns in API routes and worker code
- GitHub Actions workflow security issues
- Problems that GitHub can show as code scanning alerts on pull requests

## When it runs

- On pushes to `main`
- On pull requests into `main`
- Weekly on Tuesday
- Manually from the GitHub Actions tab

## Where to view results

Go to:

```txt
GitHub repo -> Security -> Code scanning
```

Or check the workflow run:

```txt
GitHub repo -> Actions -> CodeQL Security Scan
```

## Notes

This workflow uses `build-mode: none` because NutsNews is JavaScript/TypeScript and GitHub Actions workflow analysis. That keeps the scan simple and avoids needing to install dependencies or run the full Next.js build.

The scan excludes generated and build output folders such as `node_modules`, `.next`, `coverage`, `reports`, and `worker/generated-wrangler`.
