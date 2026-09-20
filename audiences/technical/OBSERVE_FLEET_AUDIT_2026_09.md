---
title: "Observe fleet enrollment and deployment audit (Technical)"
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
# Observe fleet enrollment and deployment audit

## Purpose and scope
[Observe](https://observe.ramideltoro.com) is the central presentation surface for current NutsNews deployments. Grafana Cloud remains the metrics and private log backend. The September 19, 2026 audit inspected 92 GitHub repositories, Cloudflare Worker deployments, five reachable servers, container state, image revision labels and public HTTPS endpoints. CI success is not accepted as proof of a running deployment.

## Verified runtime
The NutsNews frontend and its Caddy/auth containers run on the primary VPS. The Backend VPS runs PostgreSQL 18, the worker compatibility API, RabbitMQ, Wiki AI and the independent worker uplift containers. The local server continues serving production Qwen. Cloudflare has the ingestion controller and 25 worker scripts deployed.

The uplift scheduler, fetcher, canonicalizer, enrichment, approval, translation, persistence and publication stages now have separate Observe entries and dashboards. All eight are labeled shadow and expected_active=0 by current telemetry configuration. Six containers were healthy at inspection. Scheduler was running but unhealthy and its metrics scrape failed. Translation was stopped with a containerd task-directory collision recorded in Docker state. These failures remain visible; enrollment neither promotes a shadow service nor changes production ingestion ownership.

## Metrics and portal boundaries
Each stage dashboard uses fixed job=nutsnews-worker-uplift and service selectors. It shows metrics endpoint availability, readiness, expected ownership, in-flight work, consumer count and stage event rate. Missing samples are unknown, not zero successes. RabbitMQ exposes scrape health, ready/unacknowledged messages and acknowledgement throughput. The Backend API entry links readiness and existing backend dashboards. Cloudflare production ingestion freshness uses existing worker success timestamps.

Public views contain approved numeric queries and anonymous series labels. Private logs, secrets, arbitrary queries and owner operations remain protected. Runtime revision evidence is a dated snapshot from container image labels; it is not a continuous source-to-production equality guarantee. Mobile client runtime is outside server reachability verification.

## Deployment and recovery
The implementation is owned by local-server-observability and local-server-infra. The deployment coordinator validates documentation source fingerprints, tests production Qwen before and after activation, enrolls telemetry, activates an immutable portal release and synchronizes Grafana dashboards. Raspberry receiver instrumentation and KubeQuest coverage are documented in the [fleet enrollment runbook](https://localserver.wiki.ramideltoro.com/technical/fleet-enrollment/).

Portal rollback restores the previous immutable release. Do not restart or promote stopped shadow workers merely to clear the dashboard. Diagnose their qualified image, readiness and ownership contract first. No NutsNews production routing, credentials, model selection or worker ownership was changed by this enrollment.

## Validation evidence
The portal passed TypeScript checking, production build and 39 automated tests. Infrastructure passed eight tests and GitHub Ansible/shell syntax checks. The wiki production build passed. Live deployment verification additionally requires new sample freshness, dashboard queries and owner-route protection; build success alone is insufficient.
