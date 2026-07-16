# NutsNews Backend Backup And Restore Baseline

This documents the backup and restore policy for `ramideltoro/nutsnews-backend` before any production backend state is stored on `65.75.201.18`.

## Current State

The backend host has no deployed app runtime, database service, upload storage, or production backend state yet.

Issue #6 defines the policy that must be satisfied before stateful backend workloads are enabled.

## Policy

Backups must survive VPS loss. Provider snapshots are supplemental only and must not be the sole recovery mechanism for application data, database state, credentials, or operational evidence.

## Scope

| Data class | Initial owner | Backup requirement |
| --- | --- | --- |
| Backend app code/config | GitHub repositories | Git remotes are source of truth |
| Runtime env/secrets | GitHub Environment secrets or documented secret store | Secret names documented; values outside git |
| Host and reverse proxy config | Backend repo through Ansible | Recreate from repo and protected apply |
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

Backup credentials must live in the `production-backend` GitHub Environment or a documented secret store. Do not commit backup credentials, repository passwords, rclone config, database dumps, or restore artifacts.

## Recovery Order

1. Provision or recover the host.
2. Apply baseline configuration through the protected backend workflow.
3. Restore secrets through the documented secret store.
4. Restore stateful data from encrypted off-server backups.
5. Run workload-specific integrity checks.
6. Verify health endpoints, dashboard status, and logs.
7. Route traffic only after verification passes.
