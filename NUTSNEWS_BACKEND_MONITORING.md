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

## Grafana Cloud Logs

Backend issue #36 adds Grafana Cloud Loki log shipping through the backend
Grafana Alloy deployment in `ramideltoro/nutsnews-backend`.

Secret names in the GitHub `production-backend` environment:

- `GRAFANA_CLOUD_LOKI_URL`
- `GRAFANA_CLOUD_LOKI_USERNAME`
- `GRAFANA_CLOUD_LOKI_PASSWORD`

Collected sources:

- filtered systemd journal units for Caddy, Alloy, backup/restore verification,
  NutsNews timers, SSH, UFW, fail2ban, unattended-upgrades, and apt timers;
- `/var/log/auth.log` and `/var/log/fail2ban.log` through the host `adm` group;
- `/var/log/caddy/access.log`, `/var/log/caddy/error.log`, and
  `/var/log/nutsnews/*.log` when those files exist.

Alloy remains least-privilege: it runs as the package-managed `alloy` user and
is added only to `systemd-journal` and `adm` for log reads. Docker/Compose
container logs are intentionally excluded until backend app containers exist and
a reviewed socket-free or otherwise least-privilege collection path is added.

Before logs are shipped, Alloy drops private-key markers and oversized lines,
redacts authorization headers, cookies, token/password/API-key style values,
query strings, and email addresses, truncates long lines, and keeps only stable
labels:

```text
environment, host, source, service, unit, severity, filename, job
```

Grafana objects:

- Folder: `NutsNews Backend Ops` (`nutsnews-backend-ops`)
- Logs dashboard: `NutsNews Backend Logs` (`nutsnews-backend-logs`)
- Live logs datasource verified on 2026-07-17: `grafanacloud-kindcantaloupe2036-logs` (`grafanacloud-logs`)
- Managed fallback logs datasource if no Cloud Logs datasource exists: `grafanacloud-nutsnews-backend-loki` (`grafanacloud-loki`)
- Datasource type: Grafana Loki (`loki`)

The backend provisioner intentionally avoids Grafana's alert-state-history Loki
datasource because that stores alert history, not backend host logs.

## Grafana Alert Guardrails

Backend issue #25 adds a repo-managed Grafana alert group named
`NutsNews Backend Guardrails` in the `NutsNews Backend Ops` folder.

Initial alert rules cover:

- missing backend host metrics;
- unhealthy `/healthz` endpoint;
- failed systemd units;
- unhealthy backup, verification, or restore-drill stages;
- root disk warning above 80%;
- reboot-required warning after 24 hours;
- missing backend journal logs in Loki;
- backend log volume above the free-tier guardrail threshold.

The rules use the backend textfile metrics and explicit `noDataState` settings
so intentionally not-configured services do not page as failures. Notification
routing, deduplication, cooldowns, and recovery messages are managed by the
backend report artifacts described below.

## Off-Box Synthetic Monitoring

Backend issue #30 adds `.github/workflows/backend-synthetic-monitor.yml` in
`ramideltoro/nutsnews-backend`.

The workflow runs hourly from GitHub-hosted runners and checks public endpoints
without authentication or production mutation:

- `https://www.nutsnews.com/`
- `https://nutsnews.com/` redirect behavior
- `https://backend.nutsnews.com/healthz`
- `https://backend.nutsnews.com/` expected current `404`
- Supabase public status API as the auth-provider availability signal

Each run uploads `backend-synthetic-report.json`, writes a GitHub step summary,
and sends email only on unsuppressed alert notifications through the existing
NutsNews reporting SMTP secret names. The report includes endpoint, HTTP status,
failure class, source provider/location, alerting summary, alert state, and last
successful check timestamp when a previous completed artifact is available.

## Alert Deduplication And Recovery

Backend issue #39 adds artifact-backed alert state to the recurring health
report and off-box synthetic monitor.

State storage:

- `backend-health-report.yml` downloads the previous completed
  `backend-health-report` artifact from `main`.
- `backend-synthetic-monitor.yml` downloads the previous completed
  `backend-synthetic-report` artifact from `main`.
- Each new report writes `alert_state.alerts` back into the next uploaded JSON
  artifact.

Fingerprint inputs:

- source;
- service/check name;
- severity;
- failure class;
- normalized message text with volatile timestamps, long hex IDs, and numbers
  replaced.

Cooldown policy:

- health report alerts: `24` hours;
- synthetic monitor alerts: `1` hour.

Visible fields in JSON artifacts and GitHub summaries:

- active alert count;
- notification count;
- suppressed count for the current run;
- cumulative suppressed count on each active alert record;
- recovered count;
- last sent timestamp;
- last error;
- notification list;
- suppressed list.

Alert severities are `warning`, `critical`, `unknown`, and `recovered`.
Healthy and intentionally `not_configured` health checks do not create alert
candidates. Recovery notifications are emitted when an active fingerprint from
the previous artifact is absent from the current run.

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
- `id alloy` includes only narrow log-read groups such as `adm` and `systemd-journal`.
- `nutsnews-metrics-textfile.timer` is enabled and active.
- `ss -tuln` does not show public listeners on `9100`, `9090`, `9091`, or `12345`.
- Grafana verification returns data for:
  - `up{job="nutsnews-backend-host"}`
  - `nutsnews_backend_backup_stage_healthy{stage="backup"}`
  - `nutsnews_backend_public_endpoint_healthy`
  - `{host="backend.nutsnews.com",source="journal"}`

## Status

Issue #7 is complete. Issue #35 owns the Grafana Cloud metrics/dashboard layer, while issue #36 owns Loki log shipping and issue #25 ties metrics, logs, dashboards, and guardrails into the full observability baseline.
