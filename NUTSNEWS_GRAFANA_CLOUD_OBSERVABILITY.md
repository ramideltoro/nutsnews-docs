# NutsNews Grafana Cloud Observability

This explains the Grafana Cloud observability layer for NutsNews hosts: Alloy on hosts, Grafana-managed dashboards and alerts, low-frequency Synthetic Monitoring, and free-tier guardrails.

## Easy Summary

NutsNews has a planned Grafana Cloud observability path that stays GitOps-managed.

There are two halves:

1. `ramideltoro/nutsnews-infra` installs and configures Grafana Alloy on the VPS through the protected Ansible workflow.
2. The same infra repo manages Grafana Cloud folders, dashboards, alert rules, quota alerts, backend imports, and optional Synthetic Monitoring checks through OpenTofu.

The VPS side is read-only. Alloy collects host metrics, systemd state, selected service logs, auth/security logs with redaction, Caddy JSON access/error logs, Docker/Compose logs for NutsNews runtime containers, backup/reporting logs, Ops Portal logs, and a small set of NutsNews status metrics derived from the existing read-only Ops Portal JSON. Docker/cAdvisor container metrics stay disabled by default because the previous container metrics path tried to reach `containerd.sock` and produced permission errors.

The backend host is also a telemetry producer. `ramideltoro/nutsnews-backend` keeps only backend Prometheus remote_write and Loki push credentials for its host collector. Its existing `NutsNews Backend Ops` dashboards and `NutsNews Backend Guardrails` alert group are imported and managed from `ramideltoro/nutsnews-infra`; backend direct Grafana provisioning is retired after import plus live query/alert verification passes.

This does not add a shell button, restart button, package installer, portal mutation path, or broad workflow command runner. Production changes still go through commits, PRs, checks, merge, and protected apply.

## Intermediate Summary

The rollout has separate credentials for separate jobs:

| Credential type | Used by | Purpose |
| --- | --- | --- |
| Grafana Cloud Access Policy token | Ansible-managed Alloy on each producing host | Write telemetry to Grafana Cloud metrics and logs |
| Grafana service account token | OpenTofu in GitHub Actions | Manage folders, dashboards, alert rules, and Synthetic Monitoring checks |

Grafana management/service-account credentials stay only in `ramideltoro/nutsnews-infra`. Do not reuse the service account token for telemetry writes. Do not commit Grafana URLs, usernames, tokens, tenant IDs, backend config, Synthetic Monitoring targets, or tfvars.

The high-level flow:

```mermaid
flowchart LR
  pr["Infra PR"] --> ci["CI validation"]
  ci --> merge["Merge to main"]
  merge --> tofu["Protected Grafana Cloud OpenTofu apply"]
  tofu --> grafana["Folders, dashboards,\nalerts, quota guardrails,\nbackend imports, synthetics"]
  merge --> ansible["Protected Ansible apply"]
  ansible --> alloy["Grafana Alloy on VPS"]
  backend["Backend host Alloy"] --> metrics
  backend --> logs
  alloy --> metrics["Grafana Cloud Metrics"]
  alloy --> logs["Grafana Cloud Logs"]
  metrics --> dashboards["NutsNews Observability dashboards"]
  logs --> dashboards
  dashboards --> operator["Maintainer investigates\nfrom Grafana and runbooks"]
```

## Expert Summary

The infra implementation keeps observability useful without making Grafana Cloud a cost surprise:

- Alloy scrape interval defaults to 60 seconds.
- Host metrics come from Alloy's Unix exporter.
- Container metrics do not come from cAdvisor by default.
- Docker logs are collected for the `nutsnews-service-foundation` and `nutsnews-app` Compose projects through the Docker API socket.
- Docker state still appears through the Ops Portal collector and low-cardinality textfile metrics.
- High-cardinality labels such as container IDs, image IDs, request IDs, user IDs, raw IPs, and full dynamic paths are dropped or avoided.
- Logs are redacted, size-limited, and rate-limited before leaving the VPS.
- Debug and trace logs are intentionally dropped.
- Rotated compressed logs and stale logs are ignored.
- Synthetic Monitoring checks are disabled until protected variables provide target URLs and probe IDs.
- Synthetic checks must run every 15 minutes or slower.
- OpenTofu blocks apply if configured API checks exceed 70% of the current free API execution assumption.
- Browser Synthetic Monitoring and Grafana Cloud k6 execution are not enabled by default.

Grafana's current public free-tier assumptions used by the docs and module are:

| Area | Current assumption |
| --- | ---: |
| Metrics | 10,000 active series per month |
| Logs | 50 GB ingested per month with 14-day retention |
| Synthetic API tests | 100,000 executions per month |
| Synthetic browser tests | 10,000 executions per month |
| k6 | 500 virtual user hours per month |

Always verify the live Grafana pricing page before adding more telemetry: https://grafana.com/pricing/

Grafana Cloud usage and limit metrics are queried through the `grafanacloud-usage` datasource. Grafana documents the `grafanacloud_instance_metrics_limits`, `grafanacloud_logs_instance_limits`, and related usage metrics here: https://grafana.com/docs/grafana-cloud/cost-management-and-billing/manage-invoices/understand-your-invoice/usage-limits/

## What Alloy Collects

```mermaid
flowchart TB
  vps["NutsNews VPS"] --> host["Linux host metrics\nCPU, load, memory, swap,\nfilesystem, disk IO, network,\nfile descriptors, conntrack,\nprocesses, boot time, time sync"]
  vps --> systemd["systemd services and timers"]
  vps --> docker["Docker and Compose logs\nthrough Alloy Docker API discovery"]
  vps --> dockerState["Docker and Compose state\nthrough Ops Portal/textfile metrics"]
  vps --> files["journald, auth, Caddy JSON,\napp/service, backup,\nreporting, Ops Portal logs"]
  vps --> portal["Ops Portal status JSON"]
  portal --> textfile["low-cardinality\nNutsNews textfile metrics"]
  host --> alloy["Grafana Alloy"]
  systemd --> alloy
  docker --> alloy
  dockerState --> textfile
  files --> alloy
  textfile --> alloy
  alloy --> gc["Grafana Cloud"]
```

## Container Metrics Strategy

Alloy leaves `vps_service_foundation_grafana_alloy_collect_docker` set to `false` by default. That disables the cAdvisor exporter and avoids the containerd metrics path that previously produced permission errors. The current production model is:

- Alloy host, systemd, journald/file, and textfile telemetry.
- Alloy Docker log collection for NutsNews Compose projects only.
- Docker container state, health, restart counts, and storage pressure from the root-run Ops Portal collector.
- Low-cardinality Docker state exported through `/var/lib/nutsnews/alloy/textfile/nutsnews.prom`.

Docker log shipping is controlled separately by `vps_service_foundation_grafana_alloy_collect_docker_logs`, which is enabled by default. It grants the non-root `alloy` user membership in the `docker` group so Alloy can read `/var/run/docker.sock` and discover only containers labeled with the `nutsnews-service-foundation` or `nutsnews-app` Compose project. That is the accepted log-collection privilege boundary today.

Do not make `/run/containerd/containerd.sock` world-readable, chmod host sockets, or run Alloy as root to silence cAdvisor. If container-level CPU/memory metrics become necessary later, add them through an infra PR that documents the exact socket, mounts, supplementary groups, and rollback path. The accepted metrics boundary today is no cAdvisor/containerd access from Alloy.

The custom NutsNews textfile metrics cover state that already exists locally:

- Ops Portal status feed availability and age.
- Alert counts by severity.
- Backup enabled/configured state, latest snapshot age, stale threshold, last backup/prune/verify result, missing paths, and missing configuration.
- Email reporting enabled/configured state, pending/suppressed alert counts, recipient count, and last report timestamps.
- App enablement, route enablement, container running/healthy state, and route readiness.
- Selected systemd service active/enabled state.
- Docker container running/health/restart count with low-cardinality labels.
- Snapshot resource percentages and recent failed-login counters.

## Logs And Redaction

Log collection is intentionally selective:

| Source | Treatment |
| --- | --- |
| journald priorities 0-4 | Collected with rate limiting |
| auth/security logs | Collected with secret and IP redaction |
| Caddy logs | JSON access/error logs collected from Docker stdout |
| app/service logs | Collected from managed NutsNews log directories |
| backup/reporting logs | Collected for operations visibility |
| Ops Portal logs | Collected for collector/reporting diagnosis |
| Docker logs | Collected for the NutsNews Compose projects through the Docker API socket |

Intentionally excluded:

- debug and trace noise
- very large log lines
- old compressed rotations
- raw IP addresses
- request IDs, user IDs, container IDs, image IDs, and full dynamic paths as labels
- secrets, authorization headers, tokens, passwords, API keys, and credentials

This is a practical observability feed, not a copy of every byte the server has ever muttered.

## Grafana Assets Managed As Code

OpenTofu manages these Grafana folders and resource addresses:

| Scope | Host | Folder UID | OpenTofu address | Owner |
| --- | --- | --- | --- | --- |
| VPS observability | `vps.nutsnews.com` | `nutsnews-observability` | `grafana_folder.observability` | `ramideltoro/nutsnews-infra` |
| Backend observability | `backend.nutsnews.com` | `nutsnews-backend-ops` | `grafana_folder.backend_observability` | `ramideltoro/nutsnews-infra` |

The `NutsNews Observability` VPS folder contains:

- NutsNews VPS Overview
- NutsNews Logs Overview
- NutsNews CPU Load Processes
- NutsNews Memory Swap
- NutsNews Disk Filesystem IO
- NutsNews Network Caddy Edge
- NutsNews Docker Compose Containers
- NutsNews Systemd Services Timers
- NutsNews Logs Security Auth
- NutsNews Backups Restore Verification
- NutsNews Ops Portal Reporting
- NutsNews Application Service Health
- NutsNews Synthetic Uptime API Checks
- NutsNews Grafana Cloud Usage Quota

The imported `NutsNews Backend Ops` folder contains:

- NutsNews Backend Host Overview
- NutsNews Backend Docker and Runtime
- NutsNews Backend Caddy and Edge
- NutsNews Backend Service Health
- NutsNews Backend Backups
- NutsNews Backend PostgreSQL Failover
- NutsNews Backend OS Updates
- NutsNews Backend Metrics Quota
- NutsNews Backend Alert and Synthetic Health
- NutsNews Backend Logs

Backend dashboards use `grafana_dashboard.backend_observability["<dashboard_uid>"]`, and backend alert rules are owned as a single Grafana rule group at `grafana_rule_group.backend_guardrails`. The import IDs are the existing backend UIDs, not new names, so OpenTofu can adopt live resources without duplicate UIDs.

OpenTofu also manages quota alert rules at roughly 70%, 85%, and 95% for configured Grafana Cloud usage guardrails, including log ingest and active-stream pressure. A separate log-pipeline rule group alerts on Alloy Loki dropped entries, Alloy Loki write retries, and high error log volume. Loki-backed alert queries declare the range query type explicitly so repeated plans stay convergent after apply. Contact points are not created in code because they often contain secrets. Instead, alert labels can route into existing Grafana notification policies.

Do not remove existing backend Grafana resources until import and query/alert verification pass. The protected apply workflow uploads a `grafana-cloud-post-apply-verification` report after checking folders, dashboards, backend alert rules, Prometheus query data, and Loki query data.

## Synthetic Monitoring

Synthetic Monitoring is optional and configured through protected variables, not committed target URLs.

Synthetic checks use a separate Grafana Synthetic Monitoring API token. The Grafana service account token manages folders, dashboards, and alert rules, but the Terraform provider needs `GRAFANA_SM_ACCESS_TOKEN` for `grafana_synthetic_monitoring_check` resources. In GitHub this is stored as `NUTSNEWS_GRAFANA_SYNTHETIC_MONITORING_ACCESS_TOKEN`.

Set `NUTSNEWS_GRAFANA_SYNTHETIC_HTTP_CHECKS_JSON` to `{}` to temporarily disable Synthetic Monitoring resources while still applying dashboards and quota alerts.

Recommended first checks:

| Check type | What to verify |
| --- | --- |
| public homepage | public reader surface answers successfully |
| public health route | VPS infrastructure health answers successfully |
| public read-only API route | safe API read returns expected status |
| Ops Portal availability | auth-safe availability signal only, not private data |
| admin-safe status route | only if the route is read-only and safe to hit repeatedly |

Do not check refresh-triggering, ingestion-triggering, admin mutation, OAuth callback, controller, or Worker routes. Monitoring should observe production, not poke it into doing work.

Grafana's monthly Synthetic Monitoring formula is:

```text
probes x tests x rounded-duration-minutes x (43200 / frequency-minutes)
```

Example safe shape:

```text
1 probe x 4 checks x 1 minute x (43200 / 30 minutes) = 5,760 executions/month
```

That is comfortably under the current 100,000 API execution free assumption. Adding more probes, more checks, browser checks, or faster intervals changes the math and must be reviewed before apply.

## k6 Policy

Grafana Cloud k6 is not enabled by default.

If a future smoke or performance test is added, use manual or low-frequency scheduling and calculate virtual user hours first:

```text
(maximum VUs x test duration minutes) / 60 = VUh
```

Grafana states that the free tier and trial are limited to 500 VUh per month. Keep any initial test far below that and stop for approval before enabling a cloud run that could consume paid quota.

## Rollout Procedure

1. Add Grafana Cloud OpenTofu state backend config to the protected `production-vps` Environment.
2. Add the Grafana service account token and datasource UIDs to the same protected Environment.
3. Run `Grafana Cloud Plan` and review both the normal plan and refresh-only drift check.
4. Merge the infra PR after checks pass.
5. Run `Grafana Cloud Apply` from `main` with `confirm_apply=grafana-cloud`.
6. Review the `grafana-cloud-post-apply-verification` artifact.
7. Add Alloy telemetry write secrets to `production-vps`.
8. Keep backend telemetry write secrets in `ramideltoro/nutsnews-backend`; do not store backend Grafana service-account credentials there after the handoff.
9. Retire backend direct provisioning only after backend import and query/alert verification pass.
10. Run `Protected Ansible Apply` in check mode with `enable_grafana_alloy=true`.
11. Review the package, config, systemd, and Alloy validation diff.
12. Run apply mode with `confirm_apply=vps.nutsnews.com` and `enable_grafana_alloy=true`.
13. Verify metrics, logs, dashboards, alerts, and usage/quota panels in Grafana Cloud.

After apply, also verify the host-side Alloy state:

```bash
systemctl show alloy.service --property=ActiveState,SubState,User,SupplementaryGroups,DropInPaths --no-pager
curl -fsS http://127.0.0.1:12345/-/ready
sudo journalctl -u alloy.service --since "-30 min" --no-pager | grep -c "containerd.sock: connect: permission denied"
sudo find /var/lib/nutsnews/alloy/textfile -maxdepth 1 -type f -name '*.prom' -printf '%s %p\n'
```

The `journalctl` count must be `0` after the 30-minute post-apply window has aged out pre-fix lines.

## Disabling Alloy

### Simple

`enable_grafana_alloy=false` means Alloy must be off. Protected apply now stops and masks the service, disables the textfile timer, and removes the managed credentials/config files instead of leaving an old agent running.

### Intermediate

Use `Protected Ansible Apply` with `run_mode=check` first. The disabled-state diff should show removal of the managed Alloy env file, Alloy config, systemd drop-in, and textfile service/timer units, plus `alloy.service` moving to stopped/disabled/masked when the unit exists. Then rerun apply with `confirm_apply=vps.nutsnews.com`.

The package and Grafana apt repository can remain installed. That keeps rollback simple while still removing the managed credential and config artifacts that would let the service keep sending telemetry.

### Expert

Disabled convergence is deliberately separate from the enabled installation block. This prevents a false disabled state where the Ops Portal says Alloy is disabled but an older `alloy.service` process, drop-in, and root-only env file are still present. Re-enabling is the rollback path: set `enable_grafana_alloy=true`, rerun check/apply, and Ansible un-masks `alloy.service`, recreates the managed env/config from protected Environment secrets, starts the textfile timer, and repeats readiness and journal validation.

```mermaid
flowchart TD
    A[Protected Ansible Apply] --> B{enable_grafana_alloy}
    B -->|true| C[Render env/config/drop-in]
    C --> D[Unmask and start alloy.service]
    D --> E[Validate readiness and journals]
    B -->|false| F[Stop textfile timer]
    F --> G[Stop, disable, and mask alloy.service]
    G --> H[Remove managed env/config/drop-in/unit files]
    H --> I[Ops Portal reports disabled runtime]
```

Use Loki Explore after apply:

```logql
{service_namespace="nutsnews", source="journal"}
{service_namespace="nutsnews", source="auth"}
{service_namespace="nutsnews", source="docker", compose_project=~"nutsnews-service-foundation|nutsnews-app"}
{service_namespace="nutsnews", source="docker", container="nutsnews-caddy"} | json
{service_namespace="nutsnews"} |~ "(?i)(error|critical|panic|failed|denied)"
```

## Required Environment Secrets

Infra-owned Grafana management secrets live in `ramideltoro/nutsnews-infra` under Settings -> Environments -> `production-vps`.

Telemetry write secrets:

| Secret | Purpose |
| --- | --- |
| `NUTSNEWS_GRAFANA_CLOUD_METRICS_URL` | Grafana Cloud metrics remote write endpoint |
| `NUTSNEWS_GRAFANA_CLOUD_METRICS_USERNAME` | Grafana Cloud metrics username |
| `NUTSNEWS_GRAFANA_CLOUD_LOGS_URL` | Grafana Cloud logs push endpoint |
| `NUTSNEWS_GRAFANA_CLOUD_LOGS_USERNAME` | Grafana Cloud logs username |
| `NUTSNEWS_GRAFANA_CLOUD_ACCESS_POLICY_TOKEN` | Access Policy token for telemetry writes |

These VPS telemetry write values are infra-scoped because `nutsnews-infra` manages the VPS Alloy deployment. Backend telemetry write values remain in `ramideltoro/nutsnews-backend` under `production-backend` with the backend names `GRAFANA_CLOUD_PROMETHEUS_URL`, `GRAFANA_CLOUD_PROMETHEUS_USERNAME`, `GRAFANA_CLOUD_PROMETHEUS_PASSWORD`, `GRAFANA_CLOUD_LOKI_URL`, `GRAFANA_CLOUD_LOKI_USERNAME`, and `GRAFANA_CLOUD_LOKI_PASSWORD`.

OpenTofu automation secrets:

| Secret | Purpose |
| --- | --- |
| `NUTSNEWS_GRAFANA_CLOUD_TOFU_BACKEND_CONFIG` | Remote state backend config |
| `NUTSNEWS_GRAFANA_CLOUD_URL` | Grafana Cloud stack URL |
| `NUTSNEWS_GRAFANA_CLOUD_SERVICE_ACCOUNT_TOKEN` | Grafana service account token for IaC |
| `NUTSNEWS_GRAFANA_CLOUD_PROMETHEUS_DATASOURCE_UID` | Metrics datasource UID |
| `NUTSNEWS_GRAFANA_CLOUD_LOKI_DATASOURCE_UID` | Logs datasource UID |
| `NUTSNEWS_GRAFANA_CLOUD_USAGE_DATASOURCE_UID` | Usage datasource UID |

Optional Synthetic Monitoring secrets:

| Secret | Purpose |
| --- | --- |
| `NUTSNEWS_GRAFANA_SYNTHETIC_MONITORING_ACCESS_TOKEN` | Synthetic Monitoring API token; required when probe IDs and enabled HTTP checks are configured |
| `NUTSNEWS_GRAFANA_SYNTHETIC_PROBE_IDS_JSON` | JSON array of probe IDs |
| `NUTSNEWS_GRAFANA_SYNTHETIC_HTTP_CHECKS_JSON` | JSON object of safe HTTP checks |

Do not paste these values into chat, issues, PR bodies, docs, or committed files.

## Verification Queries

Metrics:

```promql
up{service_namespace="nutsnews"}
node_load1{service_namespace="nutsnews"}
node_memory_MemAvailable_bytes{service_namespace="nutsnews"}
node_filesystem_avail_bytes{service_namespace="nutsnews"}
nutsnews_ops_portal_status_available{service_namespace="nutsnews"}
nutsnews_backup_last_success{service_namespace="nutsnews"}
nutsnews_app_container_healthy{service_namespace="nutsnews"}
```

Logs:

```logql
{service_namespace="nutsnews"}
{service_namespace="nutsnews", log_source="auth"}
{service_namespace="nutsnews", log_source="journal"}
```

Docker log streams are expected only if `vps_service_foundation_grafana_alloy_collect_docker` is deliberately enabled in a later reviewed change.

Synthetics when configured:

```promql
probe_success{service_namespace="nutsnews"}
probe_duration_seconds{service_namespace="nutsnews"}
```

Quota:

```promql
grafanacloud_instance_metrics_limits
grafanacloud_logs_instance_limits
```

## App Observability Follow-Up

This infra change can observe container health, deployment state, service logs, Caddy routing, and the existing Ops Portal status feed. Deeper application telemetry belongs in the app or Worker repos.

Follow-up prompt for `ramideltoro/nutsnews`:

```text
Add low-cardinality application metrics and structured health telemetry for the deployed NutsNews web service. Keep labels bounded, avoid request/user IDs, and document Grafana queries in nutsnews-docs.
```

Follow-up prompt for `ramideltoro/nutsnews-worker`:

```text
Add low-cardinality Worker metrics for ingestion freshness, queue pressure, AI review counts, translation work, failures, and cost guardrails. Keep labels bounded and avoid raw feed URLs or article IDs.
```

## What This Does Not Do

This layer does not:

- create paid Grafana Cloud features
- enable browser Synthetic Monitoring
- enable Grafana Cloud k6 runs
- add application-code instrumentation
- expose the Ops Portal publicly
- add portal mutation controls
- add arbitrary SSH or workflow command execution
- store Terraform state in Git
- commit Grafana Cloud secrets, URLs, usernames, tenant IDs, targets, or tokens

## Related Docs

- [Observability](OBSERVABILITY.md)
- [Free-Tier Guardrails](FREE_TIER_GUARDRAILS.md)
- [NutsNews Infra Operations Platform](NUTSNEWS_INFRA_OPERATIONS_PLATFORM.md)
- [NutsNews Protected Ansible Apply Workflow](NUTSNEWS_PROTECTED_ANSIBLE_APPLY.md)
- [NutsNews Operations Portal v1](NUTSNEWS_OPERATIONS_PORTAL_V1.md)
- [NutsNews VPS Backups](NUTSNEWS_VPS_BACKUPS.md)
