---
title: NutsNews Worker-Uplift Service Runtime
wiki:
  source_route: /technical/nutsnews-worker-uplift-service-runtime/
  simple_route: /simple/nutsnews-worker-uplift-service-runtime/
  primary_diagram:
    file: diagrams/NUTSNEWS_WORKER_UPLIFT_SERVICE_RUNTIME.mmd
    accTitle: "Worker uplift completed rollback and runtime boundary"
    accDescr: "Shows stable generation 5 shadow, restored legacy ownership and scheduling, disabled uplift writes, quarantined failed candidate, and frozen runtime mutations."
  status: active
  collection: ai-and-automation
  section: Automation & Workers
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 92a67f2bf9c83fde4580db067ac5bb24a529be8e81f1c21f174419f1dcb4e2f4
---

# NutsNews Worker-Uplift Service Runtime

Status: implemented for `ramideltoro/nutsnews-worker#85` on 2026-07-23.

> **Current incident override (2026-08-01).** The older Runtime 0.x cutover
> failed publication and freshness before observation started. [Backend run
> 30715252632](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30715252632)
> completed rollback prepare but failed before finalize. Legacy scheduling is
> verified true by [worker run 30715590990](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715590990)
> and [status run 30715611673](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715611673).
> [Backend run 30715566651](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30715566651)
> completed finalize. The current row is stable `shadow` generation 5 with
> owner `legacy_shards`, legacy dispatch true, uplift scheduler true in shadow,
> uplift writes false, publication shadow, observation timestamps null, and
> single-writer/DNS checks passing. Runtime 1 remains undeployed. Backend PR
> #471 is `DIRTY`/conflicting with current main and must reconcile PR #483,
> authoritative generation 5 ownership, and a separate exact-eight
> runtime-container recreation step.

> **Backend source hardening.** Backend
> [`PR #482`](https://github.com/ramideltoro/nutsnews-backend/pull/482), merge
> `510b775d7962e2e66d430fb6d458c3c88d60cdd3`, preserves the rollback receipt,
> consumes historical transition authority, and guards future backend
> mutations. Backend
> [`PR #483`](https://github.com/ramideltoro/nutsnews-backend/pull/483), merge
> `5531014000f52fd6101f8617463d5f2c887d0788`, repairs the forward publication
> contract and stable business-command idempotency. Both are source-only: no
> host/runtime deploy or replay occurred. The worker deploy guard and infra
> verifier remain unfinished and frozen.

> **Freeze.** Static runtime status can show shadow/write-disabled but cannot
> prove owner or rollback completion. Use only read-only status, logs, and queue
> inspection. All generic runtime/backend mutations, replay, reconciliation,
> Further Grafana mutation, synthetic drills, Runtime 1/fetcher v2, and web merge are frozen.
> Rollback is complete: never rerun cutover, rollback, or finalize. The failed
> Runtime 0.x candidate is disqualified and quarantined. See the [central incident evidence](https://github.com/ramideltoro/nutsnews-infra/issues/474#issuecomment-5153075316).

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

The original source-default runtime contract was shadow-first. These settings
are implementation history, not the current authoritative control row:

- `NUTSNEWS_BACKEND_WORKER_RUNTIME_ENABLED=true` installs the backend-managed
  framework.
- `NUTSNEWS_BACKEND_WORKER_RUNTIME_PRODUCTION_WRITES_ENABLED=false` keeps
  production writes hard-disabled.
- `backend_worker_runtime_default_mode=shadow` is the protected apply default.
- service manifests start empty until later service issues provide approved
  digest images and service-specific definitions.

## Scoped Worker API Commands

The backend Worker DB API remains the write boundary for uplift services.
Scoped commands are available only on `/api/worker/db/*`; scoped tokens are not
accepted on `/api/app/db/*` and cannot call unrelated legacy Worker commands.

The original protected-apply baseline kept scoped credentials disabled before rollout:

- `NUTSNEWS_BACKEND_WORKER_UPLIFT_SCOPED_TOKENS_ENABLED=false` keeps
  persistence/publication tokens optional.
- `NUTSNEWS_BACKEND_WORKER_UPLIFT_PERSISTENCE_TOKEN` can call persistence
  commands such as accepted articles, summaries, reviews, feed health, AI usage,
  worker run, and `uplift-record-shadow-aggregate`.
- `NUTSNEWS_BACKEND_WORKER_UPLIFT_PUBLICATION_TOKEN` can call publication
  commands such as `uplift-publish-articles-batch`,
  `uplift-refresh-public-feed-snapshot`, and `uplift-save-worker-run`.
- Scoped token values must be distinct from each other and from
  `NUTSNEWS_BACKEND_API_TOKEN`.

Every mutating scoped command must include an idempotency key, message ID,
correlation ID, pipeline run ID, stage execution ID, source message ID, actor
service, schema version, operation version, and expected article version.
Shadow mode records command receipts in
`worker_uplift_final.api_command_receipts`; `uplift-record-shadow-aggregate`
may also upsert `worker_uplift_final.article_shadow_aggregates`. Shadow scoped
commands must not update `public.articles` visibility or refresh the live public
feed snapshot.

Production scoped commands require all cutover gates:

- `providerMode=backend_postgres_primary`;
- `NUTSNEWS_WORKER_UPLIFT_CUTOVER_STATE=cutover-approved`;
- `NUTSNEWS_WORKER_UPLIFT_PRODUCTION_WRITES_ENABLED=true`;
- the existing Worker API write guard enabled.

Duplicate requests with the same idempotency key and stable business-command
digest return the recorded response. Regenerated delivery identifiers are not
part of that digest; a changed article command still conflicts. PR #483 also
requires exactly one real HTTP(S) article URL, `published` state, the protected
five-language scope, and exact one-row semantic confirmation before success is
recorded. This contract is merged source but is not deployed. Do not enable
production-write scope while legacy ingestion is still the production owner.

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

## Protected Operations Capability

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

The workflow exposes these fixed capabilities, but all mutations are frozen.
Generic runtime `rollback` is not the cutover rollback. Use read-only evidence
only; the completed rollback must not be rerun.

## Runtime Logs

Backend issue `ramideltoro/nutsnews-worker#88` routes worker-uplift runtime
stdout/stderr through Docker's `journald` logging driver and Grafana Alloy.
Only the approved RabbitMQ tag and the eight stable worker service tags are
collected; generic Docker/Compose logs stay out of scope. Loki stream labels
are limited to the telemetry policy's low-cardinality set, while correlation,
causation, idempotency, message, and W3C trace context fields remain structured
log metadata only.

Trace export remains deferred. The backend must not configure Tempo, OTLP
receivers/exporters, or traces credentials for the worker-uplift runtime until
a later reviewed approval changes the telemetry scope.

## Evidence

Backend implementation PRs:

| PR | Purpose | Merge commit |
| --- | --- | --- |
| `ramideltoro/nutsnews-backend#309` | Worker runtime framework and RabbitMQ metrics | `1433c3aed6fd36307524288d75a5ba048c74dd83` |
| `ramideltoro/nutsnews-backend#310` | Protected apply environment wiring fix | `f5d0de06675b7222c67701ba87922b849224a4e9` |
| [`ramideltoro/nutsnews-backend#482`](https://github.com/ramideltoro/nutsnews-backend/pull/482) | Consume historical cutover authority and guard backend runtime mutations | `510b775d7962e2e66d430fb6d458c3c88d60cdd3` |
| [`ramideltoro/nutsnews-backend#483`](https://github.com/ramideltoro/nutsnews-backend/pull/483) | Harden forward publication semantics and stable command idempotency | `5531014000f52fd6101f8617463d5f2c887d0788` |

Local and PR validation:

| Surface | Run |
| --- | --- |
| PR #309 checks | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30013690867> |
| PR #310 checks | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30013958989> |
| PR #482 checks | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30716472983> |
| PR #483 checks | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30716608432> |

Historical implementation proof:

| Surface | Run |
| --- | --- |
| Protected apply with runtime enabled | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30016460292> |
| Backend Worker Runtime Operations `check` | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30017264848> |
| Backend Worker Runtime Operations `status` | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30017349672> |
| Backend drift check after apply | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30017885344> |
| Backend health report after apply | <https://github.com/ramideltoro/nutsnews-backend/actions/runs/30017885364> |

Historical initial-framework result; not current owner or rollback-completion evidence:

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
