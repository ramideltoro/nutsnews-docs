---
title: "Observe Metrics Freshness"
description: "Keep backend telemetry fresh without changing health thresholds."
wiki:
  source_route: "/technical/observe-metrics-freshness"
  simple_route: "/simple/observe-metrics-freshness"
  slug: "observe-metrics-freshness"
  primary_diagram:
    file: "diagrams/OBSERVE_METRICS_FRESHNESS.mmd"
    accTitle: "Observe monitoring and isolated recovery"
    accDescr: "Reviewed changes improve telemetry freshness and log coverage. Encrypted backups are restored in a private resource-limited environment, with recovery credit only after real application checks pass."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 990
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-09-20T16:37:33.137Z"
    technical_source_hash: 720dd286624160056806845c251a03d87e692999290ee82edd4200478087a446
---
# Observe metrics freshness

The textfile collector previously ran every five minutes, exceeding Observe's existing 180-second warning threshold between otherwise successful collections. A September 20 read-only sample measured four seconds elapsed, 1.73 CPU seconds and 35 MB peak memory. Collect every minute; retain scoring thresholds and collector logic.

Run the protected Observe metrics cadence workflow with apply=false, then apply=true after preflight passes. It installs one timer drop-in and restarts only that timer. No application, database, container, or shadow worker is restarted. Full backend baseline application is unnecessary. The Ansible default matches the new cadence.

Verify repeated fresh timestamps in the exported metrics and healthy public endpoints, and compare application PIDs and container identities. Roll back through the same protected deployment identity with scripts/apply-observe-metrics-cadence.sh rollback; remove only this drop-in. If the Ansible baseline has subsequently been applied, revert its cadence too through a reviewed change.

## Production application log coverage

Observe reads a sanitized, root-owned evidence file refreshed every five minutes. All three active Cloudflare production ingestion shards must have log activity within one hour; collection must be less than twenty minutes old. Provider failures, wrong-service records, missing streams and future timestamps grant no coverage. Only timestamps and scope reach public health. A logged failed request proves log collection, not ingestion success. No paid subscription was enabled.

## Isolated recovery of inactive workers

The fixed Observe exporter includes scheduler and translation inputs. `docker cp CONTAINER:/app/. -` reads deployed files from running or stopped containers without executing a process inside them. It never starts, restarts or changes the live worker. Configuration and database exports continue through the restricted recovery account into encrypted archives.

The local recovery service restores actual PostgreSQL state and broker topology in a disposable private network with two CPUs and eight GiB. Scheduler verification requires backed-up leases, dependency readiness, new isolated leases and messages from restored feed data. Translation requires restored completed-message replay and an isolated Qwen inference. Failed restoration stays failed; no readiness or production-performance credit follows from this drill.

Apply only the protected Observe recovery configuration workflow, first with apply=false. The unrelated full baseline must not run for this exporter-only release because adopted application configuration has drift. Rollback the exporter revision through this same scoped workflow. Existing exports remain supported.
