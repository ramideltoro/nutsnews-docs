# NutsNews Backend Monitoring Baseline

This documents the initial monitoring, health check, and log-retention baseline for `ramideltoro/nutsnews-backend` and `65.75.201.18`.

## Host Baseline

Backend issue #7 adds repo-managed host observability through the backend Ansible baseline role.

Implementation shape:

- Install `logrotate` and `sysstat`.
- Create `/var/log/nutsnews`.
- Configure persistent journald with `SystemMaxUse=512M` and `MaxRetentionSec=14day`.
- Rotate `/var/log/nutsnews/*.log` daily with 14 compressed rotations.
- Enable sysstat collection.
- Install `/usr/local/sbin/nutsnews-backend-smoke`.

## Health Checks

Host smoke command after approved apply:

```bash
sudo /usr/local/sbin/nutsnews-backend-smoke
```

Read-only remote check:

```bash
ssh -i ~/.ssh/servercheap_65_75_201_18 rami@65.75.201.18 'hostname && systemctl --failed --no-pager && ss -tulpen 2>/dev/null || ss -tulpn'
```

Backend app health endpoint:

```text
/healthz
```

Until the backend app exists, application status is `not_deployed`.

## Initial Thresholds

| Signal | Warning | Critical |
| --- | --- | --- |
| Root disk used | 80% | 90% |
| Memory used | 80% | 90% |
| Load average per CPU | 1.5 | 2.5 |
| Failed systemd units | any failed unit | any failed unit after one recheck |
| Pending reboot | present after maintenance window | present after approved reboot window |
| Backend endpoint | one failed check | two consecutive failed checks |
| Backup freshness | workload-specific | beyond restore policy RPO |

## Log Retention

- System journal: persistent, capped at 512 MiB, retained up to 14 days.
- Backend app logs: `/var/log/nutsnews/*.log`, daily rotation, 14 retained rotations, compressed.
- Logs must not contain secrets, tokens, private keys, database dumps, or full environment output.

## Current Blocker

Issue #7 cannot close until the protected backend workflow applies the monitoring baseline, smoke verification runs against the live host, and an alert delivery path is configured and tested at least once.
