---
wiki:
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 42de5b1f54dda32dfbf07d931fb7757de0b03ba5a7443a23574ffae0def4313b
---
# NutsNews Worker-Uplift RabbitMQ Metrics

Status: backend collection path completed for `ramideltoro/nutsnews-worker#87`
on 2026-07-23. Grafana Cloud Prometheus freshness proof passed after the
metrics token received `metrics:read`.

Canonical backend runbook:

```text
ramideltoro/nutsnews-backend/runbooks/WORKER_UPLIFT_RABBITMQ_METRICS.md
```

Backend implementation commits:

```text
ramideltoro/nutsnews-backend@1433c3aed6fd36307524288d75a5ba048c74dd83
ramideltoro/nutsnews-backend@676542873c4ad7ae0e4353c2ebb3e2b1fbf1a1d1
ramideltoro/nutsnews-backend@15996767959da4e40b6e919cb3ead4ce1501f3e7
```

## Scope

The backend host is the RabbitMQ telemetry producer for the worker-uplift
broker. Grafana Cloud resources remain owned by
`ramideltoro/nutsnews-infra`; the backend repo only renders Alloy scrape and
remote-write configuration.

That producer boundary is broader than RabbitMQ: `nutsnews-backend` owns worker
deployment, backend Alloy, and backend-hosted production-ownership and outbox
gauges. The scheduler, fetcher, canonicalizer, enrichment, approval,
translation, persistence, and publication repositories each own their service
identity, health, lifecycle, and latency signals. `nutsnews-infra` alone owns
Grafana resources, while the `nutsnews-worker` meta-repository coordinates the
rollout. Source ownership must not be confused with an alert's `owner` routing
label. The Current Production Ownership dashboard must show the backend
revision and exact deployed identity for all eight split-worker services.

RabbitMQ exposes the `rabbitmq_prometheus` plugin on the loopback-only listener
`127.0.0.1:15692`. Backend Grafana Alloy scrapes that private endpoint and
remote-writes to Grafana Cloud Prometheus with telemetry write credentials.

## Collection

Alloy collects aggregate RabbitMQ metrics from `/metrics`, bounded per-queue
metrics from `/metrics/detailed`, and Alloy self metrics so scrape failures,
relabeling pressure, remote-write pressure, and dropped samples are visible.

Detailed queue scraping is restricted to:

```text
queue_coarse_metrics
queue_consumer_count
queue_delivery_metrics
```

The queue regex covers the seven worker-uplift main queues, retry tiers, and
DLQs only.

## Cardinality And Ownership Guardrails

Allowed RabbitMQ metric labels are bounded to:

```text
environment, host, instance, job, service_namespace, rabbitmq_endpoint, node,
cluster, vhost, queue
```

Article, feed, message, idempotency, trace, span, correlation, causation,
payload, URL, path, user, IP, token, secret, connection, and channel identifiers
must not become metric labels.

Alloy sets RabbitMQ scrape sample and label limits, keeps only approved
RabbitMQ metric names, keeps only declared queue names, and does not create or
change Grafana dashboards, folders, alerts, contact points, synthetics, or
quota guardrails.

The source-staged qualification baseline sets non-owning split services to
`nutsnews_worker_expected_active=0`; it does not itself prove the live state.
Legacy scheduling is verified true by worker runs
[`30715590990`](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715590990)
and [`30715611673`](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715611673).
[Backend run 30715566651](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30715566651)
completed finalize. The authoritative row is stable `shadow` generation 5,
owner `legacy_shards`, legacy dispatch true, uplift scheduler true in shadow,
uplift writes false, publication shadow, observation timestamps null, and
single-writer/DNS checks passing. Ownership gating suppresses
non-owner behavior paging, not structural qualification: every service must be
deployed, report `up == 1`, remain scrape-fresh for less than 180 seconds,
expose readiness series, and publish exact non-`unknown` build/deployment
identity. Missing structural series are never ownership-gated. A service with
`nutsnews_worker_expected_active=1` must additionally report successful
readiness, scheduler loop/cycle or delivery-stage activity as applicable, last
success, and worker-local paging eligibility.

The failed cutover used older candidate
`71b0303705093ad398458083547a86e9e61f50458e8799ace38de4f2404859df`
instead of the newly published Runtime 1 image set. Backend PR
[`#471`](https://github.com/ramideltoro/nutsnews-backend/pull/471) pins Runtime 1
but is `DIRTY`/conflicting with current main and undeployed. It must resolve the
PR #483 Worker API conflict, replace mutable ownership/`expected_active` inputs
with authoritative generation 5 state, and add a separate runtime-container
recreation path so exact-eight identity can converge. Separately, pre-freeze
Grafana apply 30708192621 verified 35 RabbitMQ queue query results, populated
RabbitMQ logs, 28 dashboards, and 20 worker alerts. That baseline evidence does
not prove Runtime 1, native SLOs, PR #473 hardening, or controlled drills.

Retained
[abort-threshold evidence](https://github.com/ramideltoro/nutsnews-infra/issues/474#issuecomment-5153075316)
records 28 publication messages, 84 `handler-error` retries, no publication
success, 28 ready messages in the 30-minute retry queue, and no post-cutover
public freshness. The observation window never started. Rollback completed
through the protected finalize run. No automatic rollback, recovery replay, or
operator queue replay ran. The failed Runtime 0.x candidate is disqualified and
quarantined.

Backend source hardening is partly complete. Backend
[`PR #482`](https://github.com/ramideltoro/nutsnews-backend/pull/482), merge
`510b775d7962e2e66d430fb6d458c3c88d60cdd3`, records the immutable incident
receipt, consumes the historical cutover authority, and fail-closes protected
Ansible and generic runtime mutations against the exact maintenance-safe shadow
row. Backend [`PR #483`](https://github.com/ramideltoro/nutsnews-backend/pull/483),
merge `5531014000f52fd6101f8617463d5f2c887d0788`, hardens the forward
publication API contract and idempotency semantics. These are source-only
merges: no host/runtime deployment, Runtime 1 rollout, queue replay, or failed-
candidate rehabilitation occurred. The worker deploy guard and infra verifier
remain unfinished and frozen.

The effective safety freeze remains until incident reconciliation and those
unfinished guards are complete: no worker merge/ordinary deploy, backend
Ansible or generic runtime mutation, duplicate cutover/rollback/finalize,
Runtime 1/fetcher v2, Grafana apply, synthetic rollout, web merge, queue replay,
or reconciliation mutation. Rollback is complete; no cutover-control mutation
is authorized. Read-only evidence collection does not remove these freezes.

## Grafana Dashboards

Issue `ramideltoro/nutsnews-worker#89` provisions the RabbitMQ dashboards from
`ramideltoro/nutsnews-infra` through the centralized Grafana Cloud OpenTofu
module. The dashboards are source-created in the `NutsNews Backend Ops` folder:

- `NutsNews Worker-Uplift RabbitMQ Overview`
  (`nutsnews-worker-uplift-rabbitmq-overview`)
- `NutsNews Worker-Uplift Queue Drilldown`
  (`nutsnews-worker-uplift-rabbitmq-queues`)
- `NutsNews Worker-Uplift RabbitMQ Resources`
  (`nutsnews-worker-uplift-rmq-resources`)

The dashboards use bounded `environment`, `host`, `vhost`, `stage`, `queue`,
and `service` variables. The `queue` variable lists every declared main queue,
retry queue, and DLQ, so operators can select any of the 35 worker-uplift queues
without editing PromQL. Queue and service panels link to filtered Loki Explore
views for the approved worker-uplift container log labels. Trace links are
absent because traces remain deferred by the #144 telemetry policy.

Protected Grafana Cloud apply run `30042593274` completed the #89 dashboard
provisioning after infra PR #390 shortened the resources dashboard UID to meet
Grafana's 40-character dashboard UID limit. The post-apply verification report
returned `status=pass`, `dashboard_count=27`, `backend_alert_count=11`,
RabbitMQ Prometheus query `result_count=35` for queue metrics, and RabbitMQ
Loki log query `result_count=1`.

## Admin Portal Projection

Issue `ramideltoro/nutsnews-worker#147` adds the worker-uplift pipeline health
projection to the private NutsNews admin portal. The final operator route is:

```text
/admin/shards
```

The route keeps the legacy shard health cards, tables, and recent runs visible,
then adds a RabbitMQ pipeline health section from the backend durable
projection. The admin portal does not call RabbitMQ management, AMQP, Grafana
Cloud, or any broker endpoint from browser code.

Backend admin operations:

| Operation | Use |
| --- | --- |
| `load-admin-worker-shards` | Primary portal read. Returns legacy `workerRunRows` plus embedded `workerUpliftHealth`. |
| `load-admin-worker-uplift-health` | Dedicated bounded smoke/API-contract read for the same projection. |

Top-level `workerUpliftHealth` fields shown or normalized by the portal:

| Field | Meaning |
| --- | --- |
| `isAvailable` | Whether the backend response included a usable projection. Missing old-backend payloads render as unavailable while preserving shard health. |
| `schemaVersion` | Versioned admin projection schema. |
| `source` | Durable backend source classification, normally `backend_postgres_durable_projection`. |
| `grafanaDependency` | Must be `false`; the portal uses backend PostgreSQL projection data, not live Grafana queries. |
| `activeIngestionOwner` | Current ingestion owner: `legacy_shards`, `coexistence`, `worker_uplift`, `rollback`, or `unknown`. |
| `cutoverState` | Human-readable migration/cutover state from the backend. |
| `productionWritesEnabled` | Whether worker-uplift production writes are active. |
| `overallStatus` | `healthy`, `degraded`, `stale`, `unknown`, `legacy_only`, `rollback`, `partial`, or `unavailable`. |
| `stageRows` | Per-stage pipeline health rows. |
| `partialErrors` | Redacted source/error-class pairs for partial telemetry; no raw broker URL or credential detail. |
| `links.dashboardPath` | Source-controlled Grafana dashboard path, for example `grafana/backend-metrics/dashboards.json`. |
| `links.runbookPath` | Source-controlled runbook path, for example `runbooks/WORKER_UPLIFT_RABBITMQ_METRICS.md`. |

Per-stage `stageRows[]` fields:

| Field | Meaning |
| --- | --- |
| `stage` | One of `scheduler`, `fetcher`, `canonicalizer`, `enrichment`, `approval`, `translation`, `persistence`, or `publication`. |
| `activeIngestionOwner` | Owner at stage row level, falling back to the projection owner if missing. |
| `stageStatus` | `healthy`, `degraded`, `failed`, `stale`, `unknown`, `legacy_only`, `rollback`, or `unavailable`. |
| `staleStatus` | `current`, `stale`, or `unknown`. |
| `lastAttemptAt`, `lastSuccessAt`, `lastFailureAt` | Last observed stage timestamps. |
| `consecutiveFailureCount` | Consecutive failures for the stage. |
| `throughputPerMinute` | Durable projected stage throughput. |
| `latencyP50Ms`, `latencyP95Ms` | Stage latency percentiles in milliseconds. |
| `retryCount`, `dlqCount` | Retry and DLQ counts; a non-zero `dlqCount` is operator-actionable without RabbitMQ management access. |
| `queueAgeSeconds` | Oldest queued work age. |
| `activeConsumers` | Active consumer count for the stage. |
| `deploymentVersion` | Worker-uplift service version or image marker. |
| `telemetryVersion`, `projectionVersion` | Producer/projection version markers. |
| `updatedAt` | Projection row update timestamp. |
| `errorClass` | Redacted error class for the stage. |

Operator state mapping. These are portal presentation states, not cutover
control-row state names. The current stable `shadow` generation 5 row maps to
portal `Legacy-only` because owner is `legacy_shards` and writes are disabled:

| State | How to read it in `/admin/shards` |
| --- | --- |
| Legacy-only | `activeIngestionOwner=legacy_shards`, `productionWritesEnabled=false`, and `overallStatus=legacy_only` or unavailable projection on old backends. |
| Shadow | `productionWritesEnabled=false` with `activeIngestionOwner=coexistence` or `worker_uplift`; legacy shards remain the source of production truth. |
| Uplift-primary | `activeIngestionOwner=worker_uplift` and `productionWritesEnabled=true`; investigate any degraded stage before cutover retirement. |
| Rollback | `activeIngestionOwner=rollback` or `overallStatus=rollback`; use legacy shard health and rollback runbooks as the primary evidence. |
| Stale | `overallStatus=stale`, a stage `stageStatus=stale`, or `staleStatus=stale`; compare `lastSuccessAt` and `queueAgeSeconds`. |
| Partial data | `overallStatus=partial` or non-empty `partialErrors`; source/error-class is safe to display, but missing metrics should not be treated as healthy. |
| Unavailable | `isAvailable=false` or stage `stageStatus=unavailable`; old-backend payloads still keep legacy shard diagnostics usable. |

Safety rules:

- `/admin/shards` is read-only and must not mutate ingestion, queue, broker, or cutover state.
- Browser-rendered code must not contain AMQP URLs, broker hostnames, management UI links, credentials, message payloads, or private queue endpoints.
- Dashboard and runbook links are repository paths converted to GitHub source links by the web app, not live infrastructure endpoints.
- A non-empty DLQ or oldest queue age should be enough to identify the blocked stage before opening Grafana or backend runbooks.

## Proof Workflow

Use the backend `Backend RabbitMQ Metrics Check` workflow after protected apply:

```bash
gh workflow run backend-rabbitmq-metrics-check.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f require_grafana_data=false
```

After enough scrape time has passed, rerun with
`require_grafana_data=true` to prove fresh Grafana Cloud Prometheus samples.

The workflow is fixed and read-only. It checks the local RabbitMQ Prometheus
endpoints, loopback listener posture, Alloy service state, Alloy config
validation, and optionally the Grafana Cloud Prometheus query path.

## Evidence

Backend implementation PRs:

| PR | Purpose | Merge commit |
| --- | --- | --- |
| `ramideltoro/nutsnews-backend#309` | Worker runtime framework and RabbitMQ metrics | `1433c3aed6fd36307524288d75a5ba048c74dd83` |
| `ramideltoro/nutsnews-backend#311` | Alloy River regex escaping fix | `676542873c4ad7ae0e4353c2ebb3e2b1fbf1a1d1` |
| `ramideltoro/nutsnews-backend#312` | Optional Grafana query and Alloy validate proof semantics | `15996767959da4e40b6e919cb3ead4ce1501f3e7` |

Local and PR validation:

| Surface | Run |
| --- | --- |
| PR #309 checks | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30013690867> |
| PR #311 checks | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30015798640> |
| PR #312 checks | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30017649837> |

Production proof:

| Surface | Run |
| --- | --- |
| Protected apply with RabbitMQ Alloy metrics | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30016460292> |
| Backend RabbitMQ Metrics Check without Grafana freshness requirement | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30017736851> |
| Backend RabbitMQ Metrics Check with Grafana freshness requirement | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30038565700> |
| Backend drift check after metrics apply | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30017885344> |
| Backend health report after metrics apply | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30017885364> |

The passing metrics proof reported:

```text
rabbitmq_aggregate_endpoint=healthy
rabbitmq_detailed_endpoint=healthy
rabbitmq_prometheus_listener=healthy
alloy_service=healthy
alloy_config=healthy
grafana_rabbitmq_query=healthy
```

The Grafana Cloud Prometheus query result was:

```text
result_count=1
```

## Private Canary Metrics

Issue `ramideltoro/nutsnews-worker#91` adds a host-local AMQP canary that writes
Prometheus textfile metrics for Grafana Cloud alerting. The canary metrics are
emitted by the backend host at:

```text
/var/lib/nutsnews/metrics/rabbitmq-canary.prom
```

The metrics are collected by the existing backend Alloy textfile scrape and
remote-written to Grafana Cloud Prometheus. They do not require a public AMQP
listener and do not use Grafana Synthetic Monitoring.

Primary metric names:

```text
nutsnews_backend_rabbitmq_canary_success
nutsnews_backend_rabbitmq_canary_status
nutsnews_backend_rabbitmq_canary_failure_fixture
nutsnews_backend_rabbitmq_canary_cleanup_success
nutsnews_backend_rabbitmq_canary_last_run_timestamp_seconds
nutsnews_backend_rabbitmq_canary_latency_seconds
nutsnews_backend_rabbitmq_canary_message_age_seconds
```

Allowed labels are bounded to deterministic canary fields such as `environment`,
`host`, `vhost`, `route`, `mode`, `failure_mode`, and `drill`. Message ids,
payloads, credentials, usernames, URLs, IP addresses, and RabbitMQ connection or
channel identifiers must not become metric labels.

The canary writes the latest redacted JSON evidence to:

```text
/var/lib/nutsnews/rabbitmq-probes/last-canary.json
/var/lib/nutsnews/rabbitmq-probes/last-canary-drill.json
```

## Grafana Alerts And Dashboard SLIs

Issue `ramideltoro/nutsnews-worker#90` tracks worker-uplift RabbitMQ alert and
dashboard SLI resources in `ramideltoro/nutsnews-infra`. The source of truth is
`terraform/grafana-cloud/catalog/worker-uplift-rabbitmq-alerts.json`, managed
through the Grafana Cloud OpenTofu module. The catalog's legacy `slos` key and
`slo_id` fields are compatibility metadata for panels and custom rules; they do
not create native `grafana_slo` resources.

Grafana objects:

- `NutsNews Worker-Uplift Pipeline SLOs`
  (`nutsnews-worker-uplift-slos`)
- `NutsNews Worker-Uplift RabbitMQ Guardrails`
  (`NutsNews Backend Ops` folder)

The alert group covers broker down, private canary failure, Alloy scrape/write
loss, no consumers while work exists, sustained backlog or oldest-age pressure,
publish/ack imbalance, unacked growth, DLQs, retry/redelivery pressure,
connection churn, broker memory/disk alarms, low disk, descriptor pressure,
stale recovery proof, repeated restarts, and multi-window custom guardrail
alerts.

Every rule must carry `severity`, `owner`, `route`, `service`,
`deployment_environment`, a dashboard URL, and a runbook URL. Queue, threshold,
and recovery-window metadata are added only where relevant. After the frozen
infra hardening is applied, the route will be consumed by the Terraform-managed
operations-email notification policies; the recipient remains a protected
secret rather than source-controlled plaintext. The live root route remains
`empty`, and no receipt canary has proved delivery.

Dashboard SLIs and custom guardrails covered by the catalog:

| Dashboard SLI or custom guardrail | Target |
| --- | --- |
| Broker availability | 99.5% monthly availability |
| Stage success and latency | 99% successful stage events and p95 under 30 seconds |
| Worker-local diagnostic freshness | freshness age under 30 minutes |
| Retry/DLQ rate | retry and DLQ budget ratio below 1% |
| Final publication success | 99% successful final publication events |

Worker-local activity, consumer, latency, freshness, and final-publication
queries page only when the relevant production owner exports
`nutsnews_worker_expected_active=1`. No Data may suppress an inappropriate
non-owner behavior page, but it does not prove health or qualify a rollout.
Required `up`, scrape freshness, exact build/deployment identity, and
readiness-series presence for all eight workers are structural checks and are
never ownership-gated or treated as healthy No Data. Broker and retry/DLQ custom
rules use 5-minute and 1-hour windows. Worker-local threshold rules use
15-minute evaluations. The global reader-visible durable feed-freshness SLO and
its three-hour critical guardrail are separate and source-defined without an
ownership gate; Grafana activation remains unproved.

The following is later source-staged target state unless a protected apply and
live query are separately evidenced. The pre-freeze baseline apply above does
not activate the four native, rolling 30-day Grafana SLOs defined separately in
`terraform/grafana-cloud/slos.tf` and documented in
[Service Level Objectives](SERVICE_LEVEL_OBJECTIVES.md). The 30-minute
worker-specific freshness warning here is diagnostic and ownership-gated; it
does not replace the global native 99%-within-15-minutes feed objective or its
ungated three-hour guardrail. The dashboard's “Final publication success” is a
custom publication-only SLI; the native Worker terminal SLO instead aggregates
event-weighted outcomes across every canonical delivery stage. It counts
`success|duplicate` over `success|duplicate|invalid|failure|dlq`, excludes
intermediate `retry`, and leaves scheduler cycles outside the stage family.
Source defaults `worker_terminal_slo_alerting_enabled` to `false`, so the
candidate omits generated burn alerts; the protected Grafana-side live value
still needs rollout confirmation. The completed rollback does not prove a native
SLO or its burn alerts are active. Custom worker-local rules use
the separate `nutsnews_worker_expected_active` ownership gate.

The native API-latency SLO denominator contains only successful article/API
observations. Failed status, body, or header assertions remain availability and
correctness signals and are not recast as slow successful requests.

The canonical oldest worker-pressure gauge is backend-owned, not emitted by an
individual service:
`nutsnews_backend_worker_uplift_oldest_unconfirmed_outbox_age_seconds`. Query it
only with
`nutsnews_backend_worker_uplift_outbox_available == 1`; unavailable projection
data is a separate telemetry failure. RabbitMQ broker queue age remains useful
for queue diagnosis, but neither value replaces the global 15-minute
reader-visible feed-freshness SLO.

Historical/future drill capability: only after the freeze is lifted and a new
reviewed drill authorization exists, use the backend `Backend RabbitMQ Canary`
workflow from #91 to exercise deliberate firing and recovery without exposing
private AMQP. This is not current authorization:

| Drill | Alert classes exercised |
| --- | --- |
| `network-interruption` | broker down and broker availability burn |
| `invalid-credentials` | private canary failure |
| `consumer-loss` | work with no consumers |
| `disk-watermark` | memory/disk alarm and low disk |
| `full-queue` | sustained backlog/oldest age |
| `poison-message` | DLQ and retry/DLQ burn |
| `grafana-connectivity-loss` | Alloy metrics write loss |
| `restart` | repeated restart and recovery-proof checks |

After each future authorized fixture drill, run a normal canary and wait through the Grafana
recovery window. Alert tests must not publish production articles, expose AMQP
or management ports, disable legacy ingestion/failover, mutate contact points,
or disable Alloy remote write.

The first protected apply for the metrics change failed before issue closeout:

- Run `30014696216` rendered the queue regex into Alloy River strings with
  invalid single-backslash escapes.
- Backend PR #311 changed the template to render the regex with Ansible
  `to_json` and added validator/test coverage for the escaping path.
- Run `30017433030` then showed healthy local metrics and Alloy state, but the
  proof script treated blank-success `alloy validate` output as failure and
  treated optional Grafana query failure as required. Backend PR #312 fixed
  those proof semantics.

## Related Docs

- [Worker-Uplift Service Runtime](NUTSNEWS_WORKER_UPLIFT_SERVICE_RUNTIME.md)
- [Worker-Uplift RabbitMQ Provisioning](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_PROVISIONING.md)
- [Worker-Uplift RabbitMQ Operations](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_OPERATIONS.md)
- [Worker-Uplift RabbitMQ Recovery](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_RECOVERY.md)
- [Backend Monitoring](NUTSNEWS_BACKEND_MONITORING.md)
