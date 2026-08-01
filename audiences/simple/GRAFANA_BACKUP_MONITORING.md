---
title: Grafana Cloud Backup Monitoring
wiki:
  source_route: /technical/grafana-backup-monitoring/
  simple_route: /simple/grafana-backup-monitoring/
  primary_diagram:
    file: diagrams/GRAFANA_BACKUP_MONITORING.mmd
    accTitle: "Grafana Cloud Backup Monitoring diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: platform-and-data
  section: Operations & Monitoring
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 66e0d5a1b6a694d81fb23894f3c159bf039525191bfd00a797ab8cbcabdc7b4a
---

# Grafana Cloud Backup Monitoring

NutsNews uses Grafana Cloud Explore and Prometheus/PromQL to inspect home-server backup metrics before turning them into a dashboard.

This guide documents the backup-monitoring work for the home server named:

```text
chingadera
```

Prometheus data source in Grafana Cloud:

```text
grafanacloud-kindcantaloupe2036-prom
```

Confirmed backup metric:

```text
home_server_backup_last_success
```

Confirmed label set:

```text
instance="chingadera"
job="integrations/unix"
```

Confirmed result during setup:

```text
home_server_backup_last_success{instance="chingadera", job="integrations/unix"} = 1
```

Result meaning:

```text
1 = last backup succeeded
0 = last backup failed
```

---

## Why This Exists

The home server now has several operational responsibilities:

* Runs the local AI service for NutsNews.
* Hosts Ollama/qwen for local article review.
* Runs through Cloudflare Tunnel at `ai.nutsnews.com`.
* Provides live stats to the protected NutsNews admin page.
* Needs reliable backup visibility so recovery is not a guessing game.

The Grafana backup dashboard should answer four simple questions:

```text
When was the last backup?
Did the last backup succeed?
How many backups are available now?
When is the next backup expected?
```

---

## Open Grafana Explore

1. Open Grafana Cloud.
2. Go to **Explore**.
3. Select the Prometheus data source:

```text
grafanacloud-kindcantaloupe2036-prom
```

4. Use the query editor.
5. Switch from **Builder** mode to **Code** mode when writing raw PromQL.
6. Paste a query.
7. Click **Run query** or press **Shift + Enter**.

Useful view modes:

| Mode | When to use it |
| --- | --- |
| Table | Best for one current value |
| Graph | Best for history over time |
| Both | Good while testing a new query |

---

## Discover Backup Metrics

Before building panels, discover every backup metric being scraped:

```promql
{__name__=~"home_server_backup_.*", instance="chingadera", job="integrations/unix"}
```

Use this first because metric names may evolve as the backup script grows.

Expected backup metrics may include names like:

```text
home_server_backup_last_success
home_server_backup_last_run_timestamp_seconds
home_server_backup_last_success_timestamp_seconds
home_server_backup_available_count
home_server_backup_next_run_timestamp_seconds
```

Only build dashboard panels from metrics that actually return data in Explore.

---

## PromQL Queries

### Last Backup Success

Use this query for a stat panel:

```promql
home_server_backup_last_success{instance="chingadera", job="integrations/unix"}
```

Panel setup:

| Setting | Value |
| --- | --- |
| Visualization | Stat |
| Title | Last Backup Success |
| Unit | None |
| Value mapping | `1` → `Success` |
| Value mapping | `0` → `Failed` |
| Threshold | Green for `1`, red for `0` |

This is the first confirmed working backup query.

---

### Show Only Failed Backup State

Use this while troubleshooting or building an alert:

```promql
home_server_backup_last_success{instance="chingadera", job="integrations/unix"} == 0
```

If this returns a series, the last backup failed.

---

### Show Only Successful Backup State

Use this while validating the exporter:

```promql
home_server_backup_last_success{instance="chingadera", job="integrations/unix"} == 1
```

If this returns a series, the last backup succeeded.

---

### Last Backup Time

If the exporter provides a Unix timestamp metric, use:

```promql
home_server_backup_last_run_timestamp_seconds{instance="chingadera", job="integrations/unix"}
```

Panel setup:

| Setting | Value |
| --- | --- |
| Visualization | Stat |
| Title | Last Backup Time |
| Unit | Date & time |
| Query type | Instant |

If the metric exists but the unit looks wrong, confirm whether the value is seconds or milliseconds. Prometheus timestamp metrics should normally be seconds.

---

### Last Successful Backup Time

If the exporter tracks the last successful backup separately, use:

```promql
home_server_backup_last_success_timestamp_seconds{instance="chingadera", job="integrations/unix"}
```

Panel setup:

| Setting | Value |
| --- | --- |
| Visualization | Stat |
| Title | Last Successful Backup |
| Unit | Date & time |
| Query type | Instant |

This is better than last-run time because a failed run may be recent while the last successful backup may be old.

---

### Backup Age

If `home_server_backup_last_success_timestamp_seconds` exists, use this to show how stale the latest successful backup is:

```promql
time() - home_server_backup_last_success_timestamp_seconds{instance="chingadera", job="integrations/unix"}
```

Panel setup:

| Setting | Value |
| --- | --- |
| Visualization | Stat or Gauge |
| Title | Backup Age |
| Unit | Seconds, then display as duration |
| Threshold | Fresh under 30h, stale at or above 30h |

This panel is often more useful than the raw backup time because it immediately answers whether the backup is fresh.

---

### Backups Available Now

Use the exact metric name exported by the backup script.

Preferred query if the metric exists:

```promql
home_server_backup_available_count{instance="chingadera", job="integrations/unix"}
```

Alternative if the exporter uses a shorter name:

```promql
home_server_backup_count{instance="chingadera", job="integrations/unix"}
```

Panel setup:

| Setting | Value |
| --- | --- |
| Visualization | Stat |
| Title | Backups Available |
| Unit | None |
| Query type | Instant |
| Threshold idea | Red at `0`, amber at `1`, green at `2+` |

---

### Next Backup Time

If the exporter provides the next scheduled backup timestamp, use:

```promql
home_server_backup_next_run_timestamp_seconds{instance="chingadera", job="integrations/unix"}
```

Panel setup:

| Setting | Value |
| --- | --- |
| Visualization | Stat |
| Title | Next Backup |
| Unit | Date & time |
| Query type | Instant |

If this metric does not exist yet, keep the panel out of the dashboard until the backup script exports it.

---

## Recommended Dashboard Layout

Dashboard name:

```text
Home Server Backups
```

Suggested first row:

| Panel | Query | Visualization |
| --- | --- | --- |
| Last Backup Success | `home_server_backup_last_success{instance="chingadera", job="integrations/unix"}` | Stat |
| Last Successful Backup | `home_server_backup_last_success_timestamp_seconds{instance="chingadera", job="integrations/unix"}` | Stat |
| Backup Age | `time() - home_server_backup_last_success_timestamp_seconds{instance="chingadera", job="integrations/unix"}` | Stat or Gauge |
| Backups Available | `home_server_backup_available_count{instance="chingadera", job="integrations/unix"}` | Stat |
| Next Backup | `home_server_backup_next_run_timestamp_seconds{instance="chingadera", job="integrations/unix"}` | Stat |

Suggested second row:

| Panel | Purpose |
| --- | --- |
| Backup Success History | Shows when success changed over time |
| Backup Count History | Shows retention growth or cleanup behavior |
| Backup Age History | Shows whether backups are regularly becoming stale |

---

## Create the Dashboard From Explore

After a query works in Explore:

1. Open the query in Explore.
2. Click **Add to dashboard** or create a new panel from the query.
3. Choose or create the dashboard:

```text
Home Server Backups
```

4. Select the visualization type.
5. Set the panel title.
6. Set unit, value mappings, and thresholds.
7. Save the dashboard.

Start with the confirmed query:

```promql
home_server_backup_last_success{instance="chingadera", job="integrations/unix"}
```

Then add the timestamp/count panels only after those metrics show up in Explore.

---

## Alert Ideas

### Last Backup Failed

Alert condition:

```promql
home_server_backup_last_success{instance="chingadera", job="integrations/unix"} == 0
```

Trigger when the condition stays true for several minutes.

Recommended alert name:

```text
Home server backup failed
```

---

### Backup Is Too Old

Alert condition if the last-success timestamp exists:

```promql
time() - home_server_backup_last_success_timestamp_seconds{instance="chingadera", job="integrations/unix"} > 108000
```

This means the last successful backup is older than the standardized 30-hour
freshness window.

Infra source now schedules `nutsnews-restic-verify.timer` daily at `05:15` with
up to six hours of randomized delay and uses this same 30-hour overdue limit.
The read-only live scan still showed the older weekly schedule and 192-hour
threshold; the daily/30-hour contract is not live until protected apply and
post-apply verification succeed.

Recommended alert name:

```text
Home server backup stale
```

---

### No Backups Available

Alert condition if the backup count metric exists:

```promql
home_server_backup_available_count{instance="chingadera", job="integrations/unix"} < 1
```

Recommended alert name:

```text
No home server backups available
```

---

## Troubleshooting

### Query returns no data

Run the discovery query:

```promql
{__name__=~"home_server_backup_.*", instance="chingadera", job="integrations/unix"}
```

If nothing returns, check whether the home server is still exporting the backup metrics and whether Grafana Cloud is scraping the Unix integration successfully.

---

### Metric exists without the expected labels

Search without labels:

```promql
{__name__=~"home_server_backup_.*"}
```

Then inspect the returned labels and update the dashboard query.

The labels confirmed during setup were:

```text
instance="chingadera"
job="integrations/unix"
```

---

### Last success always shows `1`

That can be normal if backups are succeeding. To confirm history, switch the panel to Graph mode and increase the time range.

If the value never changes after a failed backup, check the backup script or textfile exporter that writes the metric.

---

### Date panel shows 1970 or a strange time

The timestamp metric may be missing, zero, or exported in the wrong unit.

Check the raw value in Explore:

```promql
home_server_backup_last_success_timestamp_seconds{instance="chingadera", job="integrations/unix"}
```

Prometheus timestamps should usually be Unix seconds, not milliseconds.


---

## NutsNews Database Backup Metrics

NutsNews also exports Supabase database backup metrics through the same Grafana Alloy textfile collector path used by the home-server image backup.

Metrics file on the home server:

```text
/var/lib/node_exporter/textfile_collector/nutsnews_db_backup.prom
```

Alloy reads the directory:

```text
/var/lib/node_exporter/textfile_collector
```

The database backup metrics use the prefix:

```text
nutsnews_db_backup_
```

Discovery query:

```promql
{__name__=~"nutsnews_db_backup_.*"}
```

Live verification on 2026-07-31 found that the host-local exporter is
unmanaged by the scanned repositories and does not yet emit
`nutsnews_db_backup_last_success_timestamp_seconds`. Its
`nutsnews_db_backup_last_run_timestamp_seconds` advances on failed attempts, so
that attempt timestamp is not a safe freshness substitute. Infra now
source-stages a tested hardened exporter that preserves durable last-success
state, writes atomically, and overwrites stale/corrupt input with explicit
unavailable metrics. It is not deployed or wired into the live job. The age
panel and stale alert below therefore remain post-deploy queries and must render
explicit unavailable state until fresh live evidence exists.

Live and source-staged panel queries:

| Panel | Query | Visualization |
| --- | --- | --- |
| NutsNews DB Backup Success | `nutsnews_db_backup_last_success` | Stat |
| NutsNews DB Backup Age (source-staged; not live) | `time() - nutsnews_db_backup_last_success_timestamp_seconds` | Stat or Gauge |
| NutsNews DB Backup Exporter Availability (source-staged; not live) | `nutsnews_db_backup_status_available` | Stat |
| NutsNews DB Backup Exporter Collection (source-staged; not live) | `nutsnews_db_backup_metrics_collection_success` | Stat |
| NutsNews DB Backup Duration | `nutsnews_db_backup_last_duration_seconds` | Stat |
| NutsNews DB Backup Size | `nutsnews_db_backup_last_size_bytes` | Stat |
| NutsNews DB Backup Files | `nutsnews_db_backup_last_file_count` | Stat |
| NutsNews DB Backups in OneDrive | `nutsnews_db_backup_cloud_available_count` | Stat |
| NutsNews DB Backup Timer Enabled | `nutsnews_db_backup_timer_enabled` | Stat |
| NutsNews DB Backup Timer Active | `nutsnews_db_backup_timer_active` | Stat |
| NutsNews DB Backup Next Run | `nutsnews_db_backup_next_run_timestamp_seconds` | Stat |

Recommended success mapping:

```text
1 = Success
0 = Failed
```

Recommended stale-backup alert:

```promql
time() - nutsnews_db_backup_last_success_timestamp_seconds > 108000
```

Recommended failed-backup alert:

```promql
nutsnews_db_backup_last_success == 0
```

The database backup schedule is daily at 3:15 AM with up to 10 minutes of
randomized delay. The shared 30-hour threshold is the authoritative freshness
window for Grafana, readiness, and incident handling. Failed attempts must not
advance the last-success timestamp; if the hardened metric is unavailable, the
panel shows an explicit unavailable state and the telemetry-loss rule handles
the gap.

### Backend Backup Freshness Source

Backend source separately implements durable backup state in the managed
textfile exporter. It emits
`nutsnews_backend_backup_status_available`,
`nutsnews_backend_backup_last_run_timestamp_seconds`,
`nutsnews_backend_backup_last_run_age_seconds`,
`nutsnews_backend_backup_last_success_timestamp_seconds`,
`nutsnews_backend_backup_last_success_age_seconds`,
`nutsnews_backend_backup_last_success_fresh`, and
`nutsnews_backend_backup_stale_after_seconds=108000`. Failed attempts preserve
the previous verified-success time. This is implemented source, not live proof;
deployment and fresh Grafana queries remain required.

---

## Relationship to NutsNews Admin Dashboards

Grafana Cloud is the best place for Prometheus time-series metrics and alerts.

The protected NutsNews admin pages are best for app-specific operational views such as:

* `/admin/home-server` for live instance stats from `https://ai.nutsnews.com/stats`.
* `/admin/local-ai` for model activity and local AI review behavior.
* `/admin/shards` for Worker refresh health.
* `/admin/feed-health` for RSS source quality.

The Grafana backup dashboard complements those pages by showing backup freshness and success history over time.

---

## Security Notes

Do not put backup secrets, database URLs, API keys, or private SSH details into Grafana panel titles, descriptions, annotations, labels, or public screenshots.

Safe to show:

```text
metric names
instance labels
job labels
success/failure values
timestamps
counts
```

Not safe to show:

```text
Supabase database password
backup destination credentials
LOCAL_AI_API_KEY
HOME_SERVER_STATS_API_KEY
Cloudflare tokens
private SSH keys
```
