# NutsNews Worker-Uplift Telemetry Scope

Status: approved for `ramideltoro/nutsnews-worker#144` on 2026-07-23.

Canonical infra policy:

```text
ramideltoro/nutsnews-infra/terraform/grafana-cloud/catalog/worker-uplift-telemetry-scope.json
```

This decision approves the telemetry the worker-uplift pipeline may emit before runtime telemetry work begins. It does not enable the uplift production path.

## Signal Matrix

| Telemetry class | Decision | Destination | Notes |
| --- | --- | --- | --- |
| RabbitMQ metrics | Required | Grafana Cloud Metrics | Queue depth, ready/unacked messages, publish/deliver/ack/retry/DLQ rates, consumers, and broker health. |
| Worker service metrics | Required | Grafana Cloud Metrics | Per-service counters, gauges, and bounded histograms for throughput, latency, retries, failures, and backpressure. |
| Structured logs | Required | Grafana Cloud Logs | JSON service logs and RabbitMQ service logs after redaction, size limits, rate limits, and buffering. |
| Traces | Deferred | None | No Tempo export, OTLP endpoint, or traces credential is provisioned now. |
| Exemplars | Deferred | None | No exemplars until traces are separately approved. |
| Profiles | Forbidden | None | No profiling signal is approved for worker uplift. |
| Article/model payload telemetry | Forbidden | None | Article bodies, summaries, model prompts, model outputs, secrets, and production token material must not enter telemetry. |

Full trace export is not a runtime dependency. The envelope still carries W3C trace context, and services may include `traceparent`, `tracestate`, `correlationId`, `causationId`, `messageId`, and `idempotencyKey` as structured log fields. Those fields must not become metric labels or Loki stream labels.

## Labels

Allowed metric labels and Loki stream labels for worker-uplift telemetry:

```text
environment
host
service
version
queue
outcome
```

Forbidden in metric labels and Loki stream labels:

```text
article, feed, message, idempotency, trace, span, correlation, causation,
payload, url, path, user, ip, token, secret, prompt, model_output
```

The `queue` value is bounded to the contract-defined RabbitMQ queue names. The `service` value is bounded to the eight worker-uplift services. The `outcome` value is bounded to `success`, `retry`, `dlq`, `dropped`, `timeout`, `validation_error`, `dependency_error`, and `canceled`.

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
| Metrics active series | `grafanacloud_instance_metrics_usage / grafanacloud_instance_metrics_limits{limit_name="max_global_series_per_user"}` |
| Logs active streams | `grafanacloud_logs_instance_active_streams / grafanacloud_logs_instance_limits{limit_name="max_global_streams_per_user"}` |
| Logs ingestion rate | `grafanacloud_logs_instance_bytes_received_per_second / (grafanacloud_logs_instance_limits{limit_name="ingestion_rate_mb"} * 1024 * 1024)` |
| Traces ingestion rate | `grafanacloud_traces_instance_bytes_received_per_second / grafanacloud_traces_instance_limits{limit_name="ingestion_rate_limit_bytes"}` |

Alert thresholds are 70%, 85%, and 95%.

No-surprise-spend response:

| Threshold | Response |
| --- | --- |
| 70% | Freeze new telemetry classes, review the Usage / Quota dashboard, and confirm worker uplift remains inside the approved $0 incremental paid telemetry budget. |
| 85% | Disable optional debug fields, lower worker log verbosity, reduce scrape cardinality, and keep traces/exemplars disabled. |
| 95% | Stop or roll back the offending telemetry signal before adding production traffic. |
| Over budget | Keep production uplift disabled until owner approval changes the budget or telemetry volume is reduced. |

## Alloy Pipeline And Credentials

Metrics:

- worker services expose private Prometheus metrics endpoints;
- RabbitMQ metrics come from a private scrape/exporter path on the backend host;
- Alloy scrapes and writes through `prometheus.remote_write`;
- credentials are `NUTSNEWS_GRAFANA_CLOUD_METRICS_URL`, `NUTSNEWS_GRAFANA_CLOUD_METRICS_USERNAME`, and `NUTSNEWS_GRAFANA_CLOUD_ACCESS_POLICY_TOKEN`.

Logs:

- service JSON logs and RabbitMQ logs flow through Alloy `loki.source`;
- `loki.process` applies redaction, label allow-listing, size limits, and rate limits;
- `loki.write` sends to Grafana Cloud Logs;
- credentials are `NUTSNEWS_GRAFANA_CLOUD_LOGS_URL`, `NUTSNEWS_GRAFANA_CLOUD_LOGS_USERNAME`, and `NUTSNEWS_GRAFANA_CLOUD_ACCESS_POLICY_TOKEN`.

Backend issue `ramideltoro/nutsnews-worker#88` implements the approved log
scope by collecting only explicitly tagged Docker journald streams on
`backend.nutsnews.com`. RabbitMQ uses the `nutsnews-worker-uplift-rabbitmq`
tag. Worker services use one stable tag per service:
`nutsnews-worker-uplift-scheduler`, `nutsnews-worker-uplift-fetcher`,
`nutsnews-worker-uplift-canonicalizer`, `nutsnews-worker-uplift-enrichment`,
`nutsnews-worker-uplift-approval`, `nutsnews-worker-uplift-translation`,
`nutsnews-worker-uplift-persistence`, and
`nutsnews-worker-uplift-publication`. Backend verification is through the
protected `Backend Worker-Uplift Logs Check` workflow, which reports only safe
metadata: Alloy health, bounded source count, trace export absence, and Loki
query result counts.

Traces and exemplars:

- no Tempo, OTLP, traces, or exemplar write credentials are approved now;
- future trace enablement requires a new reviewed infra PR, green quota alerts for seven consecutive days, `WORKER_TELEMETRY_TRACES_ENABLED=true`, `WORKER_TELEMETRY_TRACE_SAMPLE_RATIO<=0.01`, and a scoped `traces:write` credential.

Retention follows the live Grafana Cloud `retention_period` limits reported by `grafanacloud_logs_instance_limits` and `grafanacloud_traces_instance_limits`. Do not request custom retention or Cloud Logs Export for worker uplift.

## Rollback Switches

| Signal | Switch |
| --- | --- |
| Metrics | `WORKER_TELEMETRY_METRICS_ENABLED=false` or `enable_grafana_alloy=false` |
| Logs | `WORKER_TELEMETRY_LOG_LEVEL=warn`, `WORKER_TELEMETRY_LOGS_ENABLED=false`, or `enable_grafana_alloy=false` |
| Traces | `WORKER_TELEMETRY_TRACES_ENABLED=false` and `WORKER_TELEMETRY_TRACE_SAMPLE_RATIO=0` |
| Exemplars | `WORKER_TELEMETRY_EXEMPLARS_ENABLED=false` |

Telemetry loss alerts are required for Alloy Loki dropped entries, Alloy Loki write retries, worker metrics scrape absence, and RabbitMQ queue depth metric absence. During shadow qualification, missing required worker metrics or structured logs blocks production traffic.

## Privacy Boundary

No production secret, article body, summary body, raw feed XML, raw article HTML, model prompt, model response, database URL, service-role token, access token, cookie, authorization header, or API key may be included in metrics, logs, traces, or exemplars.

Payload references remain in service-owned durable storage. Telemetry may report counts, outcomes, durations, bounded queue names, bounded service names, and sanitized error classes.
