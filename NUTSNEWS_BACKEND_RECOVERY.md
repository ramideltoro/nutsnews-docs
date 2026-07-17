# NutsNews Backend Recovery Workflows

This page documents the fixed-purpose recovery workflows for
`ramideltoro/nutsnews-backend` and `backend.nutsnews.com`.

## Boundary

Routine backend recovery runs through GitHub Actions. Operators should not use
ad hoc SSH mutation unless there is a documented break-glass incident.

The primary workflow is:

```text
.github/workflows/backend-recovery.yml
```

The runner is:

```text
scripts/backend_recovery_workflow.py
```

The workflow accepts only fixed choices. It does not accept arbitrary remote
commands, service names, shell scripts, Ansible tags, paths, or user supplied
snippets.

## Fixed Actions

Read-only:

| Action | Purpose |
| --- | --- |
| `diagnostics` | Collect fixed host, service, Caddy, Alloy, backup, metrics, dashboard, and recovery-status diagnostics. |
| `backup-status` | Read the service-aware backup status report. |

Mutating, protected:

| Action | Scope |
| --- | --- |
| `trigger-backup` | Start `nutsnews-backup.service`. |
| `trigger-restore-drill` | Start `nutsnews-restore-drill.service`. |
| `reload-caddy` | Validate Caddy config and reload `caddy`. |
| `restart-caddy` | Validate Caddy config and restart `caddy`. |
| `restart-alloy` | Validate Alloy config and restart `alloy`. |
| `restart-fail2ban` | Restart `fail2ban`. |
| `refresh-metrics` | Start `nutsnews-metrics-textfile.service`. |
| `refresh-ops-dashboard` | Start `nutsnews-ops-dashboard-collect.service`. |

Package updates and reboots remain in `Backend Controlled Maintenance`. Broad
host configuration changes remain in `Protected Backend Ansible Apply`.

## Approval Model

Every recovery run uses the protected `production-backend` GitHub Environment.

For mutating recovery:

1. Run the same action with `mode=check`.
2. Review the uploaded `backend-recovery-report` artifact.
3. Run `mode=apply` only when check mode passes.
4. Set `confirm_target=backend.nutsnews.com`.
5. Approve the protected environment deployment.

Read-only `diagnostics` and `backup-status` do not require confirmation text.

## Evidence

Mutating applies write:

```text
/var/lib/nutsnews/recovery/last-recovery.json
```

That state records action, mode, result, actor, workflow URL, timestamps, and a
sanitized error string when present. It intentionally omits secrets, command
output, environment values, private keys, tokens, and database URLs.

The backend health report exposes this state as `recovery_last_run`.

## Validation

Static and unit validation live in the backend repo:

```bash
python3 scripts/validate_recovery_workflows.py
python3 -m unittest tests.test_backend_recovery_workflow
python3 -m unittest tests.test_backend_health_report
actionlint .github/workflows/backend-recovery.yml
```

Live non-mutating validation uses `mode=check` only.

## Related Docs

- [Backend Protected Apply](NUTSNEWS_BACKEND_PROTECTED_APPLY.md)
- [Backend Backup and Restore](NUTSNEWS_BACKEND_BACKUP_RESTORE.md)
- [Backend Health Report](NUTSNEWS_BACKEND_HEALTH_REPORT.md)
- [Backend Monitoring](NUTSNEWS_BACKEND_MONITORING.md)
