---
title: "NutsNews Worker-Uplift Operations and Cutover Guide (Technical)"
description: "Technical mirror of the as-built operator guide for the shadow RabbitMQ worker pipeline, protected recovery, and a future reversible cutover."
wiki:
  source_route: "/technical/nutsnews-worker-uplift-operations-cutover-guide"
  simple_route: "/simple/nutsnews-worker-uplift-operations-cutover-guide"
  slug: "nutsnews-worker-uplift-operations-cutover-guide"
  primary_diagram:
    file: "diagrams/NUTSNEWS_WORKER_UPLIFT_OPERATIONS_CUTOVER_GUIDE.mmd"
    accTitle: "Worker uplift operating state and future cutover gates"
    accDescr: "The diagram shows that legacy ingestion remains the production owner while operators gather read-only evidence and keep the uplift shadow-only. Future cutover can only happen after separate approved controls are added, the DNS failover system stays independent, and a reversible watermark-based switch is proven."
  status: active
  collection: platform-and-data
  section: core-platform
  order: 233
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 424be6b785eb445cb7013d503ec05d13d632a1cddefe99b4a7070dbd6d46e351
---
# NutsNews Worker-Uplift Operations and Cutover Guide

This Technical mirror describes the current operating contract. The canonical
Technical source at
`NUTSNEWS_WORKER_UPLIFT_OPERATIONS_CUTOVER_GUIDE.md` contains the complete
commands, incident tables, immutable links, recovery sequences, evidence
record, and completion checklist.

> This guide is not cutover authorization. Legacy `nutsnews-worker` remains
> the production ingestion owner. The eight uplift services remain
> shadow-only and `production_writes_enabled=false`. Do not stop legacy
> ingestion, invoke production writes, or change DNS/failover from this guide.

## As-built boundary

| Surface | Owner | Current protected path |
| --- | --- | --- |
| Host apply | `nutsnews-backend` | `Protected Backend Ansible Apply` |
| Service and queue operations | `nutsnews-backend` | `Backend Worker Runtime Operations` |
| Broker recovery and drills | `nutsnews-backend` | `Backend RabbitMQ Recovery`, Canary, and Smoke |
| Backup and restore proof | `nutsnews-backend` | `Backend Backup Maintenance` and PostgreSQL proof |
| Credential readiness | `nutsnews-backend` | `Backend Credential Readiness` |
| Grafana resources | `nutsnews-infra` | `Grafana Cloud Plan` and Apply |
| Apex/www DNS failover | `nutsnews-infra` | `Cloudflare DNS Failover Apply` |
| Legacy ingestion scheduling | `nutsnews-worker` | `Controller Ingestion Scheduling Operations` |
| Admin projection | `nutsnews` | authenticated `/admin/shards` |
| Worker cutover | not authorized | #126 controls, #166 final gate, and #127 execution |

The existing backend `Backend Production Cutover` workflow is for the database
provider. It is not a worker-ingestion cutover.

## Action classes

- Read-only checks include public/application health and protected runtime,
  logs, queues, recovery status, telemetry, backup status, credential
  readiness, parity, and soak reports.
- Dry runs include Ansible check mode, runtime `dry_run=true`, reconciliation
  plans, Grafana plans, and DNS failover plan mode.
- Protected mutations include deploy, restart, scale, drain, rollback,
  reconciliation apply, smoke, drills, backups, restore drills, and infra
  applies.
- Worker promotion, worker cutover, legacy-ingestion disable, and generic DLQ
  replay apply have no approved current path before their downstream gates.

Use fixed workflows from `main`, inspect the workflow artifact, and record the
run, commit, artifact digest, safety state, and verification. A green
conclusion without artifact review is not enough.

## Runtime checks

Start with `Backend Worker Runtime Operations`, `action=status`, and
`dry_run=true`. Require:

- mode `shadow`;
- production writes `false`;
- all eight services healthy;
- every required main queue consumer count greater than zero;
- no unexpected blocked stage or restart loop.

Use fixed `logs`, `queue-inspect`, and `dlq-inspect` actions for one declared
service. Record queue depth, age, ready/unacknowledged counts, consumers,
publish/ack rates, retry depth, DLQ depth, and change over time. Inspect
metadata only; do not copy message bodies or credentials.

Require fresh data through `Backend RabbitMQ Metrics Check` and `Backend
Worker-Uplift Logs Check`. Telemetry loss does not prove broker loss; runtime
and queue status are the independent control-plane checks.

## Recovery decisions

Use protected `restart` when the digest and configuration are correct but the
consumer or channel did not recover. Use deployment recovery after a reviewed
manifest, image, environment, compose, or host correction. After either path,
prove `/ready`, consumer count greater than zero, reconnect/cancellation
signals, falling queue depth, and no new DLQ growth.

Scale only within the source-controlled limit of three and only after checking
idempotency, downstream capacity, host headroom, and backlog shape. `drain`
scales one service to zero; it does not wait for its queue to empty.

For a planned shadow stop, stop the scheduler, let main and retry queues reach
zero, then stop consumers from publication back toward fetcher. Resume
downstream consumers before the scheduler.

Generic DLQ replay apply fails closed. Fix the service or rule, produce a
dry-run plan, and use a service-owned reconciliation endpoint only when stage,
outbox, and watermark state can reconstruct work safely. Prove new message
identifiers, no duplicate final effect, no production visibility, and queue
drain.

## Broker, database, backup, and credential recovery

RabbitMQ is transport; backend PostgreSQL stage schemas, outboxes, and
watermarks are authoritative. Rebuild topology from backend source control,
restore least-privilege identities, start consumers downstream to upstream,
and reconstruct missing transport work through service-owned reconciliation.
Do not use live RabbitMQ data files as a normal backup.

Run backup status before selecting a verified snapshot. Use only the isolated
restore-drill and PostgreSQL backup-proof workflows for proof. Verify schema,
counts, watermarks, outboxes, and application checks before any reviewed live
recovery.

Credential values remain in protected stores. Rotate one route or
service-specific credential set at a time, validate inventory/readiness,
apply runtime files through protected Ansible, restart the smallest service
set, and verify runtime, queues, logs, metrics, and shadow smoke before
revoking the old credential. `LOCAL_AI_API_KEY` remains the retained source
mapping for approval and translation Qwen files.

## Grafana and administration

Infra owns these dashboards:

- Worker-Uplift RabbitMQ Overview;
- Queue Drilldown;
- RabbitMQ Resources;
- Pipeline SLOs.

The RabbitMQ guardrail alerts cover broker/canary/Alloy loss, zero consumers,
backlog and age, publish/ack divergence, unacknowledged messages, retry/DLQ
growth, connection churn, resource alarms, stale recovery evidence, restarts,
and SLO burn.

The as-built targets are 99.5% monthly broker availability, 99% stage success,
stage p95 below 30 seconds, feed freshness below 30 minutes, retry/DLQ ratio
below 1%, and 99% final-publication success. The active-series ceiling is
5,000; worker, broker, and total backend log budgets are 2 GB, 1 GB, and
5 GB/month. Respond at 70%, 85%, and 95% usage as described by the canonical
guide, and keep uplift disabled when over budget.

The authenticated `/admin/shards` page is a sanitized PostgreSQL projection.
It does not grant host, broker, Grafana, or DNS control.

## DNS failover invariant

Worker-ingestion changes must preserve the `nutsnews-dns-failover` Worker,
`DnsFailoverController`, active Durable Object state, cron and alarm loop,
status and protected action endpoints, alerting, emergency manual DNS path,
and Analytics Engine evidence contract.

At the pinned infra baseline, the infra `wrangler.toml` declares the Durable
Object but not `FAILOVER_ANALYTICS`. The legacy controller contains the
optional best-effort Analytics Engine writer and dataset contract. Before
readiness, infra must prove the active binding, migrate and test it, or record
owner acceptance of the unbound residual risk. Analytics failure must never
block DNS failover.

Stopping legacy ingestion in a future issue does not authorize controller
retirement or DNS changes.

## Legacy ingestion-scheduling control

Worker PR #171 at merge `a073e351e5716a97e0759cca17096851cbb80261`
separates shard dispatch from the retained failover controller. Missing
`INGESTION_SCHEDULING_ENABLED` defaults to enabled. Scheduled and manual
ingestion wake/check failover first, then skip only shard refresh and
translation-backlog dispatch when explicitly disabled. The safe machine
signal is `GET` or `HEAD /ingestion-scheduling/status`.

Use `Controller Ingestion Scheduling Operations` from `main`. `status` is
read-only; `plan` renders and Wrangler-dry-runs an exact state; protected
`apply` deploys the exact controller configuration. The active state remains
enabled. Until #166 and #127, only an enabled apply is authorized; a disabled
plan is not cutover permission. Re-enable through the same protected workflow
and verify the status artifact to roll back without editing code.

Post-merge Worker Pipeline 30690135595, protected enabled apply 30690227183,
disabled dry-run plan 30690250417, and live status 30690250981 all passed.
Their artifacts prove that Worker identity, routes, cron, bindings, Durable
Object migrations, and failover surfaces are retained.

## Future sequence

1. Keep current coexistence: legacy production owner, uplift shadow-only, DNS
   failover independent.
2. #125 recorded GO for guarded control implementation, not cutover.
3. #150 has separated ingestion scheduling from DNS failover and preserved
   the enabled legacy-owner baseline.
4. #126 adds fixed reversible owner, scheduling, write, watermark, and rollback
   controls.
5. #127 establishes the watermark, proves drain/reconciliation/backups, and
   switches only through the protected workflow while legacy becomes standby.
6. Observe against consumers, queues, DLQs, parity, SLOs, quotas, admin state,
   and DNS-controller health. Roll back only within the verified
   synchronization boundary; otherwise use forward recovery.
7. #128 may retire legacy ingestion after observation but must retain DNS
   failover. #151 records the final architecture.

No current workflow implements the ingestion handoff. The runtime `promote`
action is not a substitute.

## Incident exit criteria

Do not close an incident until the appropriate evidence proves:

- legacy owner and write guardrails remained correct;
- the affected dependency is healthy;
- service readiness and required consumer counts are restored;
- queues drain and retry/DLQ counts stabilize;
- outboxes, watermarks, backups, and reconciliation agree;
- Grafana metrics/logs, SLOs, quota, and admin projection are current;
- DNS failover state did not change because of worker recovery;
- no secret, payload, private header, or improvised manual mutation entered
  the evidence.
