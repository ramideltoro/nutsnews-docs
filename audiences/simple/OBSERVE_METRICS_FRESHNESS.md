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
# Keep backend monitoring up to date

The backend previously refreshed monitoring data every five minutes. Observe warns after three minutes, so healthy monitoring could appear stale. Refreshing every minute fixes that mismatch without changing the score rules.

The protected deployment checks the change first, then restarts only the monitoring timer. Production apps, databases and shadow workers stay running in their existing state. Verify that monitoring timestamps stay fresh and public pages remain healthy. If necessary, remove the timer change through the protected pipeline.

Observe also checks that each of the three production news-processing workers has recent logs. The dashboard receives only timestamps, not private log contents. A worker can have working logs and still fail to process news; those failures remain visible.

Recovery testing copies the scheduler and translation worker into a private disposable environment. Their live containers stay unchanged. The test must use restored data and show real isolated behavior before Observe credits recovery. It does not prove production speed or activate either worker.
