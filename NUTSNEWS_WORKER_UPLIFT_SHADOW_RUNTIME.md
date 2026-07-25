# NutsNews Worker-Uplift Shadow Runtime

This document records the backend-owned shadow runtime for
`ramideltoro/nutsnews-worker#117`.

## Scope

The backend runtime deploys the non-AI worker-uplift services on
`backend.nutsnews.com` through `ramideltoro/nutsnews-backend` protected Ansible
apply. It does not replace the legacy Cloudflare Worker ingestion path and does
not publish production article state.

The #117 service set is:

| Service | Source repo | Health endpoint | Queue boundary |
| --- | --- | --- | --- |
| `scheduler` | `ramideltoro/nutsnews-worker-feed-scheduler` | `127.0.0.1:18081/ready` | publishes `nutsnews.worker.fetch.v1` |
| `fetcher` | `ramideltoro/nutsnews-worker-feed-fetcher` | `127.0.0.1:18082/ready` | consumes fetch, publishes canonicalization |
| `canonicalizer` | `ramideltoro/nutsnews-worker-article-canonicalizer` | `127.0.0.1:18083/ready` | consumes canonicalization, publishes enrichment |
| `enrichment` | `ramideltoro/nutsnews-worker-article-enrichment` | `127.0.0.1:18084/ready` | consumes enrichment, publishes approval |

The pipeline intentionally stops at `nutsnews.worker.approval.v1`. Approval,
translation, persistence, and publication services remain gated by later issues.

## Deployment Path

Enable and apply only through the protected backend workflow:

```text
Protected Backend Ansible Apply
NUTSNEWS_BACKEND_WORKER_RUNTIME_ENABLED=true
NUTSNEWS_BACKEND_WORKER_RUNTIME_PRODUCTION_WRITES_ENABLED=false
```

The backend repo pins service images by GHCR digest and records signed
provenance metadata. Mutable tags are rejected by the runtime manager.

The runtime uses Docker host networking so service containers can reach the
existing loopback-only PostgreSQL and RabbitMQ listeners without opening public
ports. Each service binds its health endpoint to a unique `127.0.0.1` port.

## Credential Boundary

No connection string, token, password, or secret fragment is committed.

The protected workflow assembles runtime values from production-backend
Environment secrets:

- PostgreSQL URLs use the stage-specific worker-uplift roles against
  `nutsnews_primary_shadow`.
- RabbitMQ URLs use the scheduler publisher identity and the forwarding-stage
  runtime identities.
- The scheduler receives the backend API token only for shadow feed-source
  reads.

Backend API writes and production article writes stay disabled.

## Verification

After protected check/apply, verify from the backend host:

```bash
sudo -n /usr/local/sbin/nutsnews-worker-runtime status
sudo -n /usr/local/sbin/nutsnews-worker-runtime queue-inspect --service-name scheduler
sudo -n /usr/local/sbin/nutsnews-worker-runtime queue-inspect --service-name fetcher
sudo -n /usr/local/sbin/nutsnews-worker-runtime queue-inspect --service-name canonicalizer
sudo -n /usr/local/sbin/nutsnews-worker-runtime queue-inspect --service-name enrichment
```

Expected results:

- all four service containers report healthy;
- RabbitMQ queues remain in the `nutsnews.worker.*.v1` namespace;
- each service uses only its declared PostgreSQL stage schema;
- a bounded fixture can advance through enrichment and stop at the approval
  queue;
- legacy Cloudflare ingestion remains active and unchanged;
- Grafana/Alloy telemetry sees RabbitMQ queue metrics and
  `nutsnews-worker-uplift-*` journald tags.

## Rollback

Rollback is a backend PR that reverts or replaces the affected service manifest
entry, followed by protected backend check/apply. Operators may also drain a
single service through the fixed runtime operation:

```bash
sudo -n /usr/local/sbin/nutsnews-worker-runtime drain --service-name <service> --confirm-action
```

Before cutover, production ingestion rollback remains the active legacy
Cloudflare Worker path.
