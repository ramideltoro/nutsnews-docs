# NutsNews Worker-Uplift RabbitMQ Provisioning

Status: implementation target for `ramideltoro/nutsnews-worker#80`.

Canonical backend runbook:

```text
ramideltoro/nutsnews-backend/runbooks/WORKER_UPLIFT_RABBITMQ_PROVISIONING.md
```

Backend validator:

```bash
python3 scripts/validate_worker_uplift_rabbitmq_provisioning.py
```

## Scope

`ramideltoro/nutsnews-backend` owns provisioning for the backend RabbitMQ
broker used by the worker-uplift pipeline. The implementation is an Ansible role
included by the protected backend bootstrap playbook. It installs Docker and
Docker Compose packages, writes a pinned RabbitMQ Compose service, keeps broker
listeners on loopback, and stores broker data under backend-owned persistent
host paths.

The legacy Cloudflare Worker remains unchanged. This broker is only the
transport layer for the backend-owned worker-uplift runtime.

## Protected Apply Path

Operators must use the backend protected Ansible workflow. Run check mode first,
review the intended changes, then run apply only through the `production-backend`
environment approval gate.

Required protected values:

| Name | Type | Purpose |
| --- | --- | --- |
| `NUTSNEWS_BACKEND_RABBITMQ_ENABLED` | variable | Enables the RabbitMQ role for the protected backend run |
| `RABBITMQ_VHOST` | variable | Worker-uplift RabbitMQ vhost |
| `RABBITMQ_BREAK_GLASS_ADMIN_USERNAME` | variable | Break-glass admin identity name |
| `RABBITMQ_ERLANG_COOKIE` | secret | RabbitMQ node cookie |
| `RABBITMQ_BREAK_GLASS_ADMIN_PASSWORD` | secret | Break-glass admin password |

Secrets must not appear in workflow output, command-line arguments, committed
files, or uploaded artifacts.

## Persistence And Verification

The broker runs from a pinned `rabbitmq@sha256:...` image, uses host-backed
persistent data, and exposes AMQP, management, and Prometheus ports only on
`127.0.0.1`.

The backend role includes a root-only durable probe. During apply it publishes a
persistent test message, restarts the Compose-managed RabbitMQ service, verifies
the message survives, acknowledges it, and removes the probe queue.

For host-restart proof, use `ramideltoro/nutsnews-backend` workflow
`Backend Controlled Maintenance` with `action=reboot` and
`confirm_target=backend.nutsnews.com`. When RabbitMQ is healthy before reboot,
the protected workflow publishes a durable probe message, reboots the backend
host, then verifies and deletes that message after SSH returns. The result is
recorded in the `backend-controlled-maintenance-report` artifact.

After any approved host restart, operators should also verify:

- `docker.service` is active.
- `nutsnews-rabbitmq.service` is active.
- RabbitMQ health is green in the protected workflow postcheck or maintenance
  report.

## Rollback

Rollback is controlled by the backend runbook. Disable the RabbitMQ role for a
protected apply to stop the managed service, then restore the previous known-good
backend configuration or data snapshot if a broker config or persistence change
caused the incident. Do not remove RabbitMQ data until stage outbox and
reconciliation state have been reviewed.

## Related Docs

- [Worker-Uplift RabbitMQ Capacity And Security](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_CAPACITY_SECURITY.md)
- [Worker-Uplift Operation Map](NUTSNEWS_WORKER_UPLIFT_OPERATION_MAP.md)
- [Backend Protected Apply](NUTSNEWS_BACKEND_PROTECTED_APPLY.md)
