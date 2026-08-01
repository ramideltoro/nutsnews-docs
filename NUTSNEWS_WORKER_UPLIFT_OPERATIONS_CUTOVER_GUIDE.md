---
title: "NutsNews Worker-Uplift Operations and Cutover Guide"
description: "As-built operator guide for the shadow RabbitMQ worker pipeline, protected recovery, evidence collection, and a future reversible cutover."
wiki:
  source_route: "/technical/nutsnews-worker-uplift-operations-cutover-guide"
  simple_route: "/simple/nutsnews-worker-uplift-operations-cutover-guide"
  slug: "nutsnews-worker-uplift-operations-cutover-guide"
  primary_diagram:
    file: "diagrams/NUTSNEWS_WORKER_UPLIFT_OPERATIONS_CUTOVER_GUIDE.mmd"
    accTitle: "Worker-uplift operating and future cutover gates"
    accDescr: "Legacy ingestion remains active while operators collect read-only evidence, rehearse protected recovery, and wait for separate approvals and reversible controls before any future cutover; the DNS failover controller stays active throughout."
  status: active
  collection: platform-and-data
  section: core-platform
  order: 233
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 424be6b785eb445cb7013d503ec05d13d632a1cddefe99b4a7070dbd6d46e351
---
# NutsNews Worker-Uplift Operations and Cutover Guide

This is the as-built operator guide for
[`ramideltoro/nutsnews-worker#149`](https://github.com/ramideltoro/nutsnews-worker/issues/149).
It tells an operator what can be observed now, which tested workflow owns each
change, how shadow recovery works, and what evidence a later cutover must
produce.

> **Readiness documentation is not cutover authorization.** The legacy
> `nutsnews-worker` remains the production ingestion owner. All eight uplift
> services remain shadow-only and `production_writes_enabled` remains `false`.
> Nothing in this guide authorizes a production write, a DNS or failover
> change, a legacy-ingestion stop, or a cutover. Those actions require their
> later tracking issues and separately reviewed protected controls.

## Operating contract

### Current state

| Control | Required value or owner |
| --- | --- |
| Production ingestion owner | Legacy `ramideltoro/nutsnews-worker` |
| Uplift mode | `shadow` |
| Uplift production writes | `false` |
| Services | scheduler, fetcher, canonicalizer, enrichment, approval, translation, persistence, publication |
| Durable transport | RabbitMQ on the backend host |
| Authoritative shadow state | Backend PostgreSQL stage schemas, outboxes, and watermarks |
| Final public writes | Backend Worker DB API, gated closed while the uplift is shadow-only |
| Backend operations | `ramideltoro/nutsnews-backend` |
| Grafana Cloud resources | `ramideltoro/nutsnews-infra` |
| Admin projection | `ramideltoro/nutsnews`, `/admin/shards` |
| Public apex/www DNS failover | `ramideltoro/nutsnews-infra`; separate from ingestion |
| Tracking and sequence | `ramideltoro/nutsnews-worker` issues |

RabbitMQ is transport, not the system of record. A broker rebuild restores
source-controlled topology and resumes from PostgreSQL outbox and watermark
state. Live RabbitMQ data files are not copied as a normal backup.

### Ownership boundary

Use only fixed, reviewed workflows from `main`. Do not run improvised SSH,
Docker, RabbitMQ administration, SQL, secret-copying, DNS, or replay commands.

| Surface | Source-controlled owner | Protected path |
| --- | --- | --- |
| Host configuration | backend | `Protected Backend Ansible Apply` |
| Service deploy, status, logs, queues, restart, scale, rollback, drain, and reconciliation | backend | `Backend Worker Runtime Operations` |
| RabbitMQ status, topology export, and disposable recovery drills | backend | `Backend RabbitMQ Recovery` |
| RabbitMQ failure drills and isolated smoke | backend | `Backend RabbitMQ Canary` and `Backend RabbitMQ Smoke` |
| PostgreSQL backup and isolated restore proof | backend | `Backend Backup Maintenance` and `Backend Postgres Backup Restore Proof` |
| Credential inventory and readiness | backend | `Backend Credential Readiness`; value changes remain restricted to environment owners |
| Grafana dashboards, alerts, folders, quotas, and drift | infra | `Grafana Cloud Plan` and `Grafana Cloud Apply` |
| DNS failover controller and DNS-write state | infra | `Cloudflare DNS Failover Apply` in `cloudflare-admin` |
| Legacy ingestion scheduling and its retained failover-controller surfaces | legacy worker | `Controller Ingestion Scheduling Operations`; protected `apply` uses `production` |
| Admin worker-uplift projection | web app | reviewed application deployment; no broker or Grafana management access |
| Future ingestion cutover | not authorized | reversible controls in #126, final readiness in #166, and execution in #127 |

The existing backend workflow named `Backend Production Cutover` switches the
**database provider**. It is not a worker-ingestion cutover workflow and must
not be used to promote the worker uplift.

## Action classes

The word “protected” describes the workflow and environment boundary; it does
not imply that the action mutates production.

| Class | Meaning | Examples |
| --- | --- | --- |
| Public or application read-only | No infrastructure change | public health, authenticated `/admin/shards`, immutable workflow artifacts |
| Protected read-only | Fixed workflow reads host, broker, database, or telemetry state | runtime `status`, `logs`, queue inspection, recovery `status`, complete soak report |
| Offline validation | Checks repository files only | docs validation, backend validators, Ansible syntax |
| Dry run or plan | Builds and validates an intended operation without applying it | Ansible `check`, runtime `dry_run=true`, reconciliation plan, Grafana plan, DNS failover `plan`, ingestion-scheduling `plan` |
| Protected mutation | Changes service, host, test fixture, backup, or managed cloud state | deploy, restart, scale, drain, rollback, smoke, canary drill, restore drill, Grafana apply |
| Unavailable or blocked | No approved current apply path | worker cutover/promotion, generic DLQ replay, legacy-ingestion disable before #166 and #127 |

Every workflow invocation must use `--ref main`. Read the workflow summary and
download the artifact; a green workflow conclusion without a reviewed artifact
is not complete evidence.

## Immutable implementation baseline

These links pin the implementation this guide describes:

- Backend commit
  [`b619cf91504eafca21f70c5d68888563f5fca7a9`](https://github.com/ramideltoro/nutsnews-backend/tree/b619cf91504eafca21f70c5d68888563f5fca7a9),
  including the
  [runtime workflow](https://github.com/ramideltoro/nutsnews-backend/blob/b619cf91504eafca21f70c5d68888563f5fca7a9/.github/workflows/backend-worker-runtime-operations.yml),
  [service-runtime runbook](https://github.com/ramideltoro/nutsnews-backend/blob/b619cf91504eafca21f70c5d68888563f5fca7a9/runbooks/WORKER_UPLIFT_SERVICE_RUNTIME.md),
  [RabbitMQ recovery workflow](https://github.com/ramideltoro/nutsnews-backend/blob/b619cf91504eafca21f70c5d68888563f5fca7a9/.github/workflows/backend-rabbitmq-recovery.yml),
  [RabbitMQ recovery runbook](https://github.com/ramideltoro/nutsnews-backend/blob/b619cf91504eafca21f70c5d68888563f5fca7a9/runbooks/WORKER_UPLIFT_RABBITMQ_RECOVERY.md),
  [backup baseline](https://github.com/ramideltoro/nutsnews-backend/blob/b619cf91504eafca21f70c5d68888563f5fca7a9/runbooks/BACKUP_RESTORE_BASELINE.md),
  and
  [credential bootstrap](https://github.com/ramideltoro/nutsnews-backend/blob/b619cf91504eafca21f70c5d68888563f5fca7a9/runbooks/CREDENTIAL_BOOTSTRAP.md).
- Infra commit
  [`ee61807a757fe087dbcecd60d5e0b7fe07f4115a`](https://github.com/ramideltoro/nutsnews-infra/tree/ee61807a757fe087dbcecd60d5e0b7fe07f4115a),
  including the
  [Grafana resource catalog](https://github.com/ramideltoro/nutsnews-infra/blob/ee61807a757fe087dbcecd60d5e0b7fe07f4115a/terraform/grafana-cloud/catalog/worker-uplift-rabbitmq-alerts.json),
  [DNS failover runbook](https://github.com/ramideltoro/nutsnews-infra/blob/ee61807a757fe087dbcecd60d5e0b7fe07f4115a/runbooks/CLOUDFLARE_DNS_FAILOVER.md),
  [DNS controller configuration](https://github.com/ramideltoro/nutsnews-infra/blob/ee61807a757fe087dbcecd60d5e0b7fe07f4115a/cloudflare/dns-failover/wrangler.toml),
  and
  [protected plan/apply workflow](https://github.com/ramideltoro/nutsnews-infra/blob/ee61807a757fe087dbcecd60d5e0b7fe07f4115a/.github/workflows/cloudflare-dns-failover-apply.yml).
- Admin application commit
  [`d339f40a6c29b41d18d5d977575274345c73941b`](https://github.com/ramideltoro/nutsnews/tree/d339f40a6c29b41d18d5d977575274345c73941b)
  and the merged
  [admin worker-uplift PR #518](https://github.com/ramideltoro/nutsnews/pull/518).
- Legacy failover evidence contract at worker commit
  [`a073e351e5716a97e0759cca17096851cbb80261`](https://github.com/ramideltoro/nutsnews-worker/tree/a073e351e5716a97e0759cca17096851cbb80261),
  including
  [Analytics Engine documentation](https://github.com/ramideltoro/nutsnews-worker/blob/a073e351e5716a97e0759cca17096851cbb80261/docs/FAILOVER_ANALYTICS_ENGINE.md),
  [the ingestion-scheduling contract](https://github.com/ramideltoro/nutsnews-worker/blob/a073e351e5716a97e0759cca17096851cbb80261/controller/src/ingestionScheduling.mjs),
  and the
  [protected operations workflow](https://github.com/ramideltoro/nutsnews-worker/blob/a073e351e5716a97e0759cca17096851cbb80261/.github/workflows/controller-ingestion-scheduling-operations.yml).

If one of these owners changes behavior, update this guide in the same reviewed
change or record the mismatch as a readiness blocker.

## Service and queue model

The main flow is:

```text
scheduler -> fetcher -> canonicalizer -> enrichment -> approval
          -> translation -> persistence -> publication
```

Each consuming stage owns a main queue and may have retry and DLQ queues. Every
running consumer service must report `/ready` healthy and the main queue must
have at least one consumer. Zero consumers, consumer cancellation, and a
dropped channel are failures even if the process still answers an HTTP probe.

The source-controlled runtime manifest limits a service to three replicas.
Increasing concurrency is an incident response only after the operator checks
idempotency, downstream capacity, backlog shape, host headroom, and the
service-specific limit.

## Read-only operating procedures

The examples below use the GitHub CLI. They contain no credential values.
Repository and environment access may still be required.

### 1. Establish the safety state

Run the all-service runtime status:

```bash
gh workflow run backend-worker-runtime-operations.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=status \
  -f dry_run=true
```

Accept only a report that shows:

- `mode=shadow`;
- `production_writes_enabled=false`;
- all eight services present and healthy;
- every required main queue consumer count greater than zero;
- no unexpected blocked stage or restart loop.

For an authenticated operator view, open `/admin/shards`. The worker-uplift
projection shows the active owner, cutover state, write mode, stage health,
queue age, DLQs, throughput, p95 latency, retries, consumers, version,
dashboard links, and runbook links. It is a sanitized PostgreSQL-backed
projection; it does not grant broker, host, Grafana, or DNS mutation.

### 2. Inspect one service and its logs

Set `<service>` to one of the eight source-controlled names:

```bash
gh workflow run backend-worker-runtime-operations.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=logs \
  -f service_name=<service> \
  -f tail=200 \
  -f dry_run=true
```

Use at most 1,000 lines. Search structured fields for consumer cancellation,
channel closure, reconnect attempts, retry classification, safe error codes,
message identifiers, and stage names. Never paste payloads, connection
strings, tokens, provider responses, or private headers into an issue.

Validate that all eight service streams and RabbitMQ logs reach Loki:

```bash
gh workflow run backend-worker-uplift-logs-check.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f require_loki_data=true
```

### 3. Inspect queues and DLQs

Inspect the selected service’s declared queue only:

```bash
gh workflow run backend-worker-runtime-operations.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=queue-inspect \
  -f service_name=<service> \
  -f queue_kind=main \
  -f dry_run=true
```

Repeat with `queue_kind=retry` when needed. Inspect the DLQ through the
dedicated action:

```bash
gh workflow run backend-worker-runtime-operations.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=dlq-inspect \
  -f service_name=<service> \
  -f queue_kind=dlq \
  -f dry_run=true
```

Record queue depth, ready and unacknowledged messages, consumer count, oldest
age, publish/ack rates, retry depth, DLQ depth, and change since the previous
sample. Inspect metadata only. Do not retrieve or copy message bodies.

### 4. Inspect RabbitMQ and telemetry

Read the current recovery state without running a drill:

```bash
gh workflow run backend-rabbitmq-recovery.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=status
```

Require fresh Grafana Cloud metrics:

```bash
gh workflow run backend-rabbitmq-metrics-check.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f require_grafana_data=true
```

The metrics report must confirm the loopback-only Prometheus listener, valid
Alloy configuration, RabbitMQ data in Grafana Cloud, and no critical or
unconfigured check. Telemetry failure does not prove broker failure; use the
runtime and queue reports as the independent control-plane check.

### 5. Inspect backups and credentials

Backup status is read-only:

```bash
gh workflow run backend-backup-maintenance.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=status
```

Credential readiness reports names, groups, and presence/shape state without
printing values:

```bash
gh workflow run backend-credential-readiness.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f group=rabbitmq
```

Use the same workflow for the relevant source-controlled group before and
after a rotation. `LOCAL_AI_API_KEY` remains the retained provider source for
the service-specific approval and translation Qwen credential files. Do not
replace that mapping with an undocumented shared runtime variable.

### 6. Re-establish parity and soak evidence

Run a complete current window:

```bash
gh workflow run backend-worker-uplift-soak-report.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f mode=live-read-only \
  -f min_window_hours=48 \
  -f require_complete_window=true
```

If no fresh shadow event exists, an authorized operator may first run the
existing protected scheduler shadow smoke. That smoke is a protected shadow
mutation, not a read-only check. Never weaken the complete-window requirement
to make a readiness result pass.

Inspect the report artifact for the observation window, event count, health,
queue and DLQ change, cost, host headroom, telemetry, and guardrails.

## Grafana Cloud, SLO, and quota ownership

Only `ramideltoro/nutsnews-infra` manages Grafana Cloud. Backend services have
write-only telemetry credentials and must not create or modify Grafana
resources.

The as-built catalog provides:

- `NutsNews Worker-Uplift RabbitMQ Overview`;
- `NutsNews Worker-Uplift Queue Drilldown`;
- `NutsNews Worker-Uplift RabbitMQ Resources`;
- `NutsNews Worker-Uplift Pipeline SLOs`;
- the `NutsNews Worker-Uplift RabbitMQ Guardrails` alert group.

Alert coverage includes broker loss, private canary failure, Alloy loss, zero
consumers, backlog and oldest-age growth, publish/ack divergence,
unacknowledged messages, retry/DLQ growth, connection churn, disk/file
descriptor alarms, stale recovery proof, restart activity, and SLO burn.

| Objective or guardrail | As-built target |
| --- | --- |
| Broker availability | 99.5% monthly |
| Stage-event success | 99% |
| Stage p95 latency | less than 30 seconds |
| Feed freshness | less than 30 minutes |
| Retry/DLQ ratio | less than 1% |
| Final publication success | 99% |
| Worker plus host active series | ceiling 5,000 |
| Worker logs | 2 GB/month |
| Broker logs | 1 GB/month |
| Total backend logs including worker | 5 GB/month |

At 70% quota use, freeze new telemetry classes. At 85%, reduce nonessential
verbosity and debug logs. At 95%, stop or roll back the offending signal
before traffic. If the account is over budget, keep the uplift disabled.

Grafana changes follow `Grafana Cloud Plan`, reviewed Terraform, then
`Grafana Cloud Apply`. A dashboard edit in the Grafana UI is not a durable
change and must be reconciled to infra source control.

## Dry runs and plans

### Host configuration

Use `Protected Backend Ansible Apply` with `run_mode=check`. Review the diff and
Ansible result. An apply requires a second invocation from reviewed `main`,
`run_mode=apply`, and the exact target confirmation.

### Runtime actions

For actions that support it, run `Backend Worker Runtime Operations` first with
`dry_run=true`. The action, service, source image digest or rollback metadata,
replica limit, queue, and expected result must be recorded before apply.

Important current limits:

- `promote` is observation-only in dry-run and fails closed on apply while the
  worker-uplift cutover controls are absent;
- `dlq-replay` produces a plan in dry-run, but generic apply fails closed;
- reconciliation dry-run produces a service-owned plan and does not publish;
- `drain` means scale the selected service to zero; it does not wait for a
  queue to empty.

### Infra

Use `Grafana Cloud Plan` before any Grafana apply. Use `Cloudflare DNS
Failover Apply` with `run_mode=plan` and `dns_writes_enabled=false` to validate
the controller bundle. A DNS plan is unrelated to worker cutover and must not
be bundled into a worker-uplift change.

## Protected service changes

All commands in this section are mutations. Run them only for an approved
shadow operation with the fixed confirmation, and inspect the artifact.

### Deploy

Deployment dependency order is:

1. merge and release a stage repository image;
2. verify its signature, scan, commit tag, and exact digest;
3. update the backend runtime manifest by PR;
4. pass Backend Checks;
5. run protected Ansible `check`, then `apply` when host configuration changes;
6. run runtime `deploy` for only that service;
7. run all-service `status`, service queue/DLQ inspection, logs, and protected
   shadow smoke.

```bash
gh workflow run backend-worker-runtime-operations.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=deploy \
  -f service_name=<service> \
  -f dry_run=false \
  -f confirm_target=backend.nutsnews.com
```

Never deploy an unreviewed tag or mutable image reference. The backend manifest
must contain the exact approved digest and rollback metadata.

### Protected restart versus deployment recovery

Use `restart` when the deployed digest and configuration are correct but a
consumer, connection, or channel did not recover. It restarts only the selected
service:

```bash
gh workflow run backend-worker-runtime-operations.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=restart \
  -f service_name=<service> \
  -f dry_run=false \
  -f confirm_target=backend.nutsnews.com
```

Use deployment recovery when the image, runtime manifest, environment file,
compose definition, or host configuration is wrong. Correct it by PR, pass CI,
run protected Ansible check/apply if needed, then deploy the corrected digest.
Do not repeatedly restart a known-bad deployment.

After either path, prove `/ready`, consumer count greater than zero, structured
reconnect/cancellation logs, stable metrics, queue reduction, no new DLQ
growth, and restored shadow processing.

### Scale, pause, resume, and drain

Scale only within the source-controlled maximum of three:

```bash
gh workflow run backend-worker-runtime-operations.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=scale \
  -f service_name=<service> \
  -f replicas=<0-to-3> \
  -f dry_run=false \
  -f confirm_target=backend.nutsnews.com
```

`replicas=0` pauses a service. Resume by restoring its reviewed replica count.
The named `drain` action also scales the selected service to zero. For a
planned pipeline stop, stop the scheduler first, keep consumers running until
all main and retry queues reach zero, then stop consumers from publication
back toward fetcher. Verify after every action.

### Rollback

Rollback is allowed only when the source-controlled manifest contains valid
rollback metadata:

```bash
gh workflow run backend-worker-runtime-operations.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=rollback \
  -f service_name=<service> \
  -f dry_run=false \
  -f confirm_target=backend.nutsnews.com
```

Rollback the smallest affected service. Then run status, logs, main/retry/DLQ
inspection, consumer-count verification, and shadow smoke. Record both image
digests and the reason.

## DLQ and reconciliation

### Poison-message handling

1. Stop automated retries when they amplify the incident.
2. Inspect DLQ metadata, safe error codes, stage state, outbox state, and the
   original source identifier. Do not retrieve payloads into an issue.
3. Fix and deploy the service or data rule first.
4. Produce a `dlq-replay` dry-run plan.
5. Use a service-owned reconciliation endpoint when the PostgreSQL stage and
   outbox state can safely reconstruct work.
6. Prove new message identifiers, idempotent final effects, no production
   visibility, queue drain, and no further DLQ growth.

Generic `dlq-replay` apply is intentionally blocked. There is no approved
manual republish fallback. If a service-owned replay cannot prove safe
reconstruction, retain the DLQ evidence and treat the item as a readiness
blocker.

### Reconciliation

Run a plan:

```bash
gh workflow run backend-worker-runtime-operations.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=reconciliation \
  -f service_name=<service> \
  -f dry_run=true \
  -f confirm_target=backend.nutsnews.com
```

Apply only when the service-specific endpoint, bounded selection, stop switch,
and protected reconciliation-enable gate are approved:

```bash
gh workflow run backend-worker-runtime-operations.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=reconciliation \
  -f service_name=<service> \
  -f dry_run=false \
  -f confirm_target=backend.nutsnews.com
```

The apply must remain shadow-only. Record plan count, applied count, new
message identifiers, duplicate-effect count, public visibility, queue drain,
and post-run DLQ change.

## RabbitMQ recovery and empty-broker procedure

Use PostgreSQL state, not live broker files, as the recovery anchor.

1. Declare the incident and keep legacy production ingestion unchanged.
2. Run runtime `status`, queue/DLQ inspection, RabbitMQ recovery `status`, host
   health, and Grafana checks.
3. If only a consumer is lost, use the protected restart procedure.
4. If broker configuration drifted, correct backend source control and run
   protected Ansible check/apply.
5. If the broker must be rebuilt, first run `clean-rebuild-drill` against the
   disposable drill broker through `Backend RabbitMQ Recovery`.
6. Recreate the live broker only through the reviewed backend apply/recovery
   path after explicit owner approval. Reapply source-controlled vhost,
   policies, exchanges, queues, bindings, and least-privilege identities.
7. Start consumers downstream to upstream, ending with the scheduler. Verify
   topology, permissions, `/ready`, and a positive consumer count on every main
   queue.
8. Reconstruct missing transport work from stage outboxes and watermarks using
   service-owned reconciliation. Do not restore live RabbitMQ volume files.
9. Run a protected shadow smoke, then prove queue drain, idempotent effects,
   stable retry/DLQ counts, and `production_writes_enabled=false`.

`export-definitions`, `clean-rebuild-drill`, and
`stopped-volume-restore-drill` are protected evidence actions. The drills use
disposable or stopped test targets; they are not permission to overwrite the
live broker.

## Backup restore

`Backend Backup Maintenance` owns fixed `backup`, `verify`, and
`restore-drill` actions. `Backend Postgres Backup Restore Proof` owns an
isolated proof for the primary-shadow or rehearsal database.

For recovery:

1. run backup `status`;
2. identify the last verified snapshot and database proof by artifact, not by
   an unverified filename;
3. run a restore drill or PostgreSQL proof against the isolated allowed
   database;
4. verify schema, row counts, watermarks, outboxes, and application checks;
5. restore a live service only through the reviewed backend recovery path;
6. run runtime status, queue/DLQ checks, shadow smoke, parity, and complete soak
   evidence before declaring recovery.

Restic backup and verify actions are protected mutations because they create
or traverse remote backup state. Restore drills are also mutations, even when
isolated.

## Credential rotation

Never read, copy, echo, download, or attach credential values.

1. Identify the credential inventory entry, owner, services, runtime files,
   and least-privilege capability.
2. Run `Backend Credential Readiness` for that group.
3. Have the provider or GitHub Environment owner create the replacement in the
   protected store. This human/provider mutation has no generic backend
   workflow and is not authorized by this guide.
4. Update source-controlled metadata only when names or mappings change, by
   PR and Backend Checks.
5. Apply runtime files through protected Ansible check/apply, then restart the
   smallest affected service set.
6. Run credential readiness, runtime status, logs, queue/DLQ inspection,
   metrics, and a protected shadow smoke.
7. Revoke the old provider credential only after all checks pass.

Rotate RabbitMQ route identities one route at a time. Treat approval and
translation as one Qwen source-credential rotation because both map from the
retained `LOCAL_AI_API_KEY`. Rotate persistence and publication API tokens
separately. Backend owns write-only Grafana telemetry credentials; infra owns
Grafana management credentials.

## Incident decision table

| Incident | Immediate read-only evidence | Stop or hold | Protected recovery | Exit evidence |
| --- | --- | --- | --- | --- |
| Broker unavailable | runtime status, recovery status, metrics, host health | keep legacy owner; do not start scheduler | protected apply/recovery; empty-broker procedure when required | broker healthy, topology and permissions valid, all consumers restored, shadow queue drains |
| PostgreSQL outage | stage health, API health, logs, backup status | pause scheduler; preserve broker; do not acknowledge work that cannot commit | database recovery and isolated restore proof; resume downstream before scheduler | DB health, watermarks/outboxes consistent, idempotent replay, parity |
| Qwen/provider outage | approval/translation health, logs, retry/DLQ trends, credential readiness | pause affected consumers if retries amplify; leave other stages bounded | rotate retained provider credential or restart/deploy corrected service through protected paths | provider probe healthy, retries settle, queues drain, no public writes |
| Backlog or oldest-age growth | queue depth/age, publish/ack rates, consumers, p95, host headroom | stop scheduler if downstream cannot catch up | restart lost consumer; scale to reviewed limit; deploy correction | positive consumers, falling depth/age, no new DLQ, quota within guardrail |
| Poison message or DLQ growth | DLQ metadata, safe error code, stage/outbox state | stop automated replay and retry amplification | fix service, dry-run replay, service-owned reconciliation | bounded applied count, new IDs, zero duplicate effects, queue drain |
| Telemetry loss | metrics check, logs check, runtime status, queue inspection | hold cutover/readiness; do not infer broker failure | correct Alloy/credentials through infra/backend protected paths | fresh Prometheus and Loki data plus independent runtime health |
| Failed publication | publication health/logs, DB API health, outbox/watermark, queue/DLQ | pause publication and upstream scheduler as needed; preserve outbox | API credential recovery, deploy/rollback, or publication reconciliation | command-scoped API passes, idempotent final effect, no duplicate visibility |
| Zero consumers or dropped channel | `/ready`, runtime status, main queue consumers, cancellation/reconnect logs | pause scheduler if backlog risk grows | protected restart when digest/config are correct; otherwise deployment recovery | consumer count restored, reconnect metric/log present, queue drains |

If a fixed recovery path does not exist or evidence is ambiguous, stop. Record
the missing proof as a production-readiness blocker rather than inventing a
manual mutation.

## Cloudflare DNS failover must survive ingestion changes

The public apex/www DNS failover controller is not a worker-ingestion
component. Stopping legacy ingestion in a future tranche must **not** stop,
retire, redeploy incidentally, or weaken:

- the `nutsnews-dns-failover` Cloudflare Worker;
- the `DnsFailoverController` Durable Object;
- active Durable Object state for `nutsnews-production-vps-primary`;
- the cron watchdog and 15-second alarm loop;
- the protected `/status` and action endpoints, including `/check-now`,
  `/manual-lock`, `/manual-failover`, `/manual-failback`,
  `/test-health-override`, and the guarded inactive-instance
  `/retire-controller`;
- automatic failover/failback alerting and sanitized DNS target-change
  evidence;
- the `FAILOVER_ANALYTICS` Analytics Engine evidence contract and
  `nutsnews_failover_controller` dataset when the account binding is enabled;
- the emergency Cloudflare dashboard/API procedure and the requirement to
  reconcile emergency changes into infra source control.

At the immutable infra baseline above, the infra-owned `wrangler.toml`
declares the Durable Object but does not declare the Analytics Engine binding.
The legacy controller source contains the optional, best-effort analytics
writer and binding contract. Moving or retiring legacy ingestion must not
discard that evidence surface. Before production readiness, the infra owner
must either prove the active controller already retains the enabled binding,
migrate and test it in infra, or explicitly accept the unbound state as a
documented residual risk. Analytics ingestion must remain best-effort and must
never block a DNS failover decision.

DNS plan/apply remains in `ramideltoro/nutsnews-infra` under
`cloudflare-admin`. Manual controller actions require the protected admin
boundary and confirmation bodies described in the immutable infra runbook.
This guide intentionally does not reproduce tokens or direct API commands.

## Future coexistence and cutover sequence

The following is the required sequence. Completed phases remain documented so
operators can distinguish the deployed baseline from later gated mutations.

### Phase 0: Current coexistence

- Legacy worker owns production ingestion.
- Uplift services process shadow-only work.
- Production writes remain false.
- DNS failover continues independently.
- Operators collect runtime, parity, soak, security, backup, recovery,
  telemetry, and quota evidence.

### Phase 1: Production-readiness review

Issue #125 recorded GO for guarded cutover-control implementation after
dispositioning the residual security and operations risks. That GO authorized
#150 and then #126 implementation only; it did not authorize cutover.

### Phase 2: Separate ingestion scheduling from DNS failover

Issue #150 implemented this separation without changing the active owner. The
controller binding `INGESTION_SCHEDULING_ENABLED` defaults safely to enabled
when absent. Scheduled and manual ingestion paths wake/check failover first;
when the binding is explicitly false they do not send shard-refresh or
translation-backlog requests. Health, status, actions, Durable Object alarms,
DNS readback, live-origin readiness, alerts, and Analytics Engine reporting
remain outside the ingestion gate.

The value-free status signal is `GET` or `HEAD`
`/ingestion-scheduling/status`. The fixed workflow is
`Controller Ingestion Scheduling Operations` in `ramideltoro/nutsnews-worker`:

```bash
gh workflow run controller-ingestion-scheduling-operations.yml \
  --repo ramideltoro/nutsnews-worker \
  --ref main \
  -f action=status \
  -f ingestion_scheduling_enabled=true \
  -f confirmation=inspect-ingestion-scheduling

gh workflow run controller-ingestion-scheduling-operations.yml \
  --repo ramideltoro/nutsnews-worker \
  --ref main \
  -f action=plan \
  -f ingestion_scheduling_enabled=false \
  -f confirmation=plan-ingestion-scheduling-false
```

`status` is read-only. `plan` runs focused tests, renders the exact controller
configuration, and executes a Wrangler dry run without deploying. `apply` is
a protected production mutation requiring the typed
`set-ingestion-scheduling-<true|false>` confirmation. Until #166 approves the
exact candidate and #127 executes the cutover, operators may apply only
`true`. A false plan is evidence, not permission to disable ingestion.

Rollback is configuration-only: protected apply of `true`, followed by the
status artifact proving `observedIngestionSchedulingEnabled=true` and every
retained failover surface. No Worker shard, route, cron, secret, binding, or
Durable Object migration is removed by either rendered state.

### Phase 3: Add reversible controls

Future issue #126 must implement and test fixed protected controls for:

- production-owner state;
- scheduler pause/resume;
- production-write enable/disable;
- a cutover watermark and evidence artifact;
- rollback eligibility and stop conditions;
- independent DNS-failover invariants.

Dry-run the complete sequence. The current runtime `promote` action is not a
substitute.

### Phase 4: Establish the cutover watermark

During a future approved window:

1. leave DNS failover unchanged;
2. pause new legacy scheduling through the future protected control;
3. keep legacy production writers authoritative while establishing the
   reviewed handoff boundary;
4. allow in-flight work to settle;
5. prove main and retry queues drained, DLQ state explained, outboxes and
   watermarks reconciled, database backup verified, and admin/Grafana evidence
   fresh;
6. write an immutable watermark artifact with timestamps, owner state,
   versions, digests, counts, and rollback deadline.

No current workflow implements this ingestion handoff.

### Phase 5: Execute the protected switch

Future issue #127 may switch the owner and production-write gates only through
the #126 protected workflow, after #125 approval. Legacy ingestion becomes
standby, not deleted. DNS failover continues unchanged.

Immediately prove:

- one production ingestion owner;
- uplift production-write gates match the approved state;
- public visibility and publication are correct and idempotent;
- all consumers are present;
- queue and retry depth decrease;
- DLQs do not grow unexpectedly;
- admin projection, Grafana dashboards, alerts, SLOs, and quotas are healthy;
- DNS controller status, Durable Object timestamps, alerts, and manual paths
  remain healthy.

### Phase 6: Observation and rollback

Keep legacy ingestion deployable in standby for the approved observation
window. Before any new backend-only writes pass the verified synchronization
point, the future rollback workflow may disable uplift writes, restore the
recorded owner state, and resume legacy scheduling. It must preserve the
watermark and verify no split-brain writer.

After the synchronization point, default to forward recovery unless a reviewed
sync-back procedure proves that rollback cannot lose or duplicate data.
DNS failover remains active in either direction.

### Phase 7: Decommission and final documentation

Only issue #128 may retire legacy ingestion after the observation window.
Retiring ingestion does not retire DNS failover. Issue #151 records the final
production architecture and surviving controller ownership.

## Evidence record

The following tested results establish this guide’s baseline, not permission
to cut over:

| Evidence | Result |
| --- | --- |
| Complete 72.43-hour soak | [run 30405550709](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30405550709), 415 shadow events, artifact digest `sha256:948e35028e0d83b5503c1845495a63b6689b50688dba15cc1306cf271ae28d2c` |
| Restored runtime and queue drain | [shadow smoke 30405294851](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30405294851), eight ready services and consumers, no DLQ growth |
| Fresh metrics | [run 30405452541](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30405452541) |
| Fresh logs | [run 30405452566](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30405452566) |
| RabbitMQ clean rebuild | [run 30215207093](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30215207093) |
| Reconnect after broker restart | [run 30217775773](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30217775773) |
| Consumer-loss, network, disk, credential, unroutable, full-queue, poison, telemetry-loss, and restart drills | runs [30215511424](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30215511424), [30215657802](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30215657802), [30215682200](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30215682200), [30215705118](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30215705118), [30215728726](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30215728726), [30215755886](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30215755886), [30215781658](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30215781658), [30215806339](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30215806339), and [30215830769](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30215830769) |
| Service-owned reconciliation apply proof | [run 30213792420](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30213792420), two persistence items, new message IDs, no duplicate final effect, no production visibility |
| Fresh protected security evidence | shadow model [30451802240](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30451802240), runtime status [30451804551](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30451804551), recovery status [30451806594](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30451806594), metrics [30451809064](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30451809064), logs [30451811517](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30451811517), value audit [30451813700](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30451813700) |
| Security review merge and post-merge checks | backend [PR #444](https://github.com/ramideltoro/nutsnews-backend/pull/444), merge `b619cf91504eafca21f70c5d68888563f5fca7a9`, [Backend Checks 30484088483](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30484088483) |
| Legacy scheduling separation | worker [PR #171](https://github.com/ramideltoro/nutsnews-worker/pull/171), merge `a073e351e5716a97e0759cca17096851cbb80261`; [post-merge Worker Pipeline 30690135595](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30690135595) deployed with scheduling enabled |
| Protected enabled-state proof | [run 30690227183](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30690227183), apply artifact digest `sha256:c7910b8859cc8c41856bc7baa0b49b6161e5691f4df581388baa77ace2816e9c`; live status [run 30690250981](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30690250981), digest `sha256:493029f6e821e516b4a2626a26abcff7e26f4d96828294c459a92bbf0ee1b2a0` |
| Disabled-state no-mutation proof | [plan run 30690250417](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30690250417), protected scope unchanged, artifact digest `sha256:f9e46d413b43e623b92ba7b20b834a66a87c98888fed8c34029f295b81bd8cbb` |

For a new incident or readiness decision, record:

- workflow name, run ID, source commit, conclusion, environment, and action
  class;
- artifact name, ID, digest, and observation window;
- owner mode and production-write state;
- service health, versions, consumer counts, queues, retries, DLQs, and drain
  result;
- database, outbox, watermark, backup, and reconciliation evidence;
- Grafana metrics/log freshness, SLOs, quotas, alerts, and host headroom;
- DNS controller status and the fact that no worker operation changed it;
- each failed check, remediation, or explicit residual-risk owner decision.

Do not include secrets, message payloads, raw provider responses, private
headers, connection strings, or unredacted host output.

## Completion checklist

- [ ] Legacy ingestion is still the production owner.
- [ ] Uplift is still shadow-only and production writes are false.
- [ ] Every read-only report artifact was inspected.
- [ ] Every mutation used its fixed protected owner path.
- [ ] All eight services are healthy with required consumers.
- [ ] Queue, retry, DLQ, and drain evidence is recorded.
- [ ] PostgreSQL outbox, watermark, backup, and reconciliation evidence agrees.
- [ ] Grafana data, alerts, SLOs, quotas, and admin projection are current.
- [ ] DNS failover controller state and ownership are unchanged.
- [ ] Missing apply paths or proof are recorded as readiness blockers.
- [ ] No secret value, message payload, or improvised manual mutation appears
      in the evidence.
