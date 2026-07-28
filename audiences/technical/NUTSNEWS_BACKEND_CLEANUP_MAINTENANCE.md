---
title: NutsNews Backend Cleanup Maintenance
wiki:
  source_route: /technical/nutsnews-backend-cleanup-maintenance/
  simple_route: /simple/nutsnews-backend-cleanup-maintenance/
  primary_diagram:
    file: diagrams/NUTSNEWS_BACKEND_CLEANUP_MAINTENANCE.md
    accTitle: "NutsNews Backend Cleanup Maintenance diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: platform-and-data
  section: core-platform
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: a89dc63d7ba16b5f7d132e62894f0058a047bbafdbb2754d1cba54a43d2009bc
---

# NutsNews Backend Cleanup Maintenance

Backend issue `ramideltoro/nutsnews-backend#41` adds fixed-purpose disk and
Docker cleanup automation for `65.75.201.18`.

## Operating Model

Workflow:

```text
Backend Cleanup Maintenance
```

Actions:

- `report`: inventory disk, inode, Docker, temp, apt-cache, log, Caddy, and
  backup cleanup surfaces without cleanup commands.
- `dry-run`: run non-mutating candidate listing commands only.
- `apply`: run the fixed cleanup command set only after `production-backend`
  approval and `confirm_apply=backend.nutsnews.com`.

The workflow does not accept arbitrary remote commands.

## Safe Targets

Allowlisted cleanup targets:

- stale files older than 7 days under `/tmp` and `/var/tmp`;
- downloaded apt package archives under `/var/cache/apt/archives`;
- dangling Docker images;
- Docker build cache older than 7 days.

Protected state:

- Caddy state and certificates;
- Docker named volumes;
- backend backup state/repositories;
- PostgreSQL data;
- app persistent data;
- ops dashboard files;
- home/root/etc state.

The implementation explicitly refuses `docker volume prune` and
`docker system prune --volumes`.

## Reporting

Each run uploads `backend-cleanup-maintenance-report.json` and writes a GitHub
summary. The backend health report also exposes `cleanup_last_run` from:

```text
/var/lib/nutsnews/cleanup/last-cleanup.json
```

Until an approved apply writes that file, health reports show
`cleanup_last_run=not_configured`.

## Current Evidence

Read-only live inventory on July 17, 2026:

- root disk usage: `8%`;
- root inode usage: `2%`;
- Docker: inactive/not installed;
- stale temp-file candidates: `0`;
- apt package cache: about `469 MB`;
- cleanup last-run state: `not_configured`.
