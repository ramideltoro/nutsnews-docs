# NutsNews Worker-Uplift RabbitMQ Capacity And Security

Status: approved for `ramideltoro/nutsnews-worker#79` on 2026-07-23.

Canonical backend decision:

```text
ramideltoro/nutsnews-backend/docs/worker-uplift-rabbitmq-capacity-security-decision.json
```

Backend runbook:

```text
ramideltoro/nutsnews-backend/runbooks/WORKER_UPLIFT_RABBITMQ_CAPACITY_SECURITY.md
```

Validator:

```bash
python3 scripts/validate_worker_uplift_rabbitmq_capacity_security.py
```

## Decision

Use RabbitMQ `4.3.3-management-alpine` for the initial backend-owned
worker-uplift broker, pinned to the linux/amd64 digest recorded in the backend
decision. Do not use a mutable tag.

The selected queue type is durable classic queues. Single-replica quorum queues
are not selected for the first single-node phase because they add quorum/Raft
overhead without tolerating loss of the only broker node.

A single RabbitMQ node is durable transport only. It is not broker high
availability, and it is not quorum replication.

## Host Headroom

Read-only measurement of `backend.nutsnews.com` on 2026-07-23 showed:

| Area | Evidence |
| --- | --- |
| CPU | 4 vCPU, low load average around `0.10`, `0.14`, `0.16` |
| Memory | about 9.71 GiB total and 8.89 GiB available |
| Disk | ext4 root filesystem, about 70 GiB available, 9% used |
| I/O | low observed disk utilization; root disk is rotational |
| Docker | not installed on the backend host |
| PostgreSQL | `postgresql@18-main.service` active and lightweight at capture |
| Qwen/local AI | no Qwen, Ollama, AI, or LLM service observed |
| Backups | backup, verify, and restore-drill timers observed |
| Firewall/listeners | public TCP limited to `22`, `80`, and `443`; RabbitMQ is not exposed |

This approval does not provision Docker or RabbitMQ on the backend host.

## Queue Envelope

Initial topology covers seven worker-uplift routes:

| Queue class | Count |
| --- | ---: |
| Main queues | 7 |
| Retry queues | 21 |
| DLQs | 7 |
| Total | 35 |

Hard limits:

| Area | Limit |
| --- | --- |
| Broker memory | 1 GiB container cap and 512 MiB RabbitMQ memory watermark |
| Broker disk | 20 GiB absolute free-disk alarm |
| File descriptors | `65536` soft and hard nofile |
| Main queues | `x-max-length=2000`, `x-max-length-bytes=268435456` |
| Retry queues | `x-max-length=1000`, `x-max-length-bytes=134217728` |
| DLQs | `x-max-length=2000`, `x-max-length-bytes=268435456`, 14 day review window |
| Overflow | `reject-publish`; do not use `drop-head` |
| Message body | 64 KiB hard maximum, ID-only payloads |
| Flow | heartbeat 30s, prefetch 10, 128 in-flight confirms per channel |

Resource pressure must block or nack publishers. It must not silently drop the
oldest work.

## Retry And Recovery

Use application-confirmed retry/DLQ transfer:

1. Commit stage state.
2. Publish retry, DLQ, or next-stage message.
3. Wait for publisher confirm.
4. Ack the source delivery only after the confirm succeeds.

If the confirm fails or times out, the source delivery remains eligible for
redelivery. Stage inbox/outbox and natural-key idempotency handle duplicates.

PostgreSQL stage inbox, outbox, attempt, reconciliation, and watermark tables
are the authoritative loss-recovery mechanism. RabbitMQ definitions may be
exported for fast topology rebuilds, but broker queue contents are not the only
backup.

## Access Boundary

No AMQP, management, or Prometheus listener is approved for unrestricted public
access.

| Listener | Boundary |
| --- | --- |
| AMQP `5672` | private Docker network only unless a later protected maintenance workflow approves loopback binding |
| Management `15672` | loopback or private maintenance network only; SSH tunnel or protected workflow access |
| Prometheus `15692` | loopback only for backend Alloy scrape |

Worker services use the route-scoped RabbitMQ identities from the backend
runtime identity manifest. They must not receive break-glass admin credentials.
The default `guest` user must be deleted or disabled for the worker vhost.

## Benchmark Path

The backend repo includes an ephemeral benchmark workflow that starts the pinned
RabbitMQ image in GitHub Actions and compares durable classic queues with
single-replica quorum queues across the expected 35-queue shape.

The production backend host is intentionally not benchmarked for this issue
because no broker is provisioned there. The benchmark must pass before a later
RabbitMQ bootstrap apply.

## Migration Trigger

Stay single-node only for the initial shadow deployment. Move to managed
RabbitMQ or a reviewed three-node design before any requirement needs broker
availability through loss of the backend VPS, or when queue age, DLQ volume,
RabbitMQ alarms, memory/disk pressure, connection pressure, or recovery drills
exceed the limits in the backend decision.

## References

- <https://www.rabbitmq.com/release-information>
- <https://www.rabbitmq.com/docs/which-erlang>
- <https://www.rabbitmq.com/docs/upgrade>
- <https://www.rabbitmq.com/docs/quorum-queues>
- <https://www.rabbitmq.com/docs/dlx>
- <https://www.rabbitmq.com/docs/alarms>
- <https://www.rabbitmq.com/docs/maxlength>
- <https://www.rabbitmq.com/docs/access-control>
- <https://www.rabbitmq.com/docs/management>
- <https://www.rabbitmq.com/docs/monitoring>
