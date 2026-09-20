---
title: "Observe fleet enrollment and deployment audit (Simple)"
description: "Draft documentation for Observe fleet enrollment and deployment audit."
wiki:
  source_route: "/technical/observe-fleet-audit-2026-09"
  simple_route: "/simple/observe-fleet-audit-2026-09"
  slug: "observe-fleet-audit-2026-09"
  primary_diagram:
    file: "diagrams/OBSERVE_FLEET_AUDIT_2026_09.mmd"
    accTitle: "Observe fleet enrollment and deployment audit telemetry flow"
    accDescr: "Verified runtime metrics flow to Grafana Cloud and approved portal dashboards; private logs require owner authentication."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 1000005
  approval:
    state: unreviewed
    publishing: blocked
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 7e913eccb54c6e71bf47c40e226bee5bfb0bf702f47829c3922bab77698e8fef
---
# NutsNews in Observe

## Where to look
Open [Observe](https://observe.ramideltoro.com) to see NutsNews servers, the Backend API, message queue and worker stages together. The portal reads the existing monitoring service, so old monitoring history stays available.

## What the audit found
All five checked servers were reachable. Six newer worker containers were healthy, the scheduler was unhealthy, and translation was stopped. These newer workers are in shadow mode, which means they are not the owners of production ingestion. The monitoring change keeps those settings intact.

## What the charts mean
A reachable metrics endpoint shows that monitoring can contact a worker. Readiness checks whether the worker reports itself ready. Queue charts show waiting and unacknowledged messages. No data means the result is unknown; it does not mean everything is healthy. A repository or a successful build alone cannot prove that an application is running.

## What stays private
Public charts show approved numbers. Logs, credentials and controls require owner sign-in. The dated deployment revision records what the audit found, and may become older than a later release. Phone-app activity cannot be verified by checking a server.

## When a worker is unhealthy
Use its dashboard and private diagnostics to investigate. Do not enable a shadow worker just to turn a status green. The [fleet guide](https://localserver.wiki.ramideltoro.com/technical/fleet-enrollment/) explains coverage and recovery. Production routing and Qwen model selection stay as they were.
