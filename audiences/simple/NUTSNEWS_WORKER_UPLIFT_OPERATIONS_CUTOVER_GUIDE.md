---
title: NutsNews Worker-Uplift Incident and Rollback Record
description: >-
  A plain-language guide to the completed worker-uplift rollback, stable shadow
  baseline, quarantined failed candidate, and read-only evidence boundary.
wiki:
  source_route: /technical/nutsnews-worker-uplift-operations-cutover-guide
  simple_route: /simple/nutsnews-worker-uplift-operations-cutover-guide
  slug: nutsnews-worker-uplift-operations-cutover-guide
  primary_diagram:
    file: diagrams/NUTSNEWS_WORKER_UPLIFT_OPERATIONS_CUTOVER_GUIDE.mmd
    accTitle: Worker uplift cutover incident and completed rollback
    accDescr: >-
      The failed cutover rolled back to stable generation 5 shadow with legacy
      ownership and scheduling restored, uplift writes disabled, observation
      never started, and the failed publication candidate quarantined.
  status: active
  collection: platform-and-data
  section: core-platform
  order: 233
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 83e12961d48fd31be6bced1e342b2c369de67a3ae7fa31f6a02b51c0ac503ea6
---
# NutsNews Worker-Uplift Incident and Rollback Record

This guide explains the completed rollback, how to inspect stable shadow safely, and which older procedures remain frozen.

> **Current incident override (2026-08-01).** The cutover used an older Runtime
> 0.x candidate, publication failed with 28 messages, 84 retries, and zero
> successes, and public freshness breached 15 minutes. The observation window
> never started. [Backend run 30715252632](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30715252632)
> completed rollback prepare but failed before finalize. [Worker run
> 30715293972](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715293972)
> deployed legacy scheduling true; its immediate verifier saw the old false
> value. Scheduling was then successfully verified by [worker run
> 30715590990](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715590990)
> and [status run 30715611673](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715611673).
> [Backend run 30715566651](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30715566651)
> completed finalize. The current row is stable `shadow` generation 5 with
> owner `legacy_shards`, legacy dispatch and scheduling true, uplift scheduler
> true in shadow, uplift writes false, publication shadow, null observation
> timestamps, and single-writer/DNS checks passing.

> **Backend source hardening.** Backend
> [`PR #482`](https://github.com/ramideltoro/nutsnews-backend/pull/482) now
> records the rollback receipt, consumes the old cutover authority, and guards
> backend mutations. Backend
> [`PR #483`](https://github.com/ramideltoro/nutsnews-backend/pull/483) repairs
> the forward publication contract and retry identity. Both are source-only
> merges. They did not deploy, replay queues, or make the failed candidate safe.
> The worker deploy guard and infra verifier remain unfinished and frozen.

> **Freeze.** Use read-only evidence only until incident reconciliation and the
> unfinished worker deploy guard and infra verifier are complete. Do not run
> normal worker deploys, backend Ansible/runtime actions, replay or
> reconciliation, duplicate cutover or rollback, Grafana apply, synthetics, or
> web merge. Rollback is complete; do not rerun cutover, rollback, or finalize.
> The failed Runtime 0.x candidate is disqualified and quarantined. No automatic
> rollback or recovery replay ran. See
> the [central incident evidence](https://github.com/ramideltoro/nutsnews-infra/issues/474#issuecomment-5153075316).

## Current operating state

The current state is:

| Control | Verified incident state |
| --- | --- |
| Production ingestion owner | `legacy_shards` |
| Control state | Stable `shadow`, generation 5 |
| Uplift production writes | `false` |
| Uplift scheduler | `true` in shadow |
| Publication | `shadow` |
| Legacy dispatch | `true` |
| Public legacy scheduling | `true`, verified |
| Runtime 1 | Published, but backend PR #471 is conflicting and undeployed; PR #483, authoritative generation 5 ownership, and exact-eight runtime recreation remain blockers |
| Backend source guards | PRs #482 and #483 merged; source-only, no deployment or replay |
| Remaining source blockers | Worker deploy guard and infra verifier unfinished and frozen |
| Writer safety | Single-writer and DNS checks passed |
| Recovery | Complete; do not rerun cutover, rollback, or finalize |
| Services | scheduler, fetcher, canonicalizer, enrichment, approval, translation, persistence, publication |
| Durable transport | RabbitMQ on the backend host |
| Authoritative state | Backend PostgreSQL control row, stage schemas, outboxes, and watermarks |
| Backend operations | `ramideltoro/nutsnews-backend` |
| Grafana Cloud resources | `ramideltoro/nutsnews-infra` |
| Admin projection | `ramideltoro/nutsnews`, `/admin/shards` |
| Public apex/www DNS failover | `ramideltoro/nutsnews-infra`; separate from ingestion |
| Tracking and sequence | `ramideltoro/nutsnews-worker` issues |

RabbitMQ is transport, not the system of record. A broker rebuild restores source-controlled topology and resumes from PostgreSQL outbox and watermark state. Live RabbitMQ data files are not copied as a normal backup.

## Ownership boundaries

Use only fixed, reviewed workflows from `main`. Do not run improvised SSH, Docker, RabbitMQ administration, SQL, secret-copying, DNS, or replay commands.

| Surface | Source-controlled owner | Protected path |
| --- | --- | --- |
| Host configuration | backend | Read-only drift/evidence only; Ansible apply frozen |
| Service status, logs, and queue inspection | backend | Read-only `Backend Worker Runtime Operations` actions |
| Service mutations | backend | Frozen; generic runtime rollback is not cutover rollback |
| RabbitMQ status, topology export, and disposable recovery drills | backend | Read-only status/topology evidence only; rebuild and recovery drills frozen |
| RabbitMQ failure drills and isolated smoke | backend | Read-only retained artifacts only; canary fixtures and smoke mutations frozen |
| PostgreSQL backup and isolated restore proof | backend | Read-only backup status/artifacts only; backup and restore mutations frozen |
| Credential inventory and readiness | backend | Read-only readiness evidence only; changes/application frozen |
| Grafana dashboards, alerts, folders, quotas, and drift | infra | Read-only evidence; Grafana apply is frozen |
| DNS failover controller and DNS-write state | infra | Read-only status/evidence only; DNS apply/writes frozen |
| Legacy ingestion scheduling | legacy worker | Public status is verified true; read-only status only |
| Admin worker-uplift projection | web app | reviewed application deployment; no broker or Grafana management access |
| Reversible ingestion controls | backend | Rollback complete; no rerun authorized |

The existing backend workflow named `Backend Production Cutover` switches the database provider. It is not a worker-ingestion cutover workflow and must not be used to promote the worker uplift.

## What kinds of actions exist

| Class | Meaning | Examples |
| --- | --- | --- |
| Public or application read-only | No infrastructure change | public health, authenticated `/admin/shards`, immutable workflow artifacts |
| Protected read-only | Fixed workflow reads host, broker, database, or telemetry state | runtime `status`, `logs`, queue inspection, recovery `status`, complete soak report |
| Offline validation | Checks repository files only | docs validation, backend validators, Ansible syntax |
| Dry run or plan | Historical capability | Frozen during post-rollback hold |
| Protected mutation | Changes production or managed state | Frozen; rollback complete |
| Unavailable or blocked | No current incident authorization | Full rollback rerun, generic runtime actions, replay, reconciliation, Ansible, Grafana apply, synthetics, web merge, Runtime 1, and fetcher v2 |

Every workflow invocation must use `--ref main`. Read the workflow summary and download the artifact. A green workflow conclusion without a reviewed artifact is not complete evidence.

## Implementation baseline

This guide is pinned to specific source commits:

- [Backend commit `b619cf91504eafca21f70c5d68888563f5fca7a9`](https://github.com/ramideltoro/nutsnews-backend/tree/b619cf91504eafca21f70c5d68888563f5fca7a9), including the [runtime workflow](https://github.com/ramideltoro/nutsnews-backend/blob/b619cf91504eafca21f70c5d68888563f5fca7a9/.github/workflows/backend-worker-runtime-operations.yml) and [service-runtime runbook](https://github.com/ramideltoro/nutsnews-backend/blob/b619cf91504eafca21f70c5d68888563f5fca7a9/runbooks/WORKER_UPLIFT_SERVICE_RUNTIME.md).
- [Infra commit `ee61807a757fe087dbcecd60d5e0b7fe07f4115a`](https://github.com/ramideltoro/nutsnews-infra/tree/ee61807a757fe087dbcecd60d5e0b7fe07f4115a), including the [Grafana resource catalog](https://github.com/ramideltoro/nutsnews-infra/blob/ee61807a757fe087dbcecd60d5e0b7fe07f4115a/terraform/grafana-cloud/catalog/worker-uplift-rabbitmq-alerts.json) and [DNS failover runbook](https://github.com/ramideltoro/nutsnews-infra/blob/ee61807a757fe087dbcecd60d5e0b7fe07f4115a/runbooks/CLOUDFLARE_DNS_FAILOVER.md).
- [Admin application commit `d339f40a6c29b41d18d5d977575274345c73941b`](https://github.com/ramideltoro/nutsnews/tree/d339f40a6c29b41d18d5d977575274345c73941b) and merged [admin worker-uplift PR #518](https://github.com/ramideltoro/nutsnews/pull/518).
- [Legacy failover evidence contract at worker commit `22a2c4f33d8dacdf9fd2367de852ae29d3abaa85`](https://github.com/ramideltoro/nutsnews-worker/tree/22a2c4f33d8dacdf9fd2367de852ae29d3abaa85), including the [Analytics Engine documentation](https://github.com/ramideltoro/nutsnews-worker/blob/22a2c4f33d8dacdf9fd2367de852ae29d3abaa85/docs/FAILOVER_ANALYTICS_ENGINE.md).
- [Legacy ingestion-scheduling separation at worker merge `a073e351e5716a97e0759cca17096851cbb80261`](https://github.com/ramideltoro/nutsnews-worker/tree/a073e351e5716a97e0759cca17096851cbb80261), including the safe status contract and protected scheduling operations workflow.
- [Reversible cutover controls at backend commit `4a86fcb85a94f3821ee4ebe804c62cf2dab1bee7`](https://github.com/ramideltoro/nutsnews-backend/tree/4a86fcb85a94f3821ee4ebe804c62cf2dab1bee7), including a fixed workflow, single-row database gate, fail-closed decision, validator, tests, and runbook.
- Post-incident backend guards at merges
  [`510b775d7962e2e66d430fb6d458c3c88d60cdd3`](https://github.com/ramideltoro/nutsnews-backend/tree/510b775d7962e2e66d430fb6d458c3c88d60cdd3)
  and
  [`5531014000f52fd6101f8617463d5f2c887d0788`](https://github.com/ramideltoro/nutsnews-backend/tree/5531014000f52fd6101f8617463d5f2c887d0788);
  these are source safeguards, not deployment or replay evidence.

## Legacy ingestion scheduling is now separate

Worker issue #150 added `INGESTION_SCHEDULING_ENABLED`. It stays safely
enabled when the setting is missing, so the current legacy production owner
keeps scheduling. If a later approved cutover explicitly sets it to false,
the controller still checks failover first and keeps health, status, actions,
DNS checks, alarms, alerts, and analytics working; it skips only legacy shard
and translation-backlog requests.

Operators use `Controller Ingestion Scheduling Operations`. During the
post-rollback hold, use only `status`, which reads the safe public state; do not
repeat `plan` or `apply`. Worker runs 30715590990 and 30715611673 verified that
public scheduling is true. Historical runs 30690135595, 30690227183,
30690250417, and 30690250981 prove the original deployed enabled state,
protected apply, disabled dry run, and then-live status; they are not current
mutation authority.

If one of these owners changes behavior, update this guide in the same reviewed change or record the mismatch as a readiness blocker.

## Service and queue model

The main flow is:

`scheduler -> fetcher -> canonicalizer -> enrichment -> approval -> translation -> persistence -> publication`

Each consuming stage owns a main queue and may have retry and DLQ queues. Every running consumer service must report `/ready` healthy and the main queue must have at least one consumer. Zero consumers, consumer cancellation, and a dropped channel are failures even if the process still answers an HTTP probe.

The runtime manifest limits a service to three replicas. Increasing concurrency is an incident response only after the operator checks idempotency, downstream capacity, backlog shape, host headroom, and the service-specific limit.

## Safe read-only procedures

The examples below use the GitHub CLI. They contain no credential values. Repository and environment access may still be required.

### 1. Establish the safety state

Run the all-service runtime status:

```bash
gh workflow run backend-worker-runtime-operations.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=status \
  -f dry_run=true
```

Treat the runtime report as supporting evidence only. Cross-check it against the authoritative generation 5 finalize artifact, public scheduling, service health, queues, and publication outcome.

For an authenticated operator view, open `/admin/shards`. The worker-uplift projection shows the active owner, cutover state, write mode, stage health, queue age, DLQs, throughput, p95 latency, retries, consumers, version, dashboard links, and runbook links. It is a sanitized PostgreSQL-backed projection; it does not grant broker, host, Grafana, or DNS mutation.

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

Use at most 1,000 lines. Search structured fields for consumer cancellation, channel closure, reconnect attempts, retry classification, safe error codes, message identifiers, and stage names. Never paste payloads, connection strings, tokens, provider responses, or private headers into an issue.

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

Repeat with `queue_kind=retry` when needed. Inspect the DLQ through the dedicated action:

```bash
gh workflow run backend-worker-runtime-operations.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=dlq-inspect \
  -f service_name=<service> \
  -f queue_kind=dlq \
  -f dry_run=true
```

Record queue depth, ready and unacknowledged messages, consumer count, oldest age, publish/ack rates, retry depth, DLQ depth, and change since the previous sample. Inspect metadata only. Do not retrieve or copy message bodies.

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

The metrics report must confirm the loopback-only Prometheus listener, valid Alloy configuration, RabbitMQ data in Grafana Cloud, and no critical or unconfigured check. Telemetry failure does not prove broker failure; use the runtime and queue reports as the independent control-plane check.

### 5. Inspect backups and credentials

Backup status is read-only:

```bash
gh workflow run backend-backup-maintenance.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=status
```

Credential readiness reports names, groups, and presence/shape state without printing values:

```bash
gh workflow run backend-credential-readiness.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f group=rabbitmq
```

Use the same workflow for the relevant source-controlled group before and after a rotation. `LOCAL_AI_API_KEY` remains the retained provider source for the service-specific approval and translation Qwen credential files. Do not replace that mapping with an undocumented shared runtime variable.

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

If no fresh shadow event exists, an authorized operator may first run the existing protected scheduler shadow smoke. That smoke is a protected shadow mutation, not a read-only check. Never weaken the complete-window requirement to make a readiness result pass.

Inspect the report artifact for the observation window, event count, health, queue and DLQ change, cost, host headroom, telemetry, and guardrails.

## Grafana Cloud, SLO, and quota ownership

Only `ramideltoro/nutsnews-infra` manages Grafana Cloud. Backend services have write-only telemetry credentials and must not create or modify Grafana resources.

The as-built catalog provides the worker-uplift RabbitMQ overview, queue drilldown, RabbitMQ resources, pipeline SLOs, and the RabbitMQ guardrails alert group.

Alert coverage includes broker loss, private canary failure, Alloy loss, zero consumers, backlog and oldest-age growth, publish/ack divergence, unacknowledged messages, retry/DLQ growth, connection churn, disk/file descriptor alarms, stale recovery proof, restart activity, and SLO burn.

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

At 70% quota use, freeze new telemetry classes. At 85%, reduce nonessential verbosity and debug logs. At 95%, stop or roll back the offending signal before traffic. If the account is over budget, keep the uplift disabled.

Grafana changes normally follow plan, reviewed Terraform, and apply. Grafana plan/apply and synthetic rollout are frozen during the post-rollback hold.

## Historical capability reference: dry runs and mutations

Everything from this heading through credential rotation describes older
capabilities, not current authorization. During the post-rollback hold, use read-only
evidence only. Do not execute these plans or mutations; rollback is complete.

### Host configuration

Use `Protected Backend Ansible Apply` with `run_mode=check`. Review the diff and Ansible result. An apply requires a second invocation from reviewed `main`, `run_mode=apply`, and the exact target confirmation.

### Runtime actions

For actions that support it, run `Backend Worker Runtime Operations` first with `dry_run=true`. The action, service, source image digest or rollback metadata, replica limit, queue, and expected result must be recorded before apply.

Important current limits:

- `promote` is observation-only in dry-run and fails closed on apply while the worker-uplift cutover controls are absent;
- `dlq-replay` produces a plan in dry-run, but generic apply fails closed;
- reconciliation dry-run produces a service-owned plan and does not publish;
- `drain` means scale the selected service to zero; it does not wait for a queue to empty.

### Infra

Use `Grafana Cloud Plan` before any Grafana apply. Use `Cloudflare DNS Failover Apply` with `run_mode=plan` and `dns_writes_enabled=false` to validate the controller bundle. A DNS plan is unrelated to worker cutover and must not be bundled into a worker-uplift change.

## Historical capability reference: protected service changes

All commands in this section are frozen until rollback finalize and a new reviewed authorization.

### Deploy

Deployment dependency order is:

1. merge and release a stage repository image;
2. verify its signature, scan, commit tag, and exact digest;
3. update the backend runtime manifest by PR;
4. pass Backend Checks;
5. run protected Ansible `check`, then `apply` when host configuration changes;
6. run runtime `deploy` for only that service;
7. run all-service `status`, service queue/DLQ inspection, logs, and protected shadow smoke.

Never deploy an unreviewed tag or mutable image reference. The backend manifest must contain the exact approved digest and rollback metadata.

Run the protected deploy only after that sequence:

```bash
gh workflow run backend-worker-runtime-operations.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=deploy \
  -f service_name=<service> \
  -f dry_run=false \
  -f confirm_target=backend.nutsnews.com
```

### Restart versus deployment recovery

Use `restart` when the deployed digest and configuration are correct but a consumer, connection, or channel did not recover. It restarts only the selected service.

```bash
gh workflow run backend-worker-runtime-operations.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=restart \
  -f service_name=<service> \
  -f dry_run=false \
  -f confirm_target=backend.nutsnews.com
```

Use deployment recovery when the image, runtime manifest, environment file, compose definition, or host configuration is wrong. Correct it by PR, pass CI, run protected Ansible check/apply if needed, then deploy the corrected digest. Do not repeatedly restart a known-bad deployment.

After either path, prove `/ready`, consumer count greater than zero, structured reconnect/cancellation logs, stable metrics, queue reduction, no new DLQ growth, and restored shadow processing.

### Scale, pause, resume, and drain

Scale only within the source-controlled maximum of three. `replicas=0` pauses a service. Resume by restoring its reviewed replica count. The named `drain` action also scales the selected service to zero.

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

For a planned pipeline stop, stop the scheduler first, keep consumers running until all main and retry queues reach zero, then stop consumers from publication back toward fetcher. Verify after every action.

### Rollback

Rollback is allowed only when the source-controlled manifest contains valid rollback metadata. Roll back the smallest affected service. Then run status, logs, main/retry/DLQ inspection, consumer-count verification, and shadow smoke. Record both image digests and the reason.

```bash
gh workflow run backend-worker-runtime-operations.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=rollback \
  -f service_name=<service> \
  -f dry_run=false \
  -f confirm_target=backend.nutsnews.com
```

## Historical capability reference: DLQ and reconciliation

### Poison-message handling

1. Stop automated retries when they amplify the incident.
2. Inspect DLQ metadata, safe error codes, stage state, outbox state, and the original source identifier. Do not retrieve payloads into an issue.
3. Fix and deploy the service or data rule first.
4. Produce a `dlq-replay` dry-run plan.
5. Use a service-owned reconciliation endpoint when the PostgreSQL stage and outbox state can safely reconstruct work.
6. Prove new message identifiers, idempotent final effects, no production visibility, queue drain, and no further DLQ growth.

Generic `dlq-replay` apply is intentionally blocked. There is no approved manual republish fallback. If a service-owned replay cannot prove safe reconstruction, retain the DLQ evidence and treat the item as a readiness blocker.

### Reconciliation

Plan and apply are both frozen during the post-rollback hold. After a new reviewed recovery decision, any reconciliation must match the authoritative control row and preserve bounded evidence.

Plan with `dry_run=true`; changing the same fixed invocation to
`dry_run=false` is a protected mutation:

```bash
gh workflow run backend-worker-runtime-operations.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=reconciliation \
  -f service_name=<service> \
  -f dry_run=true \
  -f confirm_target=backend.nutsnews.com
```

## Historical capability reference: RabbitMQ recovery and empty-broker procedure

Use PostgreSQL state, not live broker files, as the recovery anchor.

1. Declare the incident and keep legacy production ingestion unchanged.
2. Run runtime `status`, queue/DLQ inspection, RabbitMQ recovery `status`, host health, and Grafana checks.
3. If only a consumer is lost, use the protected restart procedure.
4. If broker configuration drifted, correct backend source control and run protected Ansible check/apply.
5. If the broker must be rebuilt, first run `clean-rebuild-drill` against the disposable drill broker through `Backend RabbitMQ Recovery`.
6. Recreate the live broker only through the reviewed backend apply/recovery path after explicit owner approval. Reapply source-controlled vhost, policies, exchanges, queues, bindings, and least-privilege identities.
7. Start consumers downstream to upstream, ending with the scheduler. Verify topology, permissions, `/ready`, and a positive consumer count on every main queue.
8. Reconstruct missing transport work from stage outboxes and watermarks using service-owned reconciliation. Do not restore live RabbitMQ volume files.
9. Run a protected shadow smoke, then prove queue drain, idempotent effects, stable retry/DLQ counts, and `production_writes_enabled=false`.

`export-definitions`, `clean-rebuild-drill`, and `stopped-volume-restore-drill` are protected evidence actions. The drills use disposable or stopped test targets; they are not permission to overwrite the live broker.

## Historical capability reference: backup restore

`Backend Backup Maintenance` owns fixed `backup`, `verify`, and `restore-drill` actions. `Backend Postgres Backup Restore Proof` owns an isolated proof for the primary-shadow or rehearsal database.

For recovery:

1. run backup `status`;
2. identify the last verified snapshot and database proof by artifact, not by an unverified filename;
3. run a restore drill or PostgreSQL proof against the isolated allowed database;
4. verify schema, row counts, watermarks, outboxes, and application checks;
5. restore a live service only through the reviewed backend recovery path;
6. run runtime status, queue/DLQ checks, shadow smoke, parity, and complete soak evidence before declaring recovery.

Restic backup and verify actions are protected mutations because they create or traverse remote backup state. Restore drills are also mutations, even when isolated.

## Historical capability reference: credential rotation

Never read, copy, echo, download, or attach credential values.

1. Identify the credential inventory entry, owner, services, runtime files, and least-privilege capability.
2. Run `Backend Credential Readiness` for that group.
3. Have the provider or GitHub Environment owner create the replacement in the protected store.
4. Update source-controlled metadata only when names or mappings change, by PR and Backend Checks.
5. Apply runtime files through protected Ansible check/apply, then restart the smallest affected service set.
6. Run credential readiness, runtime status, logs, queue/DLQ inspection, metrics, and a protected shadow smoke.
7. Revoke the old provider credential only after all checks pass.

Rotate RabbitMQ route identities one route at a time. Treat approval and translation as one Qwen source-credential rotation because both map from the retained `LOCAL_AI_API_KEY`. Rotate persistence and publication API tokens separately. Backend owns write-only Grafana telemetry credentials; infra owns Grafana management credentials.

## Incident decision table

| Incident | Immediate read-only evidence | Stop or hold | Protected recovery | Exit evidence |
| --- | --- | --- | --- | --- |
| Broker unavailable | runtime status, recovery status, metrics, host health | preserve stable generation 5 shadow and rollback evidence | recovery frozen absent separate incident-owner authorization | new reviewed recovery evidence |
| PostgreSQL outage | stage health, API health, logs, backup status | preserve stable shadow and broker state | recovery and restore mutation frozen | new reviewed recovery evidence |
| Qwen/provider outage | approval/translation health, logs, retry/DLQ trends, credential readiness | keep the scheduler shadow-only and writes disabled | rotation/restart/deploy frozen | new reviewed recovery evidence |
| Backlog or oldest-age growth | queue depth/age, publish/ack rates, consumers, p95, host headroom | preserve queues and evidence | restart, scale, and deploy frozen | new reviewed recovery decision |
| Poison message or DLQ growth | DLQ metadata, safe error code, stage/outbox state | preserve metadata; do not replay | replay and reconciliation frozen | new reviewed recovery decision |
| Telemetry loss | metrics check, logs check, runtime status, queue inspection | do not infer broker failure | Grafana/backend mutation frozen | new reviewed recovery decision |
| Failed publication | publication health/logs, DB API health, outbox/watermark, queue/DLQ | preserve abort evidence and quarantine candidate | deployment, rollback, replay, and reconciliation frozen | stable gen5 shadow; new reviewed qualification required |
| Zero consumers or dropped channel | `/ready`, runtime status, main queue consumers, cancellation/reconnect logs | preserve stable shadow; do not change scheduler | restart and deployment frozen | new reviewed recovery decision |

If a fixed recovery path does not exist or evidence is ambiguous, stop and record the missing proof as a production-readiness blocker.

## Cloudflare DNS failover must stay independent

The public apex/www DNS failover controller is not a worker-ingestion component. Stopping legacy ingestion in a future tranche must not stop, retire, redeploy incidentally, or weaken the Cloudflare Worker, Durable Object state, cron watchdog, protected status and action endpoints, automatic failover/failback alerting, sanitized DNS target-change evidence, the Analytics Engine evidence contract, or the emergency Cloudflare dashboard/API procedure. `ramideltoro/nutsnews-infra` under `cloudflare-admin` remains the owner path for a future authorized DNS plan/apply; during this hold, use read-only status and evidence only, with no DNS apply or manual action.

At the pinned infra baseline, `wrangler.toml` declares the Durable Object but
does not declare `FAILOVER_ANALYTICS`. The legacy controller contains the
optional best-effort writer and dataset contract. Before readiness, infra must
prove the active binding, migrate and test it, or record owner acceptance of
the unbound residual risk. Analytics ingestion must never block DNS failover.

## Historical pre-cutover sequence

This records the old design. It is not a current action plan and must not be executed during the post-rollback hold.

### Phase 0: Historical coexistence

- Legacy worker owned production ingestion.
- Uplift services processed shadow-only work.
- Production writes were false.
- DNS failover continues independently.
- Operators collect runtime, parity, soak, security, backup, recovery, telemetry, and quota evidence.

### Phase 1: Production-readiness review

Issue #125 recorded GO for guarded control implementation only. It did not authorize cutover.

### Phase 2: Separate ingestion scheduling from DNS failover

Issue #150 separated legacy ingestion scheduling from the DNS controller. This phase description is historical; public scheduling is now true after rollback propagation.

### Phase 3: Add reversible controls

Issue #126 implemented fixed protected controls. Before cutover, the row started at `shadow` with the legacy owner enabled and uplift writes disabled. Constraints, an audit trigger, and a dedicated role reject two writers, stale state, and unrelated database changes.

Routine preflight, dry-run, isolated rehearsal, verification, and safe control deployment use a standing owner authorization whose exact scope is pinned by a validator. It does not authorize #166 GO, #127 execution, production writes, legacy-ingestion disable, DNS/failover changes, arbitrary SQL, secret access, or risk acceptance. Operators must download `cutover-control-report.json` and verify `SHA256SUMS`; a green run alone is not enough.

### Phase 4: Historical cutover watermark

The pre-cutover plan required DNS to remain unchanged, queues to drain, state to reconcile, and an immutable watermark artifact.

### Phase 5: Historical protected switch

The switch later executed on the older Runtime 0.x candidate. Publication failed and freshness breached the abort threshold, so the transition must not be called successful.

Immediately prove one production ingestion owner, matching uplift production-write gates, correct and idempotent public visibility and publication, all consumers present, queue and retry depth decreasing, DLQs not growing unexpectedly, and healthy admin projection, Grafana, alerts, SLOs, quotas, and DNS controller state.

### Phase 6: Completed rollback

The observation window never started. Rollback prepare completed, legacy scheduling was verified true, and backend run 30715566651 finalized stable `shadow` generation 5. Owner is `legacy_shards`, legacy dispatch and scheduling are true, uplift scheduler is true in shadow, uplift writes are false, publication is shadow, observation timestamps are null, and single-writer/DNS checks pass. Do not rerun cutover, rollback, or finalize. The failed candidate is disqualified and quarantined.

### Phase 7: Decommission and final documentation

Do not retire legacy ingestion. The observation window never started and the failed candidate remains quarantined. DNS failover stays independent.

## Evidence record

The following tested results establish the baseline, not permission to cut over:

| Evidence | Result |
| --- | --- |
| Complete 72.43-hour soak | run 30405550709, 415 shadow events, artifact digest `sha256:948e35028e0d83b5503c1845495a63b6689b50688dba15cc1306cf271ae28d2c` |
| Restored runtime and queue drain | shadow smoke 30405294851, eight ready services and consumers, no DLQ growth |
| Fresh metrics | run 30405452541 |
| Fresh logs | run 30405452566 |
| RabbitMQ clean rebuild | run 30215207093 |
| Reconnect after broker restart | run 30217775773 |
| Consumer-loss, network, disk, credential, unroutable, full-queue, poison, telemetry-loss, and restart drills | runs 30215511424, 30215657802, 30215682200, 30215705118, 30215728726, 30215755886, 30215781658, 30215806339, and 30215830769 |
| Service-owned reconciliation apply proof | run 30213792420, two persistence items, new message IDs, no duplicate final effect, no production visibility |
| Fresh protected security evidence | shadow model 30451802240, runtime status 30451804551, recovery status 30451806594, metrics 30451809064, logs 30451811517, value audit 30451813700 |
| Security review merge and post-merge checks | backend PR #444, merge `b619cf91504eafca21f70c5d68888563f5fca7a9`, Backend Checks 30484088483 |
| Cutover abort | [Central incident evidence](https://github.com/ramideltoro/nutsnews-infra/issues/474#issuecomment-5153075316): 28 messages, 84 retries, zero publication success, and stale public content |
| Partial rollback | [Backend run 30715252632](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30715252632): prepare complete, generation 4 rollback-pending, finalize missing |
| Legacy scheduling | [Worker run 30715293972](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715293972): deploy succeeded, immediate verification raced propagation, public state later true |
| Verified legacy scheduling | [Worker run 30715590990](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715590990) and [status run 30715611673](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715611673) passed |
| Completed rollback | [Backend run 30715566651](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30715566651): stable shadow generation 5, legacy owner/dispatch restored, single-writer and DNS checks pass |
| Backend mutation guard | [Backend PR #482](https://github.com/ramideltoro/nutsnews-backend/pull/482), merge `510b775d7962e2e66d430fb6d458c3c88d60cdd3`; source-only |
| Publication-contract repair | [Backend PR #483](https://github.com/ramideltoro/nutsnews-backend/pull/483), merge `5531014000f52fd6101f8617463d5f2c887d0788`; source-only, no replay |
| Pre-freeze Grafana baseline | [Apply 30708192621](https://github.com/ramideltoro/nutsnews-infra/actions/runs/30708192621): five synthetics on two probes every 300 seconds plus populated host/RabbitMQ/Loki queries; later hardening remains frozen |
| Synthetic forecast acknowledgment | Protected standing-major acknowledgment verified `true` at 2026-08-01 20:29:46 UTC; no apply or check-shape change |

For a new incident or readiness decision, record workflow name, run ID, source commit, conclusion, environment, action class, artifact name, digest, observation window, owner mode, production-write state, service health, versions, consumer counts, queues, retries, DLQs, drain result, database and backup evidence, Grafana freshness, SLOs, quotas, alerts, host headroom, DNS controller status, and each failed check or explicit residual-risk decision.

## Completion checklist

- [ ] Stable `shadow` generation 5 is recorded with `legacy_shards` owner, legacy dispatch and scheduling true, uplift scheduler true in shadow, uplift writes false, publication shadow, and null observation timestamps.
- [ ] Public legacy scheduling is verified true by successful apply and status artifacts.
- [ ] Single-writer and DNS checks pass.
- [ ] The failed candidate is disqualified and quarantined.
- [ ] Backend PRs #482 and #483 are treated as source safeguards, not deploy,
      replay, or qualification evidence.
- [ ] The unfinished worker deploy guard and infra verifier remain frozen.
- [ ] Cutover, rollback, and finalize are not rerun.
- [ ] The observation window is recorded as never started.
- [ ] Every read-only report artifact was inspected.
- [ ] No frozen mutation ran.
- [ ] All eight services are healthy with required consumers.
- [ ] Queue, retry, DLQ, and drain evidence is recorded.
- [ ] PostgreSQL outbox, watermark, backup, and reconciliation evidence agrees.
- [ ] Grafana and admin evidence stayed read-only.
- [ ] DNS failover controller state and ownership are unchanged.
- [ ] Missing apply paths or proof are recorded as readiness blockers.
- [ ] No secret value, message payload, or improvised manual mutation appears in the evidence.
