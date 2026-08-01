---
title: NutsNews Worker-Uplift Telemetry Scope
wiki:
  source_route: /technical/nutsnews-worker-uplift-telemetry-scope/
  simple_route: /simple/nutsnews-worker-uplift-telemetry-scope/
  primary_diagram:
    file: diagrams/NUTSNEWS_WORKER_UPLIFT_TELEMETRY_SCOPE.mmd
    accTitle: "Staged worker-uplift observability activation flow"
    accDescr: "Shows the eight private metrics endpoints, truthful health and ownership gates, Grafana Cloud signals, quota safeguards, deferred signals, and evidence required before activation."
  status: active
  collection: ai-and-automation
  section: Automation & Workers
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: c90054fa2375b045f873c14d2b3e6eb27c1d150523e3c16323c90df00458de13
---

# NutsNews Worker-Uplift Telemetry Scope

Status: the Runtime 1 producer and observability changes remain staged. Live
ingestion was cut over on an older candidate and must be reconciled before the
observability backend deployment and Grafana Cloud apply.

Companion infra policy (must be reconciled in the same reviewed rollout):

```text
ramideltoro/nutsnews-infra/terraform/grafana-cloud/catalog/worker-uplift-telemetry-scope.json
```

This document mirrors the telemetry contract the worker-uplift pipeline may
emit. The companion JSON policy now carries the staged core label, outcome,
quota, and ownership changes, but it is not aligned or applied until it also
covers the exact histogram, health, native-SLO, Alloy break-glass, and
value-allowlist semantics below and stops declaring an approved state while this
bundle is unreviewed. Repository changes do not make the signals live.
Completion requires the observability backend and infra changes to merge,
Runtime 1 worker images to be deployed, a reviewed
`ramideltoro/nutsnews-infra` GitOps apply, and retained query/alert evidence.

> **Observability is not cutover authorization or proof.** At 2026-08-01 19:04
> UTC, protected backend run
> [`30713923790`](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30713923790)
> recorded `active_ingestion_owner=worker_uplift`, `state=cutover_active`,
> production writes enabled, and legacy dispatch disabled. Protected controller
> run
> [`30713955433`](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30713955433)
> then confirmed public legacy scheduling disabled. These are ingestion-control
> facts, not evidence that the telemetry or Grafana resources in this contract
> are live.

Temporary cutover safety freeze: until fail-closed deploy guards preserve the
retained cutover state, `nutsnews-worker` merges are frozen because the ordinary
main pipeline deploys the controller from base configuration where
`INGESTION_SCHEDULING_ENABLED=true`. All mutating Backend Worker Runtime
Operations are also frozen: the current deploy, scale, and rollback paths use
base Compose and can recreate publication without the cutover overlay. Do not
run the fetcher state-contract v2 migration while `state=cutover_active`.
Read-only inspection does not remove these freezes.

Producer ownership is explicit. `nutsnews-backend` owns worker deployment,
backend Alloy, and backend-hosted production-ownership and outbox gauges. The
`nutsnews-worker-scheduler`, `nutsnews-worker-fetcher`,
`nutsnews-worker-canonicalizer`, `nutsnews-worker-enrichment`,
`nutsnews-worker-approval`, `nutsnews-worker-translation`,
`nutsnews-worker-persistence`, and `nutsnews-worker-publication` repositories
each own their service identity, health, lifecycle, and latency signals.
`nutsnews-infra` alone owns Grafana resources, and the `nutsnews-worker`
meta-repository coordinates the rollout. The live cutover currently assigns
production ingestion to worker uplift; this runtime ownership is distinct from
source ownership and from the `owner` label used to route and triage an alert.
The Current Production Ownership dashboard must show the backend revision and
exact deployed identity for all eight split-worker services.

## Signal Matrix

| Telemetry class | Decision | Destination | Notes |
| --- | --- | --- | --- |
| RabbitMQ metrics | Required | Grafana Cloud Metrics | Queue depth, ready/unacked messages, publish/deliver/ack/retry/DLQ rates, consumers, and broker health. |
| Worker service metrics | Required | Grafana Cloud Metrics | Per-service counters, gauges, and bounded histograms for throughput, latency, retries, failures, and backpressure. |
| Structured logs | Required | Grafana Cloud Logs | JSON service logs and RabbitMQ service logs after redaction, size limits, rate limits, and buffering. |
| Traces | Deferred | None | No Tempo export, OTLP endpoint, or traces credential is provisioned now. |
| Exemplars | Deferred | None | No exemplars until traces are separately approved. |
| Profiles | Deferred | None | No profiling backend, credential, or sampling policy is approved now. |
| Scrubbed exceptions and replays | Existing canonical path | Sentry | Keep Sentry as the canonical scrubbed exception/replay store; correlate by bounded release identity rather than duplicating payloads in Grafana. |
| Article/model payload telemetry | Forbidden | None | Article bodies, summaries, model prompts, model outputs, secrets, and production token material must not enter telemetry. |

Full trace export is not a runtime dependency. The envelope still carries W3C
trace context, and services may include `pipelineRunId`, `traceparent`,
`tracestate`, `correlationId`, `causationId`, `messageId`, and `idempotencyKey`
as structured metadata. Those fields must not become metric labels or Loki
stream labels.

## Labels And Correlation

Worker event metrics may use only the bounded dimensions that apply to the
signal:

```text
service, stage, queue, outcome, dependency, language, provider, probe, check
```

For lifecycle events, `stage` is the message route (`fetch` through
`publication`), not the process name. The bounded `service` and `stage` values
identify the delivery processor and route separately.

Prometheus and Alloy may add transport and scrape labels such as
`deployment_environment`, `host`, `job`, and `instance`; histogram buckets also
carry Prometheus's bounded `le` label. Build revision, service version,
deployment mode, adapter mode, and `nutsnews_worker_expected_active` belong in one-valued
info/state gauges rather than every high-volume event series. If alert joins
require the compatibility `expected_active` scrape-target label, it remains a
bounded ownership label and not an event dimension; the canonical emitted gauge
is `nutsnews_worker_expected_active`.

Existing runtime and scrape compatibility series may temporarily carry bounded
labels such as `environment`, `version`, `revision`, `deployment`,
`deployment_mode`, `adapter`, `result`, `retry`, `retry_class`, and
`token_kind`. They are not approved as new event dimensions and must be
reconciled or migrated before the companion infra policy is treated as current.

Canonical Loki stream labels are exactly:

```text
deployment_environment, service, service_version, host, source, severity
```

Label value bounds are part of the contract, not just label names:

| Dimension | Allowed values or source | Fallback |
| --- | --- | --- |
| `outcome` | Per-family union of `success`, `duplicate`, `invalid`, `retry`, `dlq`, `failure`, `ok`, `degraded`, `unhealthy`, `active`, `cancelled`, `channel-dropped`, `recovering`, `closed` | `other` for unrecognized; `unknown` only when absent and required. |
| `dependency` | Reviewed per-service set: `rabbitmq`, `postgresql`, `state-store`, `scheduler-loop`, `production-adapters`, `local-ai` | `other` or `unknown`. |
| `language` | `fr`, `ja`, `de-CH`, `de`, `el` | `other` or `unknown`. |
| `provider` | `local_ai` | `other` or `unknown`. |
| `probe` | `liveness`, `startup`, `readiness` | `other` or `unknown`. |
| `check` | Reviewed set: `process`, `initialization`, `scheduler-loop`, `production-adapters`, `state-store`, `rabbitmq`, `postgresql` | `other` or `unknown`. |
| Loki `source` | `file`, `journal`, `container` | `unknown`. |
| Loki `severity` | `critical`, `error`, `warning`, `info`, `unknown`; aliases are normalized and debug/trace is dropped in production | `unknown`. |
| Loki `service_version` | One immutable release value per service from the deployment inventory | `unknown`; reject request-derived values. |

Missing values map to `unknown`; supplied values outside a reviewed allowlist map
to `other` or are dropped. Raw values must never pass through and expand a label.

Forbidden in metric labels and Loki stream labels:

```text
article, feed, message, idempotency, trace, span, correlation, causation,
payload, url, path, user, ip, token, secret, prompt, model_output
```

The `queue` value is bounded to contract-defined RabbitMQ queues. The `service`
value is bounded to the eight worker-uplift services. The operator lifecycle
vocabulary is accepted, duplicate, invalid, retry, DLQ, and terminal. The stage
counter encodes accepted work as `outcome="success"`; a terminal failure is the
final DLQ completion with a bounded failure class and must not be double-counted.

Consumer lifecycle telemetry uses the same approved label boundary. Runtime
`0.5.0` exposes:

- `nutsnews_worker_consumers`, a per-service/per-main-queue active consumer
  gauge;
- `nutsnews_worker_consumer_events_total`, a counter for bounded outcomes such
  as `active`, `cancelled`, `channel-dropped`, `recovering`, and `closed`;
- `runtime.broker.consumer_state_changed`, a structured JSON event carrying
  stage, queue, previous state, current state, and a bounded reason.

Consumer cancellation and dropped-channel events must never include RabbitMQ
URLs, credentials, message bodies, or article/model payloads. Grafana Cloud
alert ownership remains in `ramideltoro/nutsnews-infra`; the per-main-queue
consumer-loss rule is gated by production ownership.

## Private Metrics And Truthful Health

Backend Alloy must be the only scraper for the loopback-only endpoints. None may
be published through Caddy or the public firewall. The eight-target Alloy
configuration is staged in source and still requires merge, deployment, and
scrape evidence.

| Service | Private endpoint |
| --- | --- |
| scheduler | `127.0.0.1:18081/metrics` |
| fetcher | `127.0.0.1:18082/metrics` |
| canonicalizer | `127.0.0.1:18083/metrics` |
| enrichment | `127.0.0.1:18084/metrics` |
| approval | `127.0.0.1:18085/metrics` |
| translation | `127.0.0.1:18086/metrics` |
| persistence | `127.0.0.1:18087/metrics` |
| publication | `127.0.0.1:18088/metrics` |

The target requires each service to keep distinct liveness, startup, and
readiness probes and export separate state metrics for each. Liveness
proves response, startup proves initialization, and readiness proves the
service can safely accept configured work. Production scheduler readiness
requires an active scheduling loop plus required production adapters. Fetcher
readiness exposes its actual state-store mode and cannot pass production with
an in-memory store.

Readiness and info gauges expose safe expected/actual modes, immutable build
revision, service version, and bounded check state. They never expose URLs,
credentials, payload identifiers, or raw dependency errors.

## Worker Metric Contract

Merged source in all eight service repositories implements private-endpoint
ownership, identity, health, and freshness telemetry. The seven delivery processors—fetcher,
canonicalizer, enrichment, approval, translation, persistence, and
publication—also stage the canonical
`nutsnews_worker_uplift_stage_events_total` counter and fixed-bucket
`nutsnews_worker_uplift_stage_latency_seconds` histogram. Scheduler is not a
delivery processor; its fixed-bucket scheduler-cycle histogram is outside the
stage-event SLI. Each completed delivery must emit exactly one structured
completion event. The stage histogram exports `_bucket`, `_sum`, and `_count`,
includes the 30-second SLO boundary and `+Inf`, and never uses article, feed,
message, or correlation identifiers as labels.

Worker Contracts `1.0.0` and Worker Runtime `1.0.0` are now published,
attested, and install-smoke verified in the required order from merge commits
`e86ea51814cb1b1d810e95b7971a59d90a2fce31` and
`80bc2d1cc1ce2f089386c2653f9a69abe1ce9808`. All eight service PRs are now
merged, and each main push published a signed, attested immutable Runtime 1
image with provenance, SBOM, manifest, and baked-revision evidence recorded in
[`nutsnews-infra#474`](https://github.com/ramideltoro/nutsnews-infra/issues/474#issuecomment-5152934401).
Those newly published Runtime 1 images have not been deployed. Draft backend PR
[`#471`](https://github.com/ramideltoro/nutsnews-backend/pull/471) pins them but
remains undeployed. The live cutover instead uses the older candidate
`71b0303705093ad398458083547a86e9e61f50458e8799ace38de4f2404859df`
under rollback deadline `2026-08-03T21:00:00Z`. Reconcile that active
cutover/observation state with PR #471 before a fresh fail-closed qualification
or deployment. The active pre-Runtime-1 candidate may still expose legacy
`_duration_ms` summaries. The new stage SLI uses only fixed-bucket seconds
histograms; image publication does not prove the Runtime 1 metric schema is
live.

The terminal-success SLI counts accepted work and completed duplicates as
successes. Its denominator contains only terminal outcomes; intermediate retry
events remain observable but are excluded.

Required operational signals also include:

- the canonical `nutsnews_worker_expected_active` ownership gauge, deployment
  mode, aggregate adapter mode, build revision, and service version info/state
  gauges;
- scheduler-loop activity and service-owned last-success timestamps;
- fetcher durable-state readiness and actual/expected state-store mode;
- per-service `up` and scrape freshness;
- RabbitMQ ready depth, unacknowledged depth, and consumer count by queue;
- backend-owned worker outbox pressure and global feed freshness as separate
  signals.

The source-staged qualification baseline exports
`nutsnews_worker_expected_active=0` for non-owning services; it is not a claim
about the current uplift-owned live cutover. PR #471 must reconcile its
per-service ownership signals with that state before deployment. Ownership
status does not waive structural telemetry: all eight must be deployed, report
`up == 1`, have a scrape age below 180 seconds, expose readiness series, and
publish exact non-`unknown` build and deployment identity. Missing structural
series are never ownership-gated.

Only a service with `nutsnews_worker_expected_active=1` must additionally report
a successful readiness outcome and qualify for worker-local paging. The active
scheduler must show loop/cycle activity and last success; an active delivery
processor must show stage activity and last success. Consumer, latency,
publication, and worker-local freshness rules may use the ownership gate because
they describe the current production worker. The presence, scrape, identity,
and readiness-series rules may not use it.

Oldest worker pressure is not a service-owned queue-age metric. The backend
exports
`nutsnews_backend_worker_uplift_oldest_unconfirmed_outbox_age_seconds`, and
consumers may use its value only when
`nutsnews_backend_worker_uplift_outbox_available == 1`. An unavailable outbox
projection is its own telemetry failure. This pressure signal is also distinct
from the global reader-visible 15-minute feed-freshness SLO.

The source-staged deployment configuration keeps non-owning services at
`nutsnews_worker_expected_active=0`. A production owner may export `1` only
under the protected production-write mode, and the deployed values must agree
with the retained ownership projection.
Worker-local consumer, latency, publication, and freshness conditions remain
visible in qualification dashboards but do not page for non-owning services
because their custom rules join the ownership gauge. Structural scrape,
identity, and readiness-series absence still alerts or blocks rollout. The
native Worker terminal-success SLI remains evaluable without that join; source
omits its Grafana-generated burn-alert resources while
`worker_terminal_slo_alerting_enabled` defaults to `false`. The protected
Grafana-side value is unconfirmed, and the successful ingestion cutover does
not prove the deployed telemetry values. Source does not mechanically couple
the boolean to `expected_active`, so operators must reconcile both against the
same retained production-ownership evidence. Source leaves the global
reader-visible durable feed-freshness SLO and its three-hour critical guardrail
ownership-ungated; Grafana activation remains unproved.

## Current Gaps Blocking Activation

These are explicit unresolved acceptance blockers, not claims that the final
producer contract is already satisfied:

- All eight endpoint implementations are merged and verified immutable images
  are published. Backend PR #471 pins them but remains undeployed; they have not
  passed a fresh fail-closed qualification against the live cutover state or
  produced fresh scrapes. The older active candidate and its rollback deadline
  must be reconciled first. Exact image evidence is retained in
  [`nutsnews-infra#474`](https://github.com/ramideltoro/nutsnews-infra/issues/474#issuecomment-5152934401).
- The canonical target histogram buckets are `0.005`, `0.01`, `0.025`, `0.05`,
  `0.1`, `0.25`, `0.5`, `1`, `2.5`, `5`, `10`, `30`, `60`, `120`, and `300`
  seconds, plus `+Inf`. The merged service sources use that full set; post-deploy
  queries must still prove cross-service schema convergence in the running
  images.
- Stage counters and histograms for the seven delivery processors, the scheduler
  cycle histogram, Runtime 1 probe/check health, and ownership gauges are
  present in merged source and the published images. Repository merge and image
  evidence covers the source artifacts; exact-once lifecycle behavior,
  duplicate-as-success handling, bounded labels, truthful dependency health,
  build/deployment/adapter identity, and last-success semantics still require
  post-deploy queries for operational proof.
- Generic runtime `_duration_ms` summaries may remain on the deployed Runtime
  `0.5` baseline. Their absence is not operational until the Runtime `1.0.0`
  worker images are pinned immutably in backend source, deployed, and scraped.
- Staged infra queries and tests now use the producers' canonical
  `nutsnews_worker_expected_active` name. Consumer, latency, worker-local
  freshness, publication, and active-worker activity/readiness outcomes are
  source-gated; required scrape, freshness, identity, and readiness-series
  presence are not. The global durable feed-freshness SLO and three-hour
  guardrail are intentionally not ownership-gated. These changes
  remain unapplied and must produce post-apply query and drill evidence before
  the source fix counts as operational.
- The companion infra policy JSON has the corrected core labels, outcomes,
  quota ratio, and ceilings, but still lacks the exact bucket, health,
  native-SLO, Alloy break-glass, and value-allowlist semantics in this document.
  Its `approved-source-controlled-policy` status also conflicts with this
  unreviewed bundle.
- The package release order and all eight service merges are complete, but
  package/image publication does not close the remaining backend-deployment
  reconciliation or post-deploy lease, health, identity, label, lifecycle,
  security, scrape, and hosted-check verification gates.

## Native Grafana SLOs And Worker Guardrails

The broader observability rollout owns exactly four native Grafana SLO resources,
all with 30-day windows:

| Native SLO | Objective | Worker-uplift behavior |
| --- | --- | --- |
| Public availability | 99.5% | Independent of worker ownership. |
| API latency | 95% of successful `canonical_articles_api` synthetic observations within 750 ms | Failed probe assertions remain availability/correctness failures outside this denominator. |
| Feed freshness | 99% within 15 minutes | Uses global reader-visible durable production-content age. Source leaves burn alerts and the separate three-hour critical guardrail ownership-ungated; Grafana activation remains unproved. |
| Worker terminal success | 99% | Event-weighted across all canonical delivery stages; source defaults generated burn alerts off, and the ingestion cutover does not prove Grafana activation. |

Worker terminal success is an event-weighted all-stage ratio across the seven
delivery processors, not publication-only or per-article success. One pipeline
run can contribute multiple eligible stage completions; scheduler cycles are
excluded. Success is `outcome=~"success|duplicate"`; the denominator is
`outcome=~"success|duplicate|invalid|failure|dlq"`. `retry` is intermediate and
excluded, while `failure` is a forward-compatible terminal outcome until all
producers converge. `terminal` names the SLI category and is not a literal
metric outcome. A zero denominator returns NoData, never a fabricated failure.
Source defaults `worker_terminal_slo_alerting_enabled=false`; the protected
Grafana-side live value still requires rollout confirmation. The successful
ingestion cutover does not prove the SLO resource or generated burn-alert block
exists.

The worker catalog's five SLI entries are dashboard and custom-rule metadata,
not five additional native Grafana SLOs. Native SLO resource count is also not a
numerator or denominator in the 70/85/95% usage-quota ratios.

## Topology Coverage

The telemetry policy covers every worker-uplift stage route from the contracts package:

| Stage | Producer | Consumer | Main queue | Retry queues | DLQ |
| --- | --- | --- | --- | --- | --- |
| `fetch` | `scheduler` | `fetcher` | `nutsnews.worker.fetch.v1` | `retry-30s`, `retry-5m`, `retry-30m` | `nutsnews.worker.fetch.v1.dlq` |
| `canonicalization` | `fetcher` | `canonicalizer` | `nutsnews.worker.canonicalization.v1` | `retry-30s`, `retry-5m`, `retry-30m` | `nutsnews.worker.canonicalization.v1.dlq` |
| `enrichment` | `canonicalizer` | `enrichment` | `nutsnews.worker.enrichment.v1` | `retry-30s`, `retry-5m`, `retry-30m` | `nutsnews.worker.enrichment.v1.dlq` |
| `approval` | `enrichment` | `approval` | `nutsnews.worker.approval.v1` | `retry-30s`, `retry-5m`, `retry-30m` | `nutsnews.worker.approval.v1.dlq` |
| `translation` | `approval` | `translation` | `nutsnews.worker.translation.v1` | `retry-30s`, `retry-5m`, `retry-30m` | `nutsnews.worker.translation.v1.dlq` |
| `persistence` | `translation` | `persistence` | `nutsnews.worker.persistence.v1` | `retry-30s`, `retry-5m`, `retry-30m` | `nutsnews.worker.persistence.v1.dlq` |
| `publication` | `persistence` | `publication` | `nutsnews.worker.publication.v1` | `retry-30s`, `retry-5m`, `retry-30m` | `nutsnews.worker.publication.v1.dlq` |

Total queue coverage:

| Queue class | Count |
| --- | ---: |
| Stage queues | 7 |
| Retry queues | 21 |
| Terminal DLQs | 7 |
| Total RabbitMQ queues | 35 |

Service coverage:

```text
scheduler, fetcher, canonicalizer, enrichment, approval, translation, persistence, publication
```

Host coverage:

```text
backend.nutsnews.com
vps.nutsnews.com
```

## Cardinality And Volume Budget

These are source-controlled ceilings, not measured production values.

| Area | Ceiling |
| --- | ---: |
| RabbitMQ queue metrics | 700 active series |
| Worker service metrics | 600 active series |
| Worker histogram metrics | 700 active series |
| Backend host series headroom | 2,000 active series |
| VPS host series headroom | 1,000 active series |
| Worker-uplift plus host ceiling | 5,000 active series |

Monthly log ceilings:

| Area | Ceiling |
| --- | ---: |
| Worker services normal JSON logs | 2.0 GB/month |
| RabbitMQ and broker logs | 1.0 GB/month |
| Backend host total including worker uplift | 5.0 GB/month |
| Existing VPS host baseline | 2.0 GB/month |

Assumptions:

- every main queue, retry queue, and terminal DLQ is represented by the bounded `queue` label;
- every deployable worker service is represented by the bounded `service` label;
- normal service logging stays at or below 120 JSON lines per service-hour;
- emergency burst logging is capped at 600 lines per service-hour;
- log lines above 8192 bytes are dropped or truncated before export;
- debug and trace logs are dropped in production.

## Grafana Cloud Guardrails

Grafana Cloud quota guardrails in `ramideltoro/nutsnews-infra` use the `grafanacloud-usage` datasource and live usage/limit metrics. They must not use committed metrics or logs free-plan constants for alert thresholds.

Required ratios:

| Guardrail | Live ratio |
| --- | --- |
| Metrics active series | `max(grafanacloud_instance_active_series / on(id) grafanacloud_instance_metrics_limits{limit_name="max_global_series_per_user"})` |
| Logs active streams | `grafanacloud_logs_instance_active_streams / grafanacloud_logs_instance_limits{limit_name="max_global_streams_per_user"}` |
| Logs ingestion rate | `grafanacloud_logs_instance_bytes_received_per_second / (grafanacloud_logs_instance_limits{limit_name="ingestion_rate_mb"} * 1024 * 1024)` |
| Traces ingestion rate | `grafanacloud_traces_instance_bytes_received_per_second / grafanacloud_traces_instance_limits{limit_name="ingestion_rate_limit_bytes"}` |

Alert thresholds are 70%, 85%, and 95%. Threshold alerts use `NoData=OK` so
missing usage data cannot masquerade as quota consumption. A separate alert
must fire when the active-series numerator or limit denominator is absent. The
staged rule detects absence; it does not yet prove staleness, so a collector-
freshness/last-seen signal and post-apply age test remain required.

Do not merge distinct budgets: 5,000 active series is the worker-uplift-plus-host
engineering sub-budget, 7,000 is the global steady-state operating ceiling, and
90,000 is the separate monthly synthetic-execution ceiling. The 70/85/95%
thresholds apply to each provider limit independently; native SLO count is not
part of these ratios.

The current source candidate configures five checks across two probes every five
minutes, projecting 86,400 executions in 30 days. That is above the 85,000
`major` band and below the 90,000 hard ceiling, so it remains an unresolved
rollout decision rather than an accepted steady state. Issue #474 requires one
choice before production plan/apply: change source to six minutes
(approximately 72,000), explicitly accept the standing major and set the
protected five-minute acknowledgment, or change the major threshold in reviewed
source while preserving the 90,000 ceiling. Until then plan/apply fails closed.

No-surprise-spend response:

| Threshold | Response |
| --- | --- |
| 70% | Freeze new telemetry classes, review the Usage / Quota dashboard, and confirm worker uplift remains inside the approved $0 incremental paid telemetry budget. |
| 85% | Disable optional debug fields, lower worker log verbosity, reduce scrape cardinality, and keep traces/exemplars disabled. |
| 95% | Stop or roll back the offending telemetry signal before adding production traffic. |
| Over budget | Keep production uplift disabled until owner approval changes the budget or telemetry volume is reduced. |

## Alloy Pipeline And Credentials

Alloy enabled is the production desired state. Disabling it is protected
break-glass behavior, not a routine metrics/log rollback, and requires explicit
operator confirmation plus an incident record.

Metrics:

- worker services expose the eight private loopback Prometheus endpoints on
  ports 18081 through 18088;
- Alloy must scrape all eight targets with stable `service`, bounded scrape-role,
  deployment-mode, and ownership identity; scrape-role compatibility labels
  are distinct from lifecycle event `stage`; this remains staged until
  post-apply evidence proves every target fresh;
- RabbitMQ metrics come from a private scrape/exporter path on the backend host;
- Alloy scrapes and writes through `prometheus.remote_write`;
- Alloy readiness, remote-write backlog/errors, and per-target collector
  freshness must be exported and alerted;
- credentials are `NUTSNEWS_GRAFANA_CLOUD_METRICS_URL`, `NUTSNEWS_GRAFANA_CLOUD_METRICS_USERNAME`, and `NUTSNEWS_GRAFANA_CLOUD_ACCESS_POLICY_TOKEN`.

Logs:

- service JSON logs and RabbitMQ logs flow through Alloy `loki.source`;
- `loki.process` applies redaction, canonical label normalization, size limits,
  and rate limits;
- only `deployment_environment`, `service`, `service_version`, `host`, `source`,
  and `severity` become stream labels; request/message/correlation/trace/article/
  feed/idempotency identifiers remain structured metadata;
- `loki.write` sends to Grafana Cloud Logs;
- Loki dropped entries and write retries must be exported and alerted;
- credentials are `NUTSNEWS_GRAFANA_CLOUD_LOGS_URL`, `NUTSNEWS_GRAFANA_CLOUD_LOGS_USERNAME`, and `NUTSNEWS_GRAFANA_CLOUD_ACCESS_POLICY_TOKEN`.

Backend issue `ramideltoro/nutsnews-worker#88` defines the staged source
configuration for collecting only explicitly tagged Docker journald streams on
`backend.nutsnews.com`. RabbitMQ uses the `nutsnews-worker-uplift-rabbitmq`
tag. Worker services use one stable tag per service:
`nutsnews-worker-uplift-scheduler`, `nutsnews-worker-uplift-fetcher`,
`nutsnews-worker-uplift-canonicalizer`, `nutsnews-worker-uplift-enrichment`,
`nutsnews-worker-uplift-approval`, `nutsnews-worker-uplift-translation`,
`nutsnews-worker-uplift-persistence`, and
`nutsnews-worker-uplift-publication`. Backend verification is through the
protected `Backend Worker-Uplift Logs Check` workflow after merge and deploy,
which reports only safe
metadata: Alloy health, bounded source count, trace export absence, and Loki
query result counts.

Traces, exemplars, and profiles:

- no Tempo, OTLP, traces, exemplar, or profiling write credentials are approved
  now;
- future trace enablement requires a new reviewed infra PR, green quota alerts for seven consecutive days, `WORKER_TELEMETRY_TRACES_ENABLED=true`, `WORKER_TELEMETRY_TRACE_SAMPLE_RATIO<=0.01`, and a scoped `traces:write` credential.

Retention follows the live Grafana Cloud `retention_period` limits reported by `grafanacloud_logs_instance_limits` and `grafanacloud_traces_instance_limits`. Do not request custom retention or Cloud Logs Export for worker uplift.

## Rollback Switches

| Signal | Switch |
| --- | --- |
| Worker metrics | `WORKER_TELEMETRY_METRICS_ENABLED=false` for a bounded producer rollback; this creates an observable telemetry-loss condition. |
| Worker logs | `WORKER_TELEMETRY_LOG_LEVEL=warn` or `WORKER_TELEMETRY_LOGS_ENABLED=false` for a bounded producer rollback. |
| Alloy | `enable_grafana_alloy=false` only through protected break glass with explicit confirmation and an incident record. |
| Traces | `WORKER_TELEMETRY_TRACES_ENABLED=false` and `WORKER_TELEMETRY_TRACE_SAMPLE_RATIO=0` |
| Exemplars | `WORKER_TELEMETRY_EXEMPLARS_ENABLED=false` |
| Profiles | No approved enable switch; keep profiling unconfigured. |

Telemetry loss alerts are required for Alloy readiness, remote-write backlog and
errors, Loki dropped entries and write retries, collector freshness, worker
metrics scrape absence, and RabbitMQ queue depth metric absence. During
non-owner qualification, missing required worker metrics or structured logs
blocks production traffic.

## Activation And Evidence Gate

This contract is staged repository work, not proof of live Grafana Cloud
coverage. Do not mark it complete until all of the following evidence exists:

1. backend PR #471's Runtime 1 digest pins are reconciled with the active older
   candidate, live `cutover_active` observation, and rollback deadline; the
   reconciled source then passes a fresh fail-closed qualification and deploys;
2. the backend GitOps apply enables Alloy and configures all eight loopback
   scrapes without exposing them publicly;
3. the Grafana Cloud plan and apply from `ramideltoro/nutsnews-infra` complete
   and post-apply queries show a fresh `up` series for every service;
4. Alloy readiness, remote-write backlog/errors, Loki drops/retries, and
   collector freshness have retained query evidence; all eight split services
   are deployed with `up == 1`, scrape age below 180 seconds, exact non-unknown
   build/deployment identity, and readiness series, with per-service
   `nutsnews_worker_expected_active` values matching the reconciled production
   ownership;
5. any service intentionally changed to `nutsnews_worker_expected_active=1`
   additionally has a successful readiness outcome, scheduler loop/cycle or
   delivery-stage activity as applicable, service last-success evidence, and
   worker-local paging eligibility; RabbitMQ depth/unacked/consumer and the
   availability-guarded backend outbox-age signal also have retained evidence;
6. non-owning services produce dashboard evidence without paging, and a bounded
   drill against an isolated fixture or test target proves the ownership gate;
   never change production `nutsnews_worker_expected_active` merely to test
   paging;
7. Loki evidence shows only the six canonical stream labels and confirms all
   high-cardinality identifiers remain structured metadata;
8. quota numerator, denominator, ratio, threshold-rule health, and the separate
   missing-telemetry alert are verified.

Until these gates pass, describe the work as staged or configured in source,
not live, applied, operational, or complete.

## Privacy Boundary

No production secret, article body, summary body, raw feed XML, raw article HTML, model prompt, model response, database URL, service-role token, access token, cookie, authorization header, or API key may be included in metrics, logs, traces, or exemplars.

Payload references remain in service-owned durable storage. Telemetry may report counts, outcomes, durations, bounded queue names, bounded service names, and sanitized error classes.
