---
wiki:
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: d341d430c7119ecc0c659c1f9fa09b0bc3dfbf7f1297a71bffe37f5081d2fb23
  source_route: /technical/nutsnews-worker-uplift-telemetry-scope
  simple_route: /simple/nutsnews-worker-uplift-telemetry-scope
  primary_diagram:
    file: diagrams/NUTSNEWS_WORKER_UPLIFT_TELEMETRY_SCOPE.mmd
    accTitle: Staged worker-uplift observability activation flow
    accDescr: >-
      The diagram shows the staged worker-uplift observability contract, its
      eight private metrics endpoints, truthful health and ownership gates,
      Grafana Cloud metrics and logs, quota safeguards, deferred signals, and
      the evidence required before the work can be called live.
  status: active
  collection: start-here
  section: overview
  order: 0
title: NutsNews Worker-Uplift Telemetry Scope
description: >-
  A plain-language summary of which telemetry the worker-uplift pipeline may
  emit, what is blocked, and the limits and guardrails that apply.
---
# NutsNews Worker-Uplift Telemetry Scope

This article explains the staged telemetry scope for the NutsNews worker-uplift
pipeline. It covers metrics, logs, truthful health, ownership gates, volume
budgets, guardrails, rollback switches, and privacy rules.

Status: hardening changes are staged and awaiting human review, merge,
deployment, a reviewed Grafana Cloud apply, and retained evidence.

Companion infra policy (must be reconciled in the same reviewed rollout):

```text
ramideltoro/nutsnews-infra/terraform/grafana-cloud/catalog/worker-uplift-telemetry-scope.json
```

The companion JSON now has the staged core labels, outcomes, quota, and
ownership changes, but it still needs the exact bucket, health, SLO, Alloy
break-glass, value-bound, and unreviewed-status rules below. Source changes alone
do not make this telemetry live. Legacy `nutsnews-worker` remains the production
ingestion owner; all eight uplift services stay shadow-only with
`nutsnews_worker_expected_active=0` until a separate reviewed cutover changes
ownership.

`nutsnews-backend` owns worker deployment, backend Alloy, and backend-hosted
ownership and outbox gauges. The scheduler, fetcher, canonicalizer, enrichment,
approval, translation, persistence, and publication repositories each own that
service's identity, health, lifecycle, and latency signals. `nutsnews-infra`
alone owns Grafana resources. The `nutsnews-worker` meta-repository coordinates
rollout, while the legacy worker keeps production ingestion ownership until
cutover approval. These producer responsibilities are different from the
`owner` label that helps route an alert. The Current Production Ownership
dashboard must show the backend revision and exact deployed identity for all
eight split-worker services.

## Signal Matrix

| Telemetry class | Decision | Destination | Notes |
| --- | --- | --- | --- |
| RabbitMQ metrics | Required | Grafana Cloud Metrics | Queue depth, ready/unacked messages, publish/deliver/ack/retry/DLQ rates, consumers, and broker health. |
| Worker service metrics | Required | Grafana Cloud Metrics | Per-service counters, gauges, and bounded histograms for throughput, latency, retries, failures, and backpressure. |
| Structured logs | Required | Grafana Cloud Logs | JSON service logs and RabbitMQ service logs after redaction, size limits, rate limits, and buffering. |
| Traces | Deferred | None | No Tempo export, OTLP endpoint, or traces credential is provisioned now. |
| Exemplars | Deferred | None | No exemplars until traces are separately approved. |
| Profiles | Deferred | None | No profiling backend, credential, or sampling policy is approved now. |
| Scrubbed exceptions and replays | Existing canonical path | Sentry | Sentry remains the canonical scrubbed exception/replay store. |
| Article/model payload telemetry | Forbidden | None | Article bodies, summaries, model prompts, model outputs, secrets, and production token material must not enter telemetry. |

Full trace export is not a runtime dependency. Services may keep safe
`pipelineRunId`, `correlationId`, and `traceparent` fields as structured
metadata, but identifiers must never become metric labels or Loki stream
labels.

## Labels And Correlation

Application event metrics use only the bounded dimensions that apply:

```text
service, stage, queue, outcome, dependency, language, provider, probe, check
```

For lifecycle events, `stage` means the message route (`fetch` through
`publication`), not the worker process name. Existing compatibility series may
carry other bounded scrape labels while they are migrated; those labels are not
approved as new event dimensions.

Prometheus and Alloy may add bounded scrape labels such as
`deployment_environment`, `host`, `job`, and `instance`; histogram buckets also
use `le`. Build revision, service version, deployment mode, adapter mode, and
the canonical `nutsnews_worker_expected_active` ownership signal belong in
one-valued info/state gauges instead of every event series.

Loki stream labels are exactly:

```text
deployment_environment, service, service_version, host, source, severity
```

Values are bounded too: lifecycle/health/consumer outcomes use reviewed finite
sets; dependencies and checks use per-service allowlists; languages are `fr`,
`ja`, `de-CH`, `de`, or `el`; provider is `local_ai`; probes are `liveness`,
`startup`, or `readiness`; Loki source is `file`, `journal`, or `container`; and
severity normalizes to `critical`, `error`, `warning`, `info`, or `unknown`.
Missing values become `unknown`; unrecognized supplied values become `other` or
are dropped. `service_version` comes only from the deployment inventory.

Forbidden in metric labels and Loki stream labels:

```text
article, feed, message, idempotency, trace, span, correlation, causation,
payload, url, path, user, ip, token, secret, prompt, model_output
```

The lifecycle vocabulary is accepted, duplicate, invalid, retry, DLQ, and
terminal. The stage counter records accepted work as `outcome="success"`.
"Terminal" is the final DLQ completion class, not an extra runtime event that
would double-count a message.

Consumer lifecycle telemetry uses the same approved label boundary. Runtime `0.5.0` exposes:

- `nutsnews_worker_consumers`, a per-service/per-main-queue active consumer gauge;
- `nutsnews_worker_consumer_events_total`, a counter for bounded outcomes such as `active`, `cancelled`, `channel-dropped`, `recovering`, and `closed`;
- `runtime.broker.consumer_state_changed`, a structured JSON event carrying stage, queue, previous state, current state, and a bounded reason.

Consumer events must never include RabbitMQ URLs, credentials, message bodies,
or article/model payloads. Grafana Cloud alert ownership remains in
`ramideltoro/nutsnews-infra`; consumer-loss rules page only when the affected
deployment owns production.

## Private Metrics And Truthful Health

Backend Alloy must be the only scraper. These loopback endpoints may not be
published through Caddy or the public firewall. The eight-target configuration
is staged in source and still needs merge, deployment, and fresh-scrape proof:

| Service | Port |
| --- | ---: |
| scheduler | `18081` |
| fetcher | `18082` |
| canonicalizer | `18083` |
| enrichment | `18084` |
| approval | `18085` |
| translation | `18086` |
| persistence | `18087` |
| publication | `18088` |

The target requires every service to report liveness, startup, and readiness
with separate state metrics. Scheduler
readiness in production requires an active scheduling loop and healthy
production adapters. Fetcher readiness exposes its real state-store mode and
cannot pass production readiness with an in-memory store.

## Worker Metric Contract

Merged source in all eight service repositories implements private-endpoint
ownership, identity, health, and freshness telemetry. The seven delivery
processors also implement `nutsnews_worker_uplift_stage_events_total` and the fixed-bucket
`nutsnews_worker_uplift_stage_latency_seconds` histogram. Scheduler instead
exports its fixed-bucket cycle histogram and is outside the stage-event SLI.
The stage histogram includes `_bucket`, `_sum`, `_count`, a 30-second boundary,
and `+Inf`.

Worker Contracts `1.0.0` and Worker Runtime `1.0.0` are now published,
attested, and install-smoke verified in the required order from merge commits
`e86ea51814cb1b1d810e95b7971a59d90a2fce31` and
`80bc2d1cc1ce2f089386c2653f9a69abe1ce9808`. All eight service PRs are merged,
and each main push published a signed, attested immutable Runtime 1 image with
provenance, SBOM, manifest, and baked-revision evidence recorded in
[`nutsnews-infra#474`](https://github.com/ramideltoro/nutsnews-infra/issues/474#issuecomment-5152934401).
Backend digest pinning and a fresh fail-closed qualification are still in
progress, and no image has been deployed. The deployed Runtime `0.5` baseline
may therefore still show legacy `_duration_ms` summaries; Grafana stage SLIs
use only the new fixed-bucket seconds histograms.

Required operational signals include:

- the canonical `nutsnews_worker_expected_active` ownership gauge, deployment
  and adapter modes, build revision, and service version;
- per-service `up`, scrape freshness, scheduler loop state, and last-success
  time;
- fetcher durable-state readiness and actual/expected store mode;
- RabbitMQ ready depth, unacknowledged depth, and consumers by bounded queue;
- backend-owned worker outbox pressure and global feed freshness as separate
  signals.

All eight split services are shadow-only in the baseline and report
`nutsnews_worker_expected_active=0`. They must still be deployed, report
`up == 1`, have a scrape less than 180 seconds old, expose readiness series,
and report exact non-`unknown` build and deployment identity. Missing structural
series are never hidden by the ownership gate.

Only a service changed to `nutsnews_worker_expected_active=1` must also report a
successful readiness outcome and become eligible for worker-local paging. An
active scheduler must show loop/cycle activity and last success; an active
delivery worker must show stage activity and last success. Consumer, latency,
publication, and worker-local freshness alerts may use the ownership gate.

The backend owns the oldest worker-pressure value:
`nutsnews_backend_worker_uplift_oldest_unconfirmed_outbox_age_seconds`. Use it
only when `nutsnews_backend_worker_uplift_outbox_available == 1`; unavailable
projection data is a separate failure. This is not the global reader-visible
15-minute feed-freshness SLO.

Custom worker-local consumer, latency, publication, and freshness alerts join
to `nutsnews_worker_expected_active`. The source-staged shadow deployment keeps
that value at `0` so services remain visible without paging. Structural scrape, identity, and
readiness-series absence still alerts or blocks rollout. The native Worker
terminal SLI does not use that join; its generated burn-alert resources are
omitted because source defaults `worker_terminal_slo_alerting_enabled` to
`false`. The protected live value still needs confirmation. Source does not
couple those controls automatically, so both may change only during the same
reviewed production cutover. The global reader-visible durable
feed-freshness SLO and its three-hour critical guardrail are not ownership-gated
and remain enabled regardless of which ingestion implementation owns
production.

## What Still Blocks Activation

The repository work does not yet satisfy the whole target contract:

- All eight endpoint implementations are merged and verified immutable images
  are published. They are not yet pinned into backend deployment source,
  qualified by a fresh fail-closed run, deployed, or scraped. Exact image
  evidence is retained in
  [`nutsnews-infra#474`](https://github.com/ramideltoro/nutsnews-infra/issues/474#issuecomment-5152934401).
- The target latency buckets are `0.005`, `0.01`, `0.025`, `0.05`, `0.1`,
  `0.25`, `0.5`, `1`, `2.5`, `5`, `10`, `30`, `60`, `120`, and `300` seconds,
  plus `+Inf`. Merged service source uses the complete set, but live scrapes
  still must prove that every running service agrees.
- Stage counters and histograms for the seven delivery processors, the scheduler
  cycle histogram, Runtime 1 probe/check health, and ownership gauges exist in
  merged source and published images. Repository merge and image evidence covers
  the source artifacts, but live queries must still prove exact-once outcomes,
  safe duplicate handling, bounded labels, truthful dependency health,
  identity, and last-success semantics operationally.
- Generic runtime `_duration_ms` summaries may remain on deployed Runtime `0.5`.
  Their absence is not operational until Runtime `1.0.0` worker images are
  pinned in backend source, deployed, and scraped.
- Staged infra now uses `nutsnews_worker_expected_active` consistently.
  Consumer, latency, worker-local freshness, publication, and active-worker
  activity/readiness outcomes are gated. Required scrape freshness, identity,
  and readiness-series presence are not. The global feed-freshness SLO and
  three-hour guardrail are intentionally not gated. The changes remain
  unapplied, so post-apply query and drill evidence is still required.
- The companion JSON has the core corrections but still lacks the exact bucket,
  health, native-SLO, Alloy break-glass, and value-bound semantics; its approved
  status also conflicts with this unreviewed bundle.
- The package release order is complete, but it does not close service-specific
  lease, health, identity, lifecycle, label, security, or workflow reviews.

## Native Grafana SLOs

The overall rollout has exactly four native 30-day SLOs: public availability at
99.5%; API latency with 95% of successful `canonical_articles_api` synthetic
observations within 750 ms; feed freshness at 99% within 15 minutes; and worker
terminal success at 99%. Failed API probe assertions stay outside the latency
denominator as availability/correctness failures.

Feed freshness uses global reader-visible durable production-content age. Its
burn alerts and three-hour critical guardrail stay enabled under either legacy
or split-worker ownership. Only Worker terminal-success burn alerts stay off
while uplift is shadowed.

Worker success is an event-weighted ratio across every canonical delivery stage,
not a publication-only or per-article rate; one pipeline can contribute several
stage completions, and scheduler cycles are excluded. Success counts `success`
and `duplicate`. The denominator counts `success`, `duplicate`, `invalid`,
`failure`, and `dlq`; retry is intermediate and excluded, while `failure` is
forward-compatible until producers converge. `terminal` is a category, not a
metric value. Zero work is NoData, not failure. Source defaults the alert
boolean to `false`, and the protected live value still needs confirmation, so
Worker terminal-success burn alerts stay off while uplift is shadowed. The five SLI
catalog entries are dashboard/custom-rule metadata, not five more native SLOs,
and SLO count is not part of usage-quota ratios.

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
| --- | ---:|
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
| --- | ---:|
| RabbitMQ queue metrics | 700 active series |
| Worker service metrics | 600 active series |
| Worker histogram metrics | 700 active series |
| Backend host series headroom | 2,000 active series |
| VPS host series headroom | 1,000 active series |
| Worker-uplift plus host ceiling | 5,000 active series |

Monthly log ceilings:

| Area | Ceiling |
| --- | ---:|
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

Alert thresholds are 70%, 85%, and 95%. Those threshold alerts treat missing
data as OK so a telemetry gap cannot look like high usage. A separate alert
reports an absent active-series numerator or limit denominator. The staged rule
does not yet prove staleness, so collector last-seen age still needs an alert and
post-apply test.

The 5,000-series worker/host engineering budget, 7,000-series global operating
ceiling, and 90,000 monthly synthetic-execution ceiling are separate. The
70/85/95% thresholds apply independently to provider limits; SLO count is not
part of those ratios.

The current source candidate uses five checks across two probes every five
minutes, projecting 86,400 executions. That is above the 85,000 `major` band
and below the 90,000 hard ceiling, so it is not an approved steady state yet.
Issue #474 requires one choice before production plan/apply: change source to
six minutes (about 72,000), explicitly accept the standing major at five
minutes, or change the major threshold in reviewed source while preserving the
90,000 ceiling. Until then plan/apply fails closed.

No-surprise-spend response:

| Threshold | Response |
| --- | --- |
| 70% | Freeze new telemetry classes, review the Usage / Quota dashboard, and confirm worker uplift remains inside the approved $0 incremental paid telemetry budget. |
| 85% | Disable optional debug fields, lower worker log verbosity, reduce scrape cardinality, and keep traces/exemplars disabled. |
| 95% | Stop or roll back the offending telemetry signal before adding production traffic. |
| Over budget | Keep production uplift disabled until owner approval changes the budget or telemetry volume is reduced. |

## Alloy Pipeline And Credentials

Keeping Alloy enabled is the production desired state. Turning it off is
protected break glass that requires explicit confirmation and an incident
record, not a normal metrics/log rollback.

Metrics:

- worker services expose all eight loopback `/metrics` endpoints on ports 18081
  through 18088;
- Alloy must scrape all eight with stable service, bounded scrape-role,
  deployment-mode, and ownership identity; scrape-role labels are distinct from
  lifecycle route-stage labels; this remains staged until post-apply evidence
  proves every target fresh;
- RabbitMQ metrics come from a private scrape/exporter path on the backend host;
- Alloy scrapes and writes through `prometheus.remote_write`;
- Alloy readiness, remote-write backlog/errors, and collector freshness are
  exported and alerted;
- credentials are `NUTSNEWS_GRAFANA_CLOUD_METRICS_URL`, `NUTSNEWS_GRAFANA_CLOUD_METRICS_USERNAME`, and `NUTSNEWS_GRAFANA_CLOUD_ACCESS_POLICY_TOKEN`.

Logs:

- service JSON logs and RabbitMQ logs flow through Alloy `loki.source`;
- `loki.process` applies redaction, canonical label normalization, size limits,
  and rate limits;
- only `deployment_environment`, `service`, `service_version`, `host`, `source`,
  and `severity` are indexed stream labels; request, message, correlation,
  trace, article, feed, and idempotency IDs remain structured metadata;
- `loki.write` sends to Grafana Cloud Logs;
- Loki drops and write retries are exported and alerted;
- credentials are `NUTSNEWS_GRAFANA_CLOUD_LOGS_URL`, `NUTSNEWS_GRAFANA_CLOUD_LOGS_USERNAME`, and `NUTSNEWS_GRAFANA_CLOUD_ACCESS_POLICY_TOKEN`.

Backend issue `ramideltoro/nutsnews-worker#88` defines the staged source
configuration for collecting explicitly tagged Docker journald streams on
`backend.nutsnews.com`. RabbitMQ and each worker use stable service tags. After
merge and deploy, the protected `Backend Worker-Uplift Logs Check` workflow must
report only safe metadata: Alloy health, bounded source count, trace-export
absence, and Loki query-result counts.

Traces, exemplars, and profiles:

- no Tempo, OTLP, trace, exemplar, or profiling write credentials are approved
  now;
- future trace enablement requires a new reviewed infra PR, green quota alerts for seven consecutive days, `WORKER_TELEMETRY_TRACES_ENABLED=true`, `WORKER_TELEMETRY_TRACE_SAMPLE_RATIO<=0.01`, and a scoped `traces:write` credential.

Retention follows the live Grafana Cloud `retention_period` limits reported by `grafanacloud_logs_instance_limits` and `grafanacloud_traces_instance_limits`. Do not request custom retention or Cloud Logs Export for worker uplift.

## Rollback Switches

| Signal | Switch |
| --- | --- |
| Worker metrics | `WORKER_TELEMETRY_METRICS_ENABLED=false`; this creates a visible telemetry-loss condition. |
| Worker logs | `WORKER_TELEMETRY_LOG_LEVEL=warn` or `WORKER_TELEMETRY_LOGS_ENABLED=false`. |
| Alloy | `enable_grafana_alloy=false` only through confirmed, incident-recorded break glass. |
| Traces | `WORKER_TELEMETRY_TRACES_ENABLED=false` and `WORKER_TELEMETRY_TRACE_SAMPLE_RATIO=0` |
| Exemplars | `WORKER_TELEMETRY_EXEMPLARS_ENABLED=false` |
| Profiles | No approved enable switch; keep profiling unconfigured. |

Telemetry loss alerts are required for Alloy readiness, remote-write backlog and
errors, Loki drops and retries, collector freshness, worker scrape absence, and
RabbitMQ queue-depth absence. During shadow qualification, missing required
worker metrics or logs blocks production traffic without paging the shadow
deployment.

## Activation And Evidence Gate

This is source/image-prepared work, not proof of live Grafana Cloud coverage.
It becomes complete only after the eight published image digests are pinned in
backend source, pass a fresh fail-closed qualification, deploy, and reviewed
backend and `nutsnews-infra` GitOps applies succeed.
Retained evidence must then show:

- Alloy readiness/backlog/error/drop/freshness health; all eight workers
  deployed with `up == 1`, scrape age below 180 seconds, exact non-unknown
  build/deployment identity, readiness series, and the shadow ownership value;
- successful readiness plus loop/cycle or stage activity, last success, and
  worker-local paging only for any service whose ownership value is `1`;
- lifecycle counters, seconds histograms, RabbitMQ depth/unacked/consumers, and
  the backend outbox-age value guarded by its availability series;
- shadow dashboards stay useful without paging;
- an isolated fixture or test-target drill proves the ownership alert gate,
  without changing production `nutsnews_worker_expected_active` to test it;
- Loki uses only the six approved stream labels and keeps IDs as metadata;
- quota numerator, denominator, ratio, rule health, and the separate
  missing-telemetry alert work as designed.

Until that evidence exists, call the work staged or configured in source—not
live, applied, operational, or complete.

## Privacy Boundary

No production secret, article body, summary body, raw feed XML, raw article HTML, model prompt, model response, database URL, service-role token, access token, cookie, authorization header, or API key may be included in metrics, logs, traces, or exemplars.

Payload references remain in service-owned durable storage. Telemetry may report counts, outcomes, durations, bounded queue names, bounded service names, and sanitized error classes.
