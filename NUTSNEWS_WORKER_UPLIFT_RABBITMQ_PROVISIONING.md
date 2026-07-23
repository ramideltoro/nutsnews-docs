# NutsNews Worker-Uplift RabbitMQ Provisioning

Status: implementation target for `ramideltoro/nutsnews-worker#80`,
`ramideltoro/nutsnews-worker#81`, `ramideltoro/nutsnews-worker#82`, and
`ramideltoro/nutsnews-worker#83`. Protected RabbitMQ operations, drift, smoke,
and health-report integration are tracked in
[Worker-Uplift RabbitMQ Operations](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_OPERATIONS.md).

Canonical backend runbook:

```text
ramideltoro/nutsnews-backend/runbooks/WORKER_UPLIFT_RABBITMQ_PROVISIONING.md
```

Backend validators:

```bash
python3 scripts/validate_worker_uplift_rabbitmq_provisioning.py
python3 scripts/validate_worker_uplift_rabbitmq_network_security.py
python3 scripts/validate_worker_uplift_rabbitmq_metrics.py
```

## Scope

`ramideltoro/nutsnews-backend` owns provisioning for the backend RabbitMQ
broker used by the worker-uplift pipeline. The implementation is an Ansible role
included by the protected backend bootstrap playbook. It installs Docker and
Docker Compose packages, writes a pinned RabbitMQ Compose service, keeps broker
listeners on loopback, keeps AMQP `5672`, management `15672`, and Prometheus
`15692` closed to the public Internet, stores broker data under backend-owned
persistent host paths, and bootstraps the worker-uplift vhost, exchanges,
queues, retry tiers, DLQs, users, permissions, and policies from source
control.

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
| `RABBITMQ_MONITORING_USERNAME` | variable | Monitoring/canary identity name |
| `RABBITMQ_MONITORING_PASSWORD` | secret | Monitoring/canary password |
| `RABBITMQ_*_CONSUMER_USERNAME` / `RABBITMQ_*_PUBLISHER_USERNAME` | variables | Route-scoped service identity names |
| `RABBITMQ_*_CONSUMER_PASSWORD` / `RABBITMQ_*_PUBLISHER_PASSWORD` | secrets | Route-scoped service passwords |

The exact route identity names are tracked in
`ramideltoro/nutsnews-backend/docs/worker-uplift-runtime-identities.json`.
Break-glass admin credentials are written to the root-owned Compose env file.
Service user credentials are written to `/etc/nutsnews-rabbitmq/topology.env`;
that file is root-only and is not mounted into the RabbitMQ container. Secrets
must not appear in workflow output, command-line arguments, committed files, or
uploaded artifacts.
The default `guest` user is deleted, anonymous management API access is denied,
and service identity credentials are distinct from one another and from the
break-glass admin credential.

## Topology Bootstrap

The backend role renders the reviewed non-secret topology definition from:

```text
ansible/roles/backend_rabbitmq/templates/worker-uplift-topology.json.j2
```

It installs `/usr/local/sbin/nutsnews-rabbitmq-topology` and runs:

- `bootstrap` to create missing vhost resources, users, permissions, bindings,
  policies, and to delete the default `guest` user.
- `check` as a read-only topology and policy drift detector.
- `permissions` to prove route-scoped users can only access declared resources.
- `probe-transfers` to verify retry/DLQ routing for every route while queues are
  empty; it refuses to run on non-empty stage queues.

The bootstrap is non-destructive. Immutable queue argument drift is reported for
operator review instead of deleting queues.

Issue `ramideltoro/nutsnews-worker#91` adds a dedicated private canary topology
entry. The role creates the isolated `worker.uplift.canary.v1` direct exchange
and queue, binds them with the same route key, and grants the monitoring/canary
identity only write/read access to that route. The canary queue is intentionally
bounded with `x-max-length=10`, `x-max-length-bytes=1048576`, and
`x-overflow=reject-publish`.

## Persistence And Verification

The broker runs from a pinned `rabbitmq@sha256:...` image, uses host-backed
persistent data, and exposes AMQP, management, and Prometheus ports only on
`127.0.0.1`.

The backend role installs and runs:

```text
/usr/local/sbin/nutsnews-rabbitmq-network-check
```

The read-only network check verifies loopback host listeners, loopback Docker
published ports, private Docker network attachment for colocated service
containers, UFW default-deny posture with no RabbitMQ public allow rules,
loopback AMQP/management/Prometheus reachability, RabbitMQ Prometheus metrics
for local Grafana Alloy scraping, anonymous management denial, `guest` user
absence, credential separation by env key name, and TLS boundary posture.

TLS is not required while all broker traffic stays inside the host or
Docker-private trust boundary. Any future RabbitMQ path crossing a host trust
boundary must add TLS listeners, certificate rotation, and a read-only
certificate-expiry check before that path is approved.

External RabbitMQ scan attempts against `65.75.201.18` ports `5672`, `15672`,
and `15692` must be refused or time out. The protected backend deployment safety
postcheck performs this scan from the GitHub runner and fails if any of those
ports is open.

The broker data mount is `/var/lib/nutsnews/rabbitmq`. The backend role repairs
that tree recursively to the RabbitMQ container UID/GID before runtime probes,
which protects queue writes after restores, partial applies, or ownership drift.
Root-run probe state is stored outside the broker mount under
`/var/lib/nutsnews/rabbitmq-probes`.

The backend role includes a root-only durable probe. During apply it publishes a
persistent test message, restarts the Compose-managed RabbitMQ service, verifies
the message survives, acknowledges it, and removes the probe queue.

The backend role also installs the private canary service and timer:

```text
/etc/systemd/system/nutsnews-rabbitmq-canary.service
/etc/systemd/system/nutsnews-rabbitmq-canary.timer
```

The apply path runs the canary once after topology bootstrap and then enables
the timer. Canary JSON reports live under
`/var/lib/nutsnews/rabbitmq-probes`, and canary Prometheus textfile metrics live
at `/var/lib/nutsnews/metrics/rabbitmq-canary.prom`.

The backend role also installs the RabbitMQ recovery helper:

```text
/usr/local/sbin/nutsnews-rabbitmq-recovery
```

The helper exports sanitized definitions, runs a disposable clean rebuild drill,
runs a disposable stopped-volume restore drill, and writes non-secret recovery
evidence under `/var/lib/nutsnews/rabbitmq-recovery`. Normal Restic backups
exclude the live `/var/lib/nutsnews/rabbitmq` message store and include only
reviewed config/topology plus recovery evidence. Broker rebuilds use the pinned
image, source-controlled topology, protected credentials, and PostgreSQL
outbox/reconciliation state as the authoritative replay source.

For host-restart proof, use `ramideltoro/nutsnews-backend` workflow
`Backend Controlled Maintenance` with `action=reboot` and
`confirm_target=backend.nutsnews.com`. When RabbitMQ is healthy before reboot,
the protected workflow publishes a durable probe message, reboots the backend
host, waits for SSH to return with a changed boot ID, then verifies and deletes
that message. The result is recorded in the
`backend-controlled-maintenance-report` artifact.

After any approved host restart, operators should also verify:

- `docker.service` is active.
- `nutsnews-rabbitmq.service` is active.
- RabbitMQ health is green in the protected workflow postcheck or maintenance
  report.
- RabbitMQ network security and public exposure checks are green in the
  protected workflow postcheck.

## Management Access

The RabbitMQ management UI is tunnel-only. Approved operators use:

```bash
ssh -N -L 15672:127.0.0.1:15672 -i ~/.ssh/servercheap_65_75_201_18 rami@65.75.201.18
```

Then open `http://127.0.0.1:15672` and authenticate with the protected
break-glass admin values from the `production-backend` environment.

Emergency revocation is a privileged host operation:

```bash
sudo -n docker exec nutsnews-rabbitmq rabbitmqctl clear_permissions -p nutsnews-worker-uplift <username>
sudo -n docker exec nutsnews-rabbitmq rabbitmqctl delete_user <username>
```

After revocation, rotate the affected protected secret, run the backend
protected apply, and confirm topology permission and network security checks are
green.

## Rollback

Rollback is controlled by the backend runbook. Disable the RabbitMQ role for a
protected apply to stop the managed service, then restore the previous known-good
backend configuration or data snapshot if a broker config, topology, permission,
or persistence change caused the incident. Do not remove RabbitMQ data until
stage outbox and reconciliation state have been reviewed.

## Related Docs

- [Worker-Uplift RabbitMQ Capacity And Security](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_CAPACITY_SECURITY.md)
- [Worker-Uplift RabbitMQ Operations](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_OPERATIONS.md)
- [Worker-Uplift RabbitMQ Recovery](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_RECOVERY.md)
- [Worker-Uplift RabbitMQ Metrics](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_METRICS.md)
- [Worker-Uplift Service Runtime](NUTSNEWS_WORKER_UPLIFT_SERVICE_RUNTIME.md)
- [Worker-Uplift Operation Map](NUTSNEWS_WORKER_UPLIFT_OPERATION_MAP.md)
- [Backend Protected Apply](NUTSNEWS_BACKEND_PROTECTED_APPLY.md)
