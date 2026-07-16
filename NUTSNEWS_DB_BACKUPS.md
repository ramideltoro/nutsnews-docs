# NutsNews Supabase Backup Automation

This runbook documents the production Supabase backup automation for NutsNews.

The goal is to satisfy GitHub issue #11 by making database backups automatic, off-machine, timestamped, observable, and easy to run on demand.

---

## Current Production Setup

| Item | Value |
| --- | --- |
| Server | Home server `chingadera` |
| Backup source | Supabase Postgres production database |
| Backup destination | Encrypted rclone remote `homebackup:nutsnews-db-backups` |
| Cloud storage behind remote | OneDrive through the existing home-server rclone setup |
| Local staging path | `/srv/nutsnews-db-backups` |
| Script | `/usr/local/sbin/nutsnews-db-backup.sh` |
| Config file | `/etc/nutsnews-backup/nutsnews-db-backup.env` |
| Log file | `/var/log/nutsnews-db-backup.log` |
| Systemd service | `nutsnews-db-backup.service` |
| Systemd timer | `nutsnews-db-backup.timer` |
| Metrics file | `/var/lib/node_exporter/textfile_collector/nutsnews_db_backup.prom` |
| Grafana pipeline | Grafana Alloy textfile collector → Grafana Cloud Prometheus |

The `homebackup` rclone remote is encrypted. Backup files are uploaded to OneDrive through that encrypted remote, not to a plain local OneDrive folder.

---

## What Gets Backed Up

The automated backup exports the current operational tables needed for the public feed, RSS source management, AI review history, and AI usage visibility.

| Table | Purpose |
| --- | --- |
| `public.articles` | Published positive news articles shown by the site and app |
| `public.rss_feeds` | RSS source list and source configuration |
| `public.article_ai_reviews` | AI accept/reject decisions, categories, reasons, model/provider metadata |
| `public.article_summaries` | Localized titles and summaries for supported languages such as French |
| `public.ai_usage_runs` | AI run accounting and Worker usage history |

The script intentionally uses a focused `pg_dump` table list instead of dumping every Supabase object.

The GitHub Actions REST backup artifact in `ramideltoro/nutsnews` now also exports `public.feed_health`, `public.worker_runs`, `public.quota_usage_events`, `public.runtime_feature_flags`, and `public.release_readiness` so the scheduled restore fire drill can validate the operational tables used by admin readiness and recovery checks. That artifact is for automated validation, diagnostics, and quick table-level recovery support; the encrypted home-server `pg_dump` remains the stronger production recovery source.

---

## Backup Format

Each run creates a timestamped folder like:

```text
nutsnews-db-2026-06-24_16-32-16/
```

Inside that folder:

```text
metadata/
nutsnews-db-public-tables.sql.gz
SHA256SUMS
```

The SQL dump is gzip-compressed and validated with `gzip -t` before upload.

The backup is uploaded with `rclone copy` and verified with `rclone check`.

For encrypted rclone remotes, `rclone check` may print:

```text
No common hash found - not using a hash for checks
```

That is expected for this encrypted remote. The important success signal is that the run ends with `Backup completed successfully` and reports zero differences / matching files.

---

## GitHub Actions Restore Fire Drill

Related issue: https://github.com/ramideltoro/nutsnews/issues/110

### Simple Summary

NutsNews now checks that a backup can actually wake back up. The daily GitHub backup job makes files, puts them into a pretend database, and checks that the restored database looks right.

### Intermediate Summary

The `ramideltoro/nutsnews` app repo keeps its scheduled `Supabase Backup` workflow, but the job now also starts a disposable local Supabase database, restores the generated REST backup artifact into it, runs `supabase/restore_validation.sql`, writes `reports/supabase-restore/latest.md`, and uploads that report as a GitHub Actions artifact. Admins can use the latest successful workflow run as the visible restore-check record.

### Expert Summary

Issue #110 adds `scripts/supabase_restore_fire_drill.mjs` to validate backup manifests, artifact checksums, freshness, required table coverage, and required non-empty tables before mutating any database. Routine runs use `--local-supabase`, which reads the local Supabase database URL and refuses non-local restore targets unless `NUTSNEWS_RESTORE_FIRE_DRILL_ALLOW_REMOTE=true` is explicitly set for an isolated remote drill. The script truncates only the exported tables in the disposable target, restores rows with PostgreSQL `jsonb_populate_recordset`, filters generated columns such as `articles.search_vector` out of the insert projection, writes the generated restore SQL to a temporary file before invoking `psql --file` so large restores do not fail on stdin pipe limits, runs the existing `supabase/restore_validation.sql`, and writes Markdown/JSON reports under `reports/supabase-restore/`. The fire drill also exposed that production `article_ai_reviews.id` values are UUIDs, so the app migration set now aligns fresh disposable databases with that UUID primary key while refusing to rewrite a populated bigint table implicitly. The scheduled workflow uploads both `supabase-rest-backup` and `supabase-restore-fire-drill-report` artifacts with 14-day retention. Rollback is to revert the app PR that added the restore script/workflow wiring and keep the older backup artifact path; production data is not changed by the fire drill.

```mermaid
flowchart TD
  A[Supabase Backup workflow] --> B[Export production REST table artifacts]
  B --> C[Write manifest with checksums and table counts]
  C --> D[Start disposable local Supabase]
  D --> E[Reset local schema from repo migrations]
  E --> F[Restore artifact rows into local tables]
  F --> G[Run supabase/restore_validation.sql]
  G --> H[Write reports/supabase-restore/latest.md and .json]
  H --> I[Upload backup and restore-report artifacts]
  I --> J[/admin/readiness backup card reads latest workflow status when ACTIONS_READ_TOKEN exists]
```

One-command local fire drill after creating or downloading a REST backup artifact:

```bash
node scripts/supabase_restore_fire_drill.mjs \
  --backup-dir backups/supabase \
  --local-supabase
```

If using a disposable database URL instead of local Supabase:

```bash
RESTORE_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  node scripts/supabase_restore_fire_drill.mjs --backup-dir backups/supabase
```

Failure next steps:

1. Open the failed `Supabase Backup` workflow run.
2. Download `supabase-restore-fire-drill-report` and read `latest.md`.
3. Confirm the backup manifest is fresh, lists every expected table, and has no table export errors.
4. Confirm the disposable Supabase reset reached the current repo migrations.
5. Rerun the workflow manually after fixing the failed export, schema, or validation query.
6. Do not use that backup for production recovery until the fire drill passes.

Risks and mitigations:

| Risk | Mitigation |
| --- | --- |
| The REST artifact is table-limited and not a full logical dump | Keep the encrypted home-server `pg_dump` as the primary recovery source; use the REST artifact for automated restore validation and diagnostics. |
| A stale artifact creates false confidence | The restore script rejects manifests older than the configured freshness window, defaulting to 30 hours. |
| A restore command targets production by accident | The script refuses non-local database URLs by default. Remote restore drills require an explicit override and must use an isolated target. |
| A workflow succeeds without a durable record | The job writes the report into the GitHub step summary and uploads `supabase-restore-fire-drill-report`. |
| Backup table coverage drifts | Regression checks assert the workflow, table list, restore command, and report upload remain wired. |

---

## Schedule

The systemd timer runs daily:

```text
03:15 AM America/New_York
```

The timer also has:

```text
RandomizedDelaySec=10min
Persistent=true
```

That means the run may start a few minutes after 3:15 AM, and missed runs can fire after the server comes back online.

Check the next scheduled run:

```bash
systemctl list-timers --all | grep nutsnews-db-backup
```

---

## Retention Policy

The production config uses:

| Backup class | Retention |
| --- | --- |
| Daily backups | 14 days |
| Weekly Sunday backups | 8 weeks |
| Monthly first-of-month backups | 12 months |

The config values live in:

```text
/etc/nutsnews-backup/nutsnews-db-backup.env
```

Expected keys:

```bash
DATABASE_URL="postgres://..."
REMOTE_NAME="homebackup"
REMOTE_PATH="nutsnews-db-backups"
LOCAL_BACKUP_DIR="/srv/nutsnews-db-backups"
KEEP_DAILY_DAYS="14"
KEEP_WEEKLY_WEEKS="8"
KEEP_MONTHLY_MONTHS="12"
```

Do not commit this config file. It contains the Supabase database connection string.

---

## On-Demand Backup

Run a backup immediately:

```bash
ssh -t rami@192.168.1.115 'nutsnews-db-backup-now'
```

Or run the service directly:

```bash
ssh -t rami@192.168.1.115 'sudo systemctl start nutsnews-db-backup.service'
```

Watch status and recent logs:

```bash
ssh -t rami@192.168.1.115 'nutsnews-db-backup-status'
```

List available encrypted OneDrive backups:

```bash
ssh -t rami@192.168.1.115 'nutsnews-db-backup-list'
```

---

## Manual Health Checks

Check the timer:

```bash
ssh -t rami@192.168.1.115 'systemctl status nutsnews-db-backup.timer --no-pager'
```

Check the service:

```bash
ssh -t rami@192.168.1.115 'systemctl status nutsnews-db-backup.service --no-pager || true'
```

Check recent logs:

```bash
ssh -t rami@192.168.1.115 'sudo tail -100 /var/log/nutsnews-db-backup.log'
```

Check the encrypted remote folder:

```bash
ssh -t rami@192.168.1.115 '
sudo env RCLONE_CONFIG=/home/rami/.config/rclone/rclone.conf \
  rclone lsf homebackup:nutsnews-db-backups --dirs-only | sort | tail -20
'
```

---

## Metrics

The backup script writes Prometheus textfile metrics to:

```text
/var/lib/node_exporter/textfile_collector/nutsnews_db_backup.prom
```

Grafana Alloy already reads the textfile collector directory and remote-writes metrics to Grafana Cloud.

Useful metrics:

| Metric | Meaning |
| --- | --- |
| `nutsnews_db_backup_last_success` | `1` when the last DB backup succeeded, `0` when it failed |
| `nutsnews_db_backup_last_run_timestamp_seconds` | Unix timestamp of the last DB backup run |
| `nutsnews_db_backup_last_duration_seconds` | Last DB backup duration |
| `nutsnews_db_backup_last_size_bytes` | Size of the local backup folder before upload cleanup |
| `nutsnews_db_backup_last_file_count` | Number of files generated for the last backup |
| `nutsnews_db_backup_cloud_available_count` | Count of backup folders available in OneDrive through `homebackup` |
| `nutsnews_db_backup_latest_cloud_backup_timestamp_seconds` | Timestamp parsed from the latest cloud backup folder |
| `nutsnews_db_backup_next_run_timestamp_seconds` | Next scheduled systemd timer run |
| `nutsnews_db_backup_timer_enabled` | `1` when the timer is enabled |
| `nutsnews_db_backup_timer_active` | `1` when the timer is active |
| `nutsnews_db_backup_service_active` | `1` while the backup service is currently running |

Local metric check:

```bash
ssh -t rami@192.168.1.115 '
sudo grep -E "^nutsnews_db_backup_" \
  /var/lib/node_exporter/textfile_collector/nutsnews_db_backup.prom
'
```

Grafana Explore queries:

```promql
nutsnews_db_backup_last_success
```

```promql
time() - nutsnews_db_backup_last_run_timestamp_seconds
```

```promql
nutsnews_db_backup_last_duration_seconds
```

```promql
nutsnews_db_backup_last_size_bytes
```

```promql
nutsnews_db_backup_cloud_available_count
```

Recommended alert:

```promql
nutsnews_db_backup_last_success == 0
```

Recommended stale-backup alert:

```promql
time() - nutsnews_db_backup_last_run_timestamp_seconds > 93600
```

`93600` seconds is 26 hours. That gives the daily 3:15 AM timer a little grace window.

---

## Restore Notes

Do not restore directly over production first.

Recommended recovery flow:

1. Pause database writers: controller cron, Worker shard manual runs, feed edits, and backfill scripts.
2. Pick the backup folder from `homebackup:nutsnews-db-backups`.
3. Copy the backup down to a temporary restore folder.
4. Restore into a temporary Supabase database first.
5. Run `supabase/restore_validation.sql`.
6. Test the web app/API and one Worker shard against the temporary database.
7. Take a final safety export of current production.
8. Restore production only after the temporary restore passes.
9. Re-enable writers and watch Grafana, Better Stack, Sentry, and admin dashboards.

See [`SUPABASE_RESTORE.md`](SUPABASE_RESTORE.md) for the full restore runbook.

---

## Restore Drill Commands

Copy the latest backup folder from OneDrive to the home server:

```bash
ssh -t rami@192.168.1.115 '
LATEST="$(
  sudo env RCLONE_CONFIG=/home/rami/.config/rclone/rclone.conf \
    rclone lsf homebackup:nutsnews-db-backups --dirs-only \
    | sed "s#/$##" \
    | sort \
    | tail -n 1
)"

sudo mkdir -p "/srv/nutsnews-restore-test/${LATEST}"
sudo env RCLONE_CONFIG=/home/rami/.config/rclone/rclone.conf \
  rclone copy "homebackup:nutsnews-db-backups/${LATEST}" \
  "/srv/nutsnews-restore-test/${LATEST}"

sudo ls -la "/srv/nutsnews-restore-test/${LATEST}"
sudo gzip -t "/srv/nutsnews-restore-test/${LATEST}/nutsnews-db-public-tables.sql.gz"
'
```

Do not run `psql` against production for a restore drill. Use a temporary database connection string.

---

## Security Notes

Do not paste or commit:

* `DATABASE_URL`
* Supabase database password
* Supabase service role key
* rclone encrypted remote passwords
* Grafana Cloud API tokens
* Cloudflare tokens

Safe to document:

* service names
* timer names
* metric names
* backup folder naming pattern
* retention policy
* table names
* non-secret helper commands

If a database URL or Grafana Cloud token is exposed in a chat, ticket, screenshot, or log, rotate it.

---

## GitHub Issue #11 Completion Checklist

| Requirement | Status |
| --- | --- |
| Pick backup destination | Done: encrypted OneDrive via `homebackup:nutsnews-db-backups` |
| Export article data | Done: `public.articles` |
| Export RSS feeds | Done: `public.rss_feeds` |
| Export AI review history | Done: `public.article_ai_reviews` |
| Export localized summaries | Done: `public.article_summaries` after updating the home-server backup script |
| Export AI usage runs | Done: `public.ai_usage_runs` |
| Store timestamped backups | Done: `nutsnews-db-yyyy-mm-dd_hh-mm-ss` folders |
| Support on-demand backup | Done: `nutsnews-db-backup-now` and systemd service |
| Automate schedule | Done: daily systemd timer at 3:15 AM with randomized delay |
| Purge old backups | Done: 14 daily / 8 weekly / 12 monthly retention |
| Expose metrics | Done: Prometheus textfile metrics for Grafana Alloy |
| Document restore path | Done: this doc + `SUPABASE_RESTORE.md` |
