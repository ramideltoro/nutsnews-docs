---
title: NutsNews Platform Improvement Issues Bundle
wiki:
  source_route: /technical/archive/root-cleanup/nutsnews-platform-issues-readme/
  simple_route: /simple/archive/root-cleanup/nutsnews-platform-issues-readme/
  primary_diagram:
    file: diagrams/archive/root-cleanup/NUTSNEWS_PLATFORM_ISSUES_README.mmd
    accTitle: "NutsNews Platform Improvement Issues Bundle diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: befcee84576715649df7943ad3547e36b34aa6ab0fc113cb6f8813befac646b8
---

# NutsNews Platform Improvement Issues Bundle

This bundle adds a script that creates a platform-grade backlog of GitHub issues for NutsNews.

## Files added

```text
scripts/create_platform_improvement_issues.mjs
docs/PLATFORM_IMPROVEMENT_ISSUE_BACKLOG.md
```

## Copy into your project

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews3

rm -rf /tmp/nutsnews-platform-issues-bundle
unzip -o ~/Downloads/nutsnews-platform-issues-bundle.zip -d /tmp/nutsnews-platform-issues-bundle
rsync -av /tmp/nutsnews-platform-issues-bundle/ ./
```

## Preview the issues first

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews3
node scripts/create_platform_improvement_issues.mjs --repo ramideltoro/nutsnews
```

## Create the issues

```bash
node scripts/create_platform_improvement_issues.mjs --repo ramideltoro/nutsnews --create
```

## Commit the script and docs

```bash
git status
git add scripts/create_platform_improvement_issues.mjs docs/PLATFORM_IMPROVEMENT_ISSUE_BACKLOG.md NUTSNEWS_PLATFORM_ISSUES_README.md
git commit -m "Add platform improvement issue generator"
git push
```

## Notes

- The script creates labels if they are missing.
- It skips issues that already exist by exact title.
- If label creation fails because of permissions, run with `--skip-labels` and create labels later.
