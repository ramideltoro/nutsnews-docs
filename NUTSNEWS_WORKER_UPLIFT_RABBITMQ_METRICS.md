# NutsNews Worker-Uplift RabbitMQ Metrics

Status: backend collection path implemented for `ramideltoro/nutsnews-worker#87`
on 2026-07-23; Grafana Cloud freshness proof remains blocked because the
available telemetry credentials return HTTP 401 for Prometheus queries.

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
| Backend RabbitMQ Metrics Check with Grafana freshness requirement | Blocked: telemetry credentials return HTTP 401 for Prometheus query |
| Backend drift check after metrics apply | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30017885344> |
| Backend health report after metrics apply | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30017885364> |

The passing metrics proof reported:

```text
rabbitmq_aggregate_endpoint=healthy
rabbitmq_detailed_endpoint=healthy
rabbitmq_prometheus_listener=healthy
alloy_service=healthy
alloy_config=healthy
grafana_rabbitmq_query=not_configured
```

The optional Grafana query result was:

```text
optional Grafana query did not pass: Grafana query failed: HTTP 401
```

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
