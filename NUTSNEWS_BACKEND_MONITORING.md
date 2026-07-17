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

## Grafana Cloud Metrics

Backend issue #35 adds the repo-managed Grafana Cloud metrics path from
`ramideltoro/nutsnews-backend`.

Host deployment path:

- Protected Ansible apply installs Grafana Alloy from the Grafana apt repository.
- Alloy uses `/etc/alloy/config.alloy` and remote-writes to Grafana Cloud Prometheus.
- Remote-write credentials live only in the GitHub `production-backend` environment as:
  - `GRAFANA_CLOUD_PROMETHEUS_URL`
  - `GRAFANA_CLOUD_PROMETHEUS_USERNAME`
  - `GRAFANA_CLOUD_PROMETHEUS_PASSWORD`
- Alloy scrapes local exporter targets only. No Prometheus scrape port is exposed publicly.
- `/usr/local/bin/nutsnews-metrics-textfile` writes low-cardinality NutsNews metrics into `/var/lib/nutsnews/metrics/nutsnews.prom`.
- `nutsnews-metrics-textfile.timer` refreshes endpoint, service, update, backup, restore-drill, and quota-state metrics every minute.

Grafana provisioning path:

- Dashboard specs live in `grafana/backend-metrics/dashboards.json`.
- `Backend Grafana Metrics` validates, applies, and verifies the Grafana folder and dashboards with `scripts/provision_grafana_metrics.py`.
- The managed folder is `NutsNews Backend Ops` with UID `nutsnews-backend-ops`.
- Managed dashboards cover host resources, Docker/runtime state, Caddy/edge health, service health, backups, OS updates, metrics quota guardrails, and alert/synthetic health.

Operator verification:

```bash
gh workflow run protected-backend-ansible-apply.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f run_mode=apply \
  -f confirm_apply=backend.nutsnews.com

gh workflow run backend-grafana-metrics.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=apply \
  -f confirm_apply=backend.nutsnews.com

gh workflow run backend-grafana-metrics.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=verify
```

Expected live evidence:

- `alloy` service is active.
- `nutsnews-metrics-textfile.timer` is enabled and active.
- `ss -tuln` does not show public listeners on `9100`, `9090`, `9091`, or `12345`.
- Grafana verification returns data for:
  - `up{job="nutsnews-backend-host"}`
  - `nutsnews_backend_backup_stage_healthy{stage="backup"}`
  - `nutsnews_backend_public_endpoint_healthy`

## Status

Issue #7 is complete. Issue #35 owns the Grafana Cloud metrics/dashboard layer, while issue #36 owns Loki log shipping and issue #25 ties metrics, logs, dashboards, and guardrails into the full observability baseline.
