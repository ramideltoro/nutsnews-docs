---
title: NutsNews Worker-Uplift Operation Map
wiki:
  source_route: /technical/nutsnews-worker-uplift-operation-map/
  simple_route: /simple/nutsnews-worker-uplift-operation-map/
  primary_diagram:
    file: diagrams/NUTSNEWS_WORKER_UPLIFT_OPERATION_MAP.mmd
    accTitle: "Worker-uplift ownership boundaries and retention domains"
    accDescr: "Shows which repo owns backend, infra, worker-uplift, and legacy-worker-retirement operations, plus what must not call legacy worker scripts."
  status: active
  collection: ai-and-automation
  section: Automation & Workers
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 43133a8914ccc66ba4abc694fc8b4fcbc6142884bf606aec7c4e233757c5d313
---

# NutsNews Worker-Uplift Operation Map

This page links the shared documentation hub to the backend-owned operation map
for `ramideltoro/nutsnews-worker#70`.

Canonical source of truth:

```text
ramideltoro/nutsnews-backend/docs/worker-uplift-operation-map.json
```

Backend runbook:

```text
ramideltoro/nutsnews-backend/runbooks/WORKER_UPLIFT_OPERATION_MAP.md
```

Validator:

```bash
python3 scripts/validate_worker_uplift_operation_map.py
```

## Operating Boundary

The map assigns one owner for each retained operation without changing
production. It does not mutate servers, legacy Cloudflare Workers, Cloudflare
DNS records, or Grafana Cloud resources.

New worker-uplift deployment, smoke, health, queue, DLQ, broker,
reconciliation, and cutover operations must not require a checkout of
`ramideltoro/nutsnews-worker`. The legacy Worker repo remains a rollback source
until cutover retirement, but the new backend runtime must not call or source
legacy Worker scripts.

## Owners

| Surface | Owner | Source of truth |
| --- | --- | --- |
| Backend host deploy, restart, status, logs, smoke, health, queue/DLQ, drain, broker, reconciliation, backup, restore, and cutover operations | `ramideltoro/nutsnews-backend` | backend workflows, runbooks, and operation map |
| Worker-uplift RabbitMQ release, queue type, capacity, and security envelope | `ramideltoro/nutsnews-backend` plus shared docs | [Worker-Uplift RabbitMQ Capacity And Security](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_CAPACITY_SECURITY.md) |
| Worker-uplift RabbitMQ provisioning, health probe, restart verification, and rollback | `ramideltoro/nutsnews-backend` plus shared docs | [Worker-Uplift RabbitMQ Provisioning](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_PROVISIONING.md) |
| Worker-uplift stage code | Stage service repos listed in `ramideltoro/nutsnews-backend/docs/worker-uplift-architecture-adr.json` | individual service repositories |
| Grafana folders, dashboards, alert rules, synthetics, quotas, and resource drift | `ramideltoro/nutsnews-infra` | `terraform/grafana-cloud` and Grafana Cloud workflows |
| Worker-uplift telemetry scope, budget, labels, and trace/exemplar decision | `ramideltoro/nutsnews-infra` plus `ramideltoro/nutsnews-docs` | `terraform/grafana-cloud/catalog/worker-uplift-telemetry-scope.json` and [Worker-Uplift Telemetry Scope](NUTSNEWS_WORKER_UPLIFT_TELEMETRY_SCOPE.md) |
| DNS failover controller operations | `ramideltoro/nutsnews-infra` | Cloudflare DNS failover controller workflows and runbooks |
| Tracking issue order | `ramideltoro/nutsnews-worker` | tracking issues only |

## Legacy Worker Classification

The backend map audits these legacy Worker surfaces and classifies each as
copyable behavior, current API reuse, or intentional retirement:

- shard deploy and generated Wrangler configs;
- public smoke, post-deploy verification, and edge snapshot health;
- backend shadow smoke;
- feed health;
- translation quality audit;
- backpressure and lock safety;
- database provider switch;
- Supabase backup and restore validation;
- DNS failover controller alerts and Analytics Engine evidence.

DNS failover is separate from ingestion. Backend-host routing for
`backend.nutsnews.com` does not replace public apex/www failover ownership, and
worker-uplift services must not call legacy failover scripts.
