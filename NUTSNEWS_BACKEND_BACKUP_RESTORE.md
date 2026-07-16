# NutsNews Backend Backup And Restore Baseline

This documents the backup and restore policy for `ramideltoro/nutsnews-backend` before any production backend state is stored on `65.75.201.18`.

## Current State

The backend host has no deployed app runtime, database service, upload storage,
or production backend app state yet. It does have host baseline, Caddy,
dashboard, and backup-status state covered by the service-aware backup matrix.

The backend repo source of truth is:

```text
docs/backend-backup-service-matrix.json
```

## Policy

Backups must survive VPS loss. Provider snapshots are supplemental only and must not be the sole recovery mechanism for application data, database state, credentials, or operational evidence.

## Scope

| Data class | Initial owner | Backup requirement |
| --- | --- | --- |
| Backend app code/config | GitHub repositories | Git remotes are source of truth |
| Runtime env/secrets | GitHub Environment secrets or documented secret store | Secret names documented; values excluded from restic |
| Host and reverse proxy config | Backend repo through Ansible plus restic evidence | Recreate from repo and protected apply; restore selected state as needed |
| Ops dashboard/status metadata | Backend host collectors | Backed up for incident evidence and exposed in dashboard/reporting |
| Application uploads/local state | Future backend issue | Off-server backups required before production use |
| PostgreSQL data | Future database issue | Encrypted off-server backups plus restore drills before production use |
| Logs | Host retention plus future off-server policy | Retain enough for troubleshooting without unbounded raw logs |

## Initial Retention Baseline

Until a workload-specific issue chooses different values:

| Backup type | Retention |
| --- | --- |
| Daily | 14 |
| Weekly | 8 |
| Monthly | 12 |
| Yearly | 2 |

## Restore Test Gate

Before production traffic or production data depends on this backend host:

1. Restore the latest backup to an isolated path or non-production host.
2. Verify ownership and permissions.
3. For database backups, start a non-production PostgreSQL instance and run integrity checks.
4. Confirm the restored data satisfies the documented RPO/RTO.
5. Record snapshot ID, restore target, validation commands, and result in the relevant issue or PR.

## Secret Boundary

Backup credentials live in the `production-backend` GitHub Environment. Do not
commit backup credentials, repository passwords, provider keys, database dumps,
or restore artifacts.

Required secret names:

- `RESTIC_REPOSITORY`
- `RESTIC_PASSWORD`
- provider credentials for `NUTSNEWS_BACKEND_RESTIC_PROVIDER`, currently
  `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` for `s3`

The protected apply writes a root-only systemd environment file. Status JSON is
world-readable for observability and contains no secret values.

## GitOps Components

The backend protected apply installs:

- `/usr/local/sbin/nutsnews-backup`
- `/etc/nutsnews-backup/service-matrix.json`
- `/etc/nutsnews-backup/restic.env` with mode `0600`
- `/var/lib/nutsnews/backups/`
- `nutsnews-backup.service` and `.timer`
- `nutsnews-backup-verify.service` and `.timer`
- `nutsnews-restore-drill.service` and `.timer`

Manual runs use the fixed `Backend Backup Maintenance` workflow with only these
actions:

- `status`
- `backup`
- `verify`
- `restore-drill`

Mutating actions require `confirm_target=backend.nutsnews.com` and the
`production-backend` approval gate.

## Status Files

The runner writes:

| File | Meaning |
| --- | --- |
| `/var/lib/nutsnews/backups/last-backup.json` | latest backup freshness, snapshot id, included paths, quota status |
| `/var/lib/nutsnews/backups/last-verification.json` | latest restic check result |
| `/var/lib/nutsnews/backups/last-restore-verification.json` | lightweight restore-drill result |

The health report and loopback-only ops dashboard expose backup failure, stale
backup, unverified latest snapshot, and storage/quota warning as separate
signals.

## Recovery Order

1. Provision or recover the host.
2. Apply baseline configuration through the protected backend workflow.
3. Restore secrets through the documented secret store.
4. Restore stateful data from encrypted off-server backups.
5. Run workload-specific integrity checks.
6. Verify health endpoints, dashboard status, and logs.
7. Route traffic only after verification passes.
