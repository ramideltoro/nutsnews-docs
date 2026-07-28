---
title: NutsNews Platform Improvement Issue Backlog
wiki:
  source_route: /technical/platform-improvement-issue-backlog/
  simple_route: /simple/platform-improvement-issue-backlog/
  primary_diagram:
    file: diagrams/PLATFORM_IMPROVEMENT_ISSUE_BACKLOG.mmd
    accTitle: "Issue backlog generation flow"
    accDescr: "Shows scan sources, dedupe check, and issue creation steps for platform backlog automation."
  status: active
  collection: platform-and-data
  section: core-platform
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: b30a427532cf50eb0e9d7d1941d20a747b4b9a5be3c4db349ef8736341ba268f
---

# NutsNews Platform Improvement Issue Backlog

This backlog was generated from a scan of the NutsNews main branch plus the current open GitHub Issues page. It avoids recreating already-visible issues such as database planning, public API, feed expansion, manual review, native mobile app path, social sharing, personalization, richer thumbnails, and engagement analytics.

The script in `scripts/create_platform_improvement_issues.mjs` creates the recommendations as GitHub issues using the GitHub CLI.

## Recommended backlog areas

- Production readiness and operational scorecards
- End-to-end and API contract testing
- SLOs, incident response, deployment verification, and rollback
- Cloudflare cache observability and public feed fallback
- Worker backpressure, queue visibility, and lock safety
- Deduplication, source trust, retention, migrations, and backup fire drills
- AI safety regression tests, prompt versioning, and translation QA
- Newsletter, no-login saved stories, related stories, archive discovery, and SEO scaling
- Bundle budgets, image proxy/cache design, security headers, secret rotation, rate limiting, staging, and feature flags

## How to create the issues

Preview first:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews3
node scripts/create_platform_improvement_issues.mjs --repo ramideltoro/nutsnews
```

Create issues:

```bash
node scripts/create_platform_improvement_issues.mjs --repo ramideltoro/nutsnews --create
```

The script deduplicates by exact issue title across open and closed issues using:

```bash
gh issue list --repo ramideltoro/nutsnews --state all --limit 1000 --json title,number,state
```

## Requirements

- GitHub CLI installed
- Authenticated with `gh auth login`
- Permission to create issues and labels in `ramideltoro/nutsnews`

