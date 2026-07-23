# NutsNews Worker-Uplift RabbitMQ Operations

Status: implemented for `ramideltoro/nutsnews-worker#84` on 2026-07-23.
Private canary and failure runbooks are tracked in
`ramideltoro/nutsnews-worker#91`.

Canonical backend runbooks:

```text
ramideltoro/nutsnews-backend/runbooks/WORKER_UPLIFT_RABBITMQ_PROVISIONING.md
ramideltoro/nutsnews-backend/runbooks/DEPLOYMENT_SAFETY_GATES.md
ramideltoro/nutsnews-backend/runbooks/DRIFT_CHECK.md
ramideltoro/nutsnews-backend/runbooks/BACKEND_HEALTH_REPORT.md
ramideltoro/nutsnews-backend/runbooks/WORKER_UPLIFT_RABBITMQ_CANARY.md
```

Final backend implementation commit:

```text
ramideltoro/nutsnews-backend@dcf29e70104cc2f32b01b4c4a17486e209e8207d
```

## Scope

The backend repo owns RabbitMQ operations for the worker-uplift broker. Normal
RabbitMQ mutation uses the same check-first, approved, auditable path as other
backend host changes:

```text
backend PR -> backend checks -> protected check -> production-backend approval -> protected apply -> read-only verification
```

The legacy Cloudflare Worker path is unchanged. Operators should not repair
RabbitMQ drift with ad hoc SSH changes except for documented break-glass
recovery.

## Protected Apply

RabbitMQ is managed by the protected backend Ansible workflow. The RabbitMQ
portion of the apply path now includes:

- credential readiness checks for the broker admin, monitoring, publisher, and
  consumer identities;
- Ansible check mode before any apply;
- explicit apply confirmation for `backend.nutsnews.com`;
- rollback metadata written on the backend host under the RabbitMQ probe state
  directory;
- post-apply health, network, topology, permission, persistence, and drift
  verification;
- redacted machine-readable workflow artifacts and concise GitHub summaries.

Secret values are never expected in logs, command-line arguments, committed
files, or uploaded artifacts. RabbitMQ service credentials are sourced from the
protected `production-backend` Environment and the root-only backend credential
files described in the provisioning runbook.

## Drift Checks

The backend drift workflow remains read-only. It uses fixed probes instead of
operator-supplied commands and does not mutate RabbitMQ, Docker, firewall state,
or backend files during normal operations.

RabbitMQ drift coverage includes:

- pinned image identity and digest evidence;
- Compose/config checksum evidence for managed broker files;
- topology, bindings, policies, users, and permissions metadata;
- listener and network exposure state;
- broker health and management API readiness;
- RabbitMQ recovery and backup evidence freshness;
- last smoke-check report status when present.

Unexpected public exposure, failed RabbitMQ health, topology drift, permission
drift, stale critical backup evidence, or failed smoke evidence should be
reconciled through a backend PR and a protected check/apply run.

## Smoke Checks

Use the backend `Backend RabbitMQ Smoke` workflow for broker smoke validation.
Allowed actions are `status` and `smoke`. The `smoke` action requires
`confirm_target=backend.nutsnews.com` and the protected `production-backend`
approval gate.

The smoke workflow performs fixed broker checks:

- publisher confirm;
- consume with manual acknowledgement;
- retry transfer;
- DLQ transfer;
- persistence across a controlled RabbitMQ service restart;
- permission-denial proof for a least-privilege identity.

Smoke probes use dedicated `worker.uplift.probe.smoke.*` resources and write a
redacted JSON report to the backend probe state directory. The workflow uploads
the redacted report artifact. It does not upload credential files, message
payload secrets, raw RabbitMQ definitions, or broker data.

## Private Canary

Issue `ramideltoro/nutsnews-worker#91` adds a private AMQP canary for the
worker-uplift broker. The canary is host-local only and does not use Grafana
Cloud Synthetic Monitoring because AMQP is intentionally not publicly
reachable.

The backend RabbitMQ role installs:

```text
/usr/local/sbin/nutsnews-rabbitmq-probe canary
/etc/systemd/system/nutsnews-rabbitmq-canary.service
/etc/systemd/system/nutsnews-rabbitmq-canary.timer
```

The timer publishes one small uniquely identified message to the isolated
`worker.uplift.canary.v1` direct exchange, requires publisher confirm, consumes
the same message from the isolated `worker.uplift.canary.v1` queue, validates
the payload, manually acknowledges it, drains bounded leftovers, and writes
redacted machine-readable evidence.

The canary uses the existing monitoring identity from
`RABBITMQ_MONITORING_USERNAME` and `RABBITMQ_MONITORING_PASSWORD`. That identity
is least-privilege: it can write to and read from only the isolated canary route
and cannot configure RabbitMQ resources or access worker-uplift production
route queues.

The backend role creates the canary queue with bounded backlog controls:

```text
x-max-length=10
x-max-length-bytes=1048576
x-overflow=reject-publish
```

Canary evidence is stored on the backend host:

```text
/var/lib/nutsnews/rabbitmq-probes/last-canary.json
/var/lib/nutsnews/rabbitmq-probes/last-canary-drill.json
/var/lib/nutsnews/metrics/rabbitmq-canary.prom
```

The protected `Backend RabbitMQ Canary` workflow supports fixed actions only:
`status`, `canary`, and `drill`. The mutating `canary` and `drill` actions
require `confirm_target=backend.nutsnews.com` and the protected
`production-backend` approval gate.

Approved drill names are:

```text
restart
consumer-loss
network-interruption
disk-watermark
invalid-credentials
unroutable
full-queue
poison-message
grafana-connectivity-loss
```

`disk-watermark` and `grafana-connectivity-loss` are bounded fixtures. They
write deterministic evidence for alert and runbook proof without filling host
disks or disrupting Alloy/Grafana connectivity.

## Health Report

The recurring backend health report includes RabbitMQ status from read-only
evidence: drift status, broker health, recovery evidence, last smoke status,
and last canary status when those reports exist. The health report does not run
the smoke test, run the canary, restart RabbitMQ, apply Ansible, install
packages, edit files, or otherwise mutate the backend host.

## Evidence

Backend implementation PRs:

| PR | Purpose | Merge commit |
| --- | --- | --- |
| `ramideltoro/nutsnews-backend#306` | Main RabbitMQ operations implementation | `e28415e8c26a0dc430d1fb16d9a98538deddfe99` |
| `ramideltoro/nutsnews-backend#307` | Fix image-digest drift false negative | `f1d4c6ee357f9c3f71194dc3804fd27b5c35638c` |
| `ramideltoro/nutsnews-backend#308` | Fix smoke permission-denial false negative | `dcf29e70104cc2f32b01b4c4a17486e209e8207d` |

Final proof runs:

| Surface | Run |
| --- | --- |
| PR #306 checks | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30007642540> |
| PR #307 checks | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30008988173> |
| PR #308 checks | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30010245000> |
| Final protected check | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30010362935> |
| Final protected apply | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30010825044> |
| Final RabbitMQ smoke | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30011336190> |
| Final backend health report | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30011389421> |
| Final backend drift check | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30011439473> |

Two proof failures were found and fixed before issue closeout:

- the first protected apply surfaced a Docker image digest evidence mismatch;
  PR #307 changed the drift probe to use container image config first and image
  repo digests as fallback;
- the first smoke proof surfaced RabbitMQ management API `ACCESS_REFUSED` as
  HTTP 400; PR #308 treats that as the expected permission-denial result.

## Related Docs

- [Worker-Uplift RabbitMQ Capacity And Security](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_CAPACITY_SECURITY.md)
- [Worker-Uplift RabbitMQ Provisioning](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_PROVISIONING.md)
- [Worker-Uplift RabbitMQ Recovery](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_RECOVERY.md)
- [Worker-Uplift RabbitMQ Metrics](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_METRICS.md)
- [Worker-Uplift Service Runtime](NUTSNEWS_WORKER_UPLIFT_SERVICE_RUNTIME.md)
- [Backend Protected Apply](NUTSNEWS_BACKEND_PROTECTED_APPLY.md)
- [Backend Drift Check](NUTSNEWS_BACKEND_DRIFT_CHECK.md)
- [Backend Health Report](NUTSNEWS_BACKEND_HEALTH_REPORT.md)
