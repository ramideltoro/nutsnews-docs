# NutsNews Worker-Uplift Service Runtime

Status: implemented for `ramideltoro/nutsnews-worker#85` on 2026-07-23.

Canonical backend runbook:

```text
ramideltoro/nutsnews-backend/runbooks/WORKER_UPLIFT_SERVICE_RUNTIME.md
```

Backend implementation commits:

```text
ramideltoro/nutsnews-backend@1433c3aed6fd36307524288d75a5ba048c74dd83
ramideltoro/nutsnews-backend@f5d0de06675b7222c67701ba87922b849224a4e9
ramideltoro/nutsnews-backend@676542873c4ad7ae0e4353c2ebb3e2b1fbf1a1d1
ramideltoro/nutsnews-backend@15996767959da4e40b6e919cb3ead4ce1501f3e7
```

## Scope

The backend repo owns the worker-uplift service runtime framework. It installs
a host-managed, disabled-by-default runtime manager and service manifest path
for future independent worker images. The legacy Cloudflare Worker checkout and
pipeline remain unchanged.

The runtime is shadow-first:

- `NUTSNEWS_BACKEND_WORKER_RUNTIME_ENABLED=true` installs the backend-managed
  framework.
- `NUTSNEWS_BACKEND_WORKER_RUNTIME_PRODUCTION_WRITES_ENABLED=false` keeps
  production writes hard-disabled.
- `backend_worker_runtime_default_mode=shadow` is the protected apply default.
- service manifests start empty until later service issues provide approved
  digest images and service-specific definitions.

## Runtime Guardrails

The backend runtime manager validates service manifests before operations. It
requires immutable digest image references, allow-listed GHCR repositories,
signed provenance metadata, declared health checks, bounded resource requests,
explicit queue bindings, and root-owned secret files under `/run/secrets`.

Manifest validation rejects mutable image tags, untrusted image repositories,
inline secret-looking environment values, service names or secret file paths
outside the declared service boundary, production writes before
`cutover_state=cutover-approved`, and service-specific actions before their
future implementation is present.

## Protected Operations

Operators use the backend `Backend Worker Runtime Operations` workflow. The
workflow dispatches only fixed manager actions:

```text
check
status
logs
queue-inspect
dlq-inspect
deploy
promote
restart
scale
rollback
dlq-replay
drain
reconciliation
smoke
```

Mutating actions require `confirm_target=backend.nutsnews.com` and the
protected `production-backend` approval gate. Status and check actions are
expected to pass when no services are configured.

## Evidence

Backend implementation PRs:

| PR | Purpose | Merge commit |
| --- | --- | --- |
| `ramideltoro/nutsnews-backend#309` | Worker runtime framework and RabbitMQ metrics | `1433c3aed6fd36307524288d75a5ba048c74dd83` |
| `ramideltoro/nutsnews-backend#310` | Protected apply environment wiring fix | `f5d0de06675b7222c67701ba87922b849224a4e9` |

Local and PR validation:

| Surface | Run |
| --- | --- |
| PR #309 checks | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30013690867> |
| PR #310 checks | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30013958989> |

Production proof:

| Surface | Run |
| --- | --- |
| Protected apply with runtime enabled | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30016460292> |
| Backend Worker Runtime Operations `check` | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30017264848> |
| Backend Worker Runtime Operations `status` | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30017349672> |
| Backend drift check after apply | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30017885344> |
| Backend health report after apply | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30017885364> |

Runtime proof result:

```text
mode=shadow
production_writes_enabled=false
status=pass
summary=worker runtime framework is installed; no services are configured
```

## Related Docs

- [Worker-Uplift Operation Map](NUTSNEWS_WORKER_UPLIFT_OPERATION_MAP.md)
- [Worker-Uplift RabbitMQ Provisioning](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_PROVISIONING.md)
- [Worker-Uplift RabbitMQ Operations](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_OPERATIONS.md)
- [Worker-Uplift RabbitMQ Metrics](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_METRICS.md)
- [Backend Protected Apply](NUTSNEWS_BACKEND_PROTECTED_APPLY.md)
