---
title: "NutsNews Worker-Uplift Incident and Rollback Record (Technical)"
description: "Technical mirror for the completed worker-uplift rollback, stable shadow baseline, quarantined failed candidate, and read-only evidence boundary."
wiki:
  source_route: "/technical/nutsnews-worker-uplift-operations-cutover-guide"
  simple_route: "/simple/nutsnews-worker-uplift-operations-cutover-guide"
  slug: "nutsnews-worker-uplift-operations-cutover-guide"
  primary_diagram:
    file: "diagrams/NUTSNEWS_WORKER_UPLIFT_OPERATIONS_CUTOVER_GUIDE.mmd"
    accTitle: "Worker uplift cutover incident and completed rollback"
    accDescr: "The failed cutover rolled back to stable generation 5 shadow with legacy ownership and scheduling restored, uplift writes disabled, observation never started, and the failed candidate quarantined."
  status: active
  collection: platform-and-data
  section: core-platform
  order: 233
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 83e12961d48fd31be6bced1e342b2c369de67a3ae7fa31f6a02b51c0ac503ea6
---
# NutsNews Worker-Uplift Incident and Rollback Record

This Technical mirror describes the current operating contract. The canonical
Technical source at
`NUTSNEWS_WORKER_UPLIFT_OPERATIONS_CUTOVER_GUIDE.md` contains the complete
commands, incident tables, immutable links, recovery sequences, evidence
record, and completion checklist.

> **Current incident override (2026-08-01).** The older Runtime 0.x cutover
> failed publication (28 messages, 84 handler-error retries, zero success) and
> breached public freshness before observation started. Backend run
> [30715252632](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30715252632)
> completed rollback prepare but failed before finalize. Worker run
> [30715293972](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715293972)
> deployed legacy scheduling true; its immediate verifier raced propagation,
> then worker runs
> [30715590990](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715590990)
> and [30715611673](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715611673)
> verified scheduling true. Backend run
> [30715566651](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30715566651)
> completed finalize. The authoritative row is stable `shadow` generation 5,
> owner `legacy_shards`, legacy dispatch true, uplift scheduler true in shadow,
> uplift writes false, publication shadow, observation timestamps null, and
> single-writer/DNS checks passing.

> **Backend source hardening.** Backend
> [`PR #482`](https://github.com/ramideltoro/nutsnews-backend/pull/482), merge
> `510b775d7962e2e66d430fb6d458c3c88d60cdd3`, persists the immutable receipt,
> consumes historical transition authority, and guards future backend
> mutations. Backend
> [`PR #483`](https://github.com/ramideltoro/nutsnews-backend/pull/483), merge
> `5531014000f52fd6101f8617463d5f2c887d0788`, repairs the forward publication
> contract and stable business-command idempotency. Both are source-only: no
> host/runtime deploy or replay occurred. The worker deploy guard and infra
> verifier remain unfinished and frozen.

> **Freeze.** Use read-only evidence only until incident reconciliation and the
> unfinished worker deploy guard and infra verifier are complete. Do not run
> full rollback again or any generic worker/backend mutation, replay,
> reconciliation, Grafana apply, synthetic rollout, Runtime 1/fetcher v2
> deployment, or web merge. The sole rollback is complete; do not rerun cutover,
> rollback, or finalize. The failed Runtime 0.x candidate is disqualified and
> quarantined. No automatic rollback or recovery replay ran. See
> the [central incident evidence](https://github.com/ramideltoro/nutsnews-infra/issues/474#issuecomment-5153075316).

## As-built boundary

| Surface | Owner | Current protected path |
| --- | --- | --- |
| Host apply | `nutsnews-backend` | Frozen |
| Service and queue operations | `nutsnews-backend` | Read-only status/log/queue inspection; mutations frozen |
| Broker recovery and drills | `nutsnews-backend` | Read-only status/artifacts only; rebuild, canary fixture, and smoke mutations frozen |
| Backup and restore proof | `nutsnews-backend` | Read-only status/artifacts only; backup and restore mutations frozen |
| Credential readiness | `nutsnews-backend` | Read-only readiness evidence only; value/runtime changes frozen |
| Grafana resources | `nutsnews-infra` | Read-only evidence; apply frozen |
| Apex/www DNS failover | `nutsnews-infra` | Read-only status/evidence only; DNS apply/writes frozen |
| Legacy ingestion scheduling | `nutsnews-worker` | Public state verified true; read-only status only |
| Admin projection | `nutsnews` | authenticated `/admin/shards` |
| Reversible worker controls | `nutsnews-backend` | Rollback complete; no rerun authorized |
| Backend post-incident source guards | `nutsnews-backend` | PRs #482 and #483 merged source-only; no host/runtime deploy or replay |
| Remaining source blockers | worker and infra | Worker deploy guard and infra verifier unfinished and frozen |
| Runtime 1 blocker | `nutsnews-backend` | PR #471 is conflicting and undeployed; reconcile PR #483, authoritative generation 5 ownership, and separate exact-eight runtime recreation |
| Grafana baseline | `nutsnews-infra` | Pre-freeze apply 30708192621 created five synthetics and verified populated baseline queries; later PR #473/SLO/canary/drill work remains frozen |
| Forecast acknowledgment | `nutsnews-infra` | Standing-major acknowledgment verified true at 2026-08-01 20:29:46 UTC; no Grafana apply or synthetic-shape mutation |

The existing backend `Backend Production Cutover` workflow is for the database
provider. It is not a worker-ingestion cutover.

## Action classes

- Read-only checks include public/application health and protected runtime,
  logs, queues, recovery status, telemetry, backup status, credential
  readiness, parity, and soak reports.
- Dry runs and protected mutations are capability history and are frozen during
  the post-rollback hold.
- Full rollback rerun, generic runtime rollback, deploy, restart, scale, drain,
  replay, reconciliation, Ansible, Grafana apply, synthetics, web merge,
  Runtime 1, and fetcher v2 have no current incident authorization.
- Cutover, rollback, and finalize are complete and must not be rerun.

Use fixed workflows from `main`, inspect the workflow artifact, and record the
run, commit, artifact digest, safety state, and verification. A green
conclusion without artifact review is not enough.

## Runtime checks

Use the read-only `status`, `logs`, and queue inspection actions. Treat the
static shadow/write-disabled projection as service evidence only; it cannot
replace the authoritative finalize artifact. Cross-check stable generation 5
shadow, public scheduling true, service and queue state, and publication
evidence.

Use fixed `logs`, `queue-inspect`, and `dlq-inspect` actions for one declared
service. Record queue depth, age, ready/unacknowledged counts, consumers,
publish/ack rates, retry depth, DLQ depth, and change over time. Inspect
metadata only; do not copy message bodies or credentials.

Require fresh data through `Backend RabbitMQ Metrics Check` and `Backend
Worker-Uplift Logs Check`. Telemetry loss does not prove broker loss; runtime
and queue status are the independent control-plane checks.

## Historical capability reference: recovery decisions

The mutation procedures below are frozen until a new reviewed authorization.
Rollback finalize has completed and must not be repeated.

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

## Historical capability reference: broker, database, backup, and credential recovery

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

Use only the read-only status path during the post-rollback hold. Worker runs
30715590990 and 30715611673 verified public scheduling true. Do not repeat the
apply.

Post-merge Worker Pipeline 30690135595, protected enabled apply 30690227183,
disabled dry-run plan 30690250417, and live status 30690250981 all passed.
Their artifacts prove that Worker identity, routes, cron, bindings, Durable
Object migrations, and failover surfaces are retained.

## Reversible cutover controls

Backend commits `9c58c44c267cc1a82c450ee3468932d82c1c25fc` and
`4a86fcb85a94f3821ee4ebe804c62cf2dab1bee7` implemented the control framework.
The live cutover, rollback prepare, and rollback finalize have since run.
Backend run 30715566651 proved stable shadow generation 5. Rerunning cutover,
rollback, or finalize is unsafe and unauthorized.

The sole database target is
`worker_uplift_final.cutover_control(control_id='production')`. Its dedicated
role can select and compare-and-swap fixed columns only. Database constraints
and a security-definer transition/audit trigger reject dual-writer states,
stale generations, and transitions outside `shadow → fenced → cutover_active
→ rollback_pending → shadow`. API flags alone cannot enable production writes;
the database candidate and watermark must also match.

Standing authorization covers only machine-validated routine checks,
value-free rehearsal, and safe deployment. Its pinned digest is
`17dffe06f80ec9266761a84a2c738517c57da31e57ad8936dce16d003c021804`.
It excludes #166 GO, #127 execution, owner/write switches, legacy-ingestion
disable, DNS/failover/Cloudflare changes, arbitrary SQL, secret retrieval, and
risk acceptance. Inspect the downloaded report and portable checksum for
every run.

## Current post-rollback state

1. Preserve cutover abort, rollback-prepare, scheduling, and finalize evidence.
2. Verify the authoritative row is stable `shadow` generation 5 with owner
   `legacy_shards`, legacy dispatch true, uplift scheduler true in shadow,
   uplift writes false, publication shadow, and null observation timestamps.
3. Verify public legacy scheduling true and single-writer/DNS checks passing.
4. Keep the failed publication candidate disqualified and quarantined.
5. Do not rerun cutover, rollback, finalize, or any unrelated mutation.
6. Do not start an observation window or retire legacy ingestion; the failed
   cutover's observation never started.

## Incident exit criteria

Do not close an incident until the appropriate evidence proves:

- rollback finalize proves stable shadow, legacy owner/dispatch/scheduling
  true, uplift writes false, and no dual writer;
- the affected dependency is healthy;
- service readiness and required consumer counts are restored;
- queues drain and retry/DLQ counts stabilize;
- outboxes, watermarks, backups, and reconciliation agree;
- Grafana metrics/logs, SLOs, quota, and admin projection were inspected
  read-only;
- no frozen mutation, replay, Grafana apply, synthetic rollout, web merge,
  Runtime 1, or fetcher v2 action ran;
- DNS failover state did not change because of worker recovery;
- no secret, payload, private header, or improvised manual mutation entered
  the evidence.
