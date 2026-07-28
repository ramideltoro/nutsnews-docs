---
wiki:
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: c59a5e6a2098e34266faa7f61f0a33b1be49f5b65e41c56813daa1a4ce4c3962
---
# NutsNews Worker-Uplift Shadow Runtime

This document records the backend-owned shadow runtime for
`ramideltoro/nutsnews-worker#117` and the approval/translation preparation for
`ramideltoro/nutsnews-worker#118`.

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

The #118 source-controlled service set adds:

| Service | Source repo | Health endpoint | Queue boundary |
| --- | --- | --- | --- |
| `approval` | `ramideltoro/nutsnews-worker-article-approval` | `127.0.0.1:18085/ready` | consumes approval, publishes translation tasks |
| `translation` | `ramideltoro/nutsnews-worker-article-translation` | `127.0.0.1:18086/ready` | consumes translation, stops before persistence |

The approval and translation containers are Qwen-only shadow services. They do
not receive OpenAI fallback credentials. The pipeline intentionally stops at
`nutsnews.worker.persistence.v1` until the persistence deployment is reviewed.

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
- Approval and translation use `LOCAL_AI_URL` plus `LOCAL_AI_API_KEY` from the
  production-backend Environment. Protected apply fails closed if
  `LOCAL_AI_API_KEY` is absent.

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

## #118 AI Shadow Verification

Current blocker: production-backend must contain `LOCAL_AI_API_KEY` before the
protected apply can deploy approval and translation. The local credential file
and production-backend secret list checked during implementation did not expose
that key. Do not substitute `OPENAI_API_KEY`; approval OpenAI fallback remains
disabled.

After `LOCAL_AI_API_KEY` exists and protected check/apply succeeds, verify:

```bash
sudo -n /usr/local/sbin/nutsnews-worker-runtime status
sudo -n /usr/local/sbin/nutsnews-worker-runtime queue-inspect --service-name approval
sudo -n /usr/local/sbin/nutsnews-worker-runtime queue-inspect --service-name translation
```

Expected results:

- approval and translation report healthy on their loopback ports;
- accepted approval fixtures create translation tasks for
  `fr,ja,de-CH,de,el`;
- rejected approval fixtures do not create translation work;
- translation results stay in durable shadow state and stop before persistence;
- Qwen slowdown creates bounded backlog through `CONCURRENCY=1`, `PREFETCH=2`,
  and approval `QWEN_MAX_QUEUED_CALLS=1`;
- logs include provider/model/prompt metadata without prompt or article body
  leakage;
- legacy ingestion, legacy AI, and failover stay active and unchanged.

## Rollback

Rollback is a backend PR that reverts or replaces the affected service manifest
entry, followed by protected backend check/apply. Operators may also drain a
single service through the fixed runtime operation:

```bash
sudo -n /usr/local/sbin/nutsnews-worker-runtime drain --service-name <service> --confirm-action
```

Before cutover, production ingestion rollback remains the active legacy
Cloudflare Worker path.
