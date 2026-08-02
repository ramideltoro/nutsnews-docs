---
title: "NutsNews Worker-Uplift Incident and Rollback Record"
description: "Current operator guide for the completed worker-uplift rollback, stable shadow baseline, quarantined failed candidate, read-only evidence, and frozen mutation boundaries."
wiki:
  source_route: "/technical/nutsnews-worker-uplift-operations-cutover-guide"
  simple_route: "/simple/nutsnews-worker-uplift-operations-cutover-guide"
  slug: "nutsnews-worker-uplift-operations-cutover-guide"
  primary_diagram:
    file: "diagrams/NUTSNEWS_WORKER_UPLIFT_OPERATIONS_CUTOVER_GUIDE.mmd"
    accTitle: "Worker-uplift cutover incident and recovery boundary"
    accDescr: "The failed cutover rolled back to stable generation 5 shadow with legacy ownership and scheduling restored, uplift writes disabled, observation never started, and the failed publication candidate quarantined while unrelated mutations remain frozen."
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

This is the as-built operator guide for
[`ramideltoro/nutsnews-worker#149`](https://github.com/ramideltoro/nutsnews-worker/issues/149).
It tells an operator what can be observed now, which protected workflow owns
the cutover rollback, which mutations are frozen, and which historical
procedures must not be mistaken for current authorization.

> **Current incident override (2026-08-01).** The protected transition in
> [backend run 30713923790](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30713923790)
> unexpectedly changed production while Runtime 1 qualification was still in
> progress. Publication then failed: 28 messages
> produced 84 `handler-error` retries, all 28 were ready in
> `nutsnews.worker.publication.v1.retry-30m`, and no publication succeeded.
> There was no post-cutover public publication, so the 15-minute freshness
> abort threshold was breached. The observation window **never started**.
> The [central incident evidence](https://github.com/ramideltoro/nutsnews-infra/issues/474#issuecomment-5153075316)
> triggered operator-controlled rollback in
> [backend run 30715252632](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30715252632).
> Rollback prepare succeeded, then the run failed before finalize. The
> controller deploy in
> [worker run 30715293972](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715293972)
> succeeded, but its immediate verifier saw the old value and failed. Scheduling
> was then successfully applied and verified by
> [worker run 30715590990](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715590990)
> and [status run 30715611673](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715611673).
> Protected backend run
> [30715566651](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30715566651)
> completed rollback finalize. The authoritative row is now stable `shadow`
> generation 5 with owner `legacy_shards`, legacy dispatch true, uplift
> scheduler true in shadow, uplift production writes false, publication shadow,
> null observation timestamps, and single-writer and DNS checks passing. No
> automatic rollback, recovery replay, or operator queue replay ran.

> **Backend source hardening.** Backend
> [`PR #482`](https://github.com/ramideltoro/nutsnews-backend/pull/482), merge
> `510b775d7962e2e66d430fb6d458c3c88d60cdd3`, records the immutable execution
> receipt, consumes the historical apply/rollback/resume authority, and
> fail-closes protected Ansible and generic runtime mutations against the exact
> maintenance-safe shadow row. Backend
> [`PR #483`](https://github.com/ramideltoro/nutsnews-backend/pull/483), merge
> `5531014000f52fd6101f8617463d5f2c887d0788`, hardens the forward publication
> API to require one real URL, `published` state, five-language scope, exact
> one-row confirmation, and stable command idempotency. These are source-only
> merges. No host/runtime deployment, Runtime 1 rollout, queue replay, or
> failed-candidate rehabilitation occurred. The worker deploy guard and infra
> verifier remain unfinished and frozen.

> **Freeze.** Until incident reconciliation and the unfinished worker deploy
> guard and infra verifier are complete, use read-only evidence workflows only.
> Do not merge or ordinarily deploy the worker, run backend Ansible or generic
> runtime mutations, repeat cutover apply, deploy Runtime 1 or fetcher v2, apply
> Grafana, roll out synthetics, merge the web change, replay queues, or mutate
> reconciliation state. The generic runtime `rollback` action is not the
> cutover rollback. Do not rerun cutover, rollback, or finalize: the rollback is
> complete. The failed Runtime 0.x publication candidate is disqualified and
> quarantined.

## Operating contract

### Current state

| Control | Verified incident state |
| --- | --- |
| Production ingestion owner | `legacy_shards` |
| Cutover control state | Stable `shadow`, generation 5 |
| Uplift production writes | `false` |
| Uplift scheduler | `true` in shadow mode |
| Publication mode | `shadow` |
| Legacy dispatch | `true` |
| Public legacy scheduling | `true`, verified by runs 30715590990 and 30715611673 |
| Failed candidate | Older Runtime 0.x digest `71b0303705093ad398458083547a86e9e61f50458e8799ace38de4f2404859df`; disqualified and quarantined |
| Runtime 1 | Published, but [backend PR #471](https://github.com/ramideltoro/nutsnews-backend/pull/471) is `DIRTY`/conflicting and undeployed; it must reconcile PR #483, authoritative generation 5 ownership, and a separate exact-eight runtime-container recreation step |
| Backend source guards | PRs [#482](https://github.com/ramideltoro/nutsnews-backend/pull/482) and [#483](https://github.com/ramideltoro/nutsnews-backend/pull/483) merged; source-only, with no host/runtime deployment or replay |
| Remaining source blockers | Worker deploy guard and infra verifier are unfinished and frozen |
| Rollback progress | Complete in backend run 30715566651; last transition `rollback-finalize` |
| Failed-candidate/cutover publication evidence | 28 messages, 84 retries, 28 ready in the 30-minute retry queue, zero success |
| Cutover freshness evidence | No post-cutover publication; 15-minute abort threshold breached |
| Observation | Never started; abort criteria were met |
| Writer safety | Single-writer check passed; no dual writer |
| DNS safety | DNS invariant check passed |
| Immediate posture | Preserve stable shadow; quarantine failed candidate; all unrelated mutations remain frozen |
| Services | scheduler, fetcher, canonicalizer, enrichment, approval, translation, persistence, publication |
| Durable transport | RabbitMQ on the backend host |
| Authoritative state | Backend PostgreSQL control row, stage schemas, outboxes, and watermarks |
| Runtime status caveat | Static manifest projection remains supporting evidence; the generation 5 finalize artifact is authoritative |
| Final public writes | Uplift production writes disabled; legacy dispatch restored |
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
| Host configuration | backend | Read-only drift/evidence only; Ansible apply frozen |
| Service status, logs, and queue inspection | backend | Read-only actions in `Backend Worker Runtime Operations` |
| Service deploy, restart, scale, generic rollback, drain, replay, and reconciliation | backend | Frozen during this incident; generic runtime rollback is not cutover rollback |
| RabbitMQ status, topology export, and disposable recovery drills | backend | Read-only status/topology evidence only; rebuild and recovery drills frozen |
| RabbitMQ failure drills and isolated smoke | backend | Read-only retained artifacts only; canary fixtures and smoke mutations frozen |
| PostgreSQL backup and isolated restore proof | backend | Read-only backup status/artifact evidence only; backup and restore mutations frozen |
| Credential inventory and readiness | backend | Read-only readiness evidence only; value changes and runtime application frozen |
| Grafana dashboards, alerts, folders, quotas, and drift | infra | Read-only evidence only; `Grafana Cloud Apply` is frozen |
| DNS failover controller and DNS-write state | infra | Read-only status/evidence only; DNS apply and writes frozen by this incident boundary |
| Legacy ingestion scheduling and its retained failover-controller surfaces | legacy worker | Read-only status only; scheduling is verified `true` |
| Admin worker-uplift projection | web app | reviewed application deployment; no broker or Grafana management access |
| Reversible ingestion controls | backend | Rollback is complete; no cutover, rollback, or finalize rerun is authorized |

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
| Dry run or plan | Builds and validates an intended operation without applying it | Historical capability; do not use it to widen the current read-only incident boundary |
| Protected mutation | Changes service, host, test fixture, backup, or managed cloud state | Frozen; rollback has completed |
| Unavailable or blocked | No approved current incident path | duplicate cutover apply, generic runtime rollback, deploy/restart/scale/drain, replay, reconciliation mutation, Ansible apply, Grafana apply, synthetics, web merge, Runtime 1, and fetcher v2 |

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
- Reversible cutover controls are additive backend commits
  [`9c58c44c267cc1a82c450ee3468932d82c1c25fc`](https://github.com/ramideltoro/nutsnews-backend/tree/9c58c44c267cc1a82c450ee3468932d82c1c25fc)
  and
  [`4a86fcb85a94f3821ee4ebe804c62cf2dab1bee7`](https://github.com/ramideltoro/nutsnews-backend/tree/4a86fcb85a94f3821ee4ebe804c62cf2dab1bee7).
  They add the
  [fixed protected workflow](https://github.com/ramideltoro/nutsnews-backend/blob/4a86fcb85a94f3821ee4ebe804c62cf2dab1bee7/.github/workflows/backend-worker-uplift-cutover-controls.yml),
  [machine-enforced contract](https://github.com/ramideltoro/nutsnews-backend/blob/4a86fcb85a94f3821ee4ebe804c62cf2dab1bee7/docs/worker-uplift-cutover-controls.json),
  [fail-closed final decision](https://github.com/ramideltoro/nutsnews-backend/blob/4a86fcb85a94f3821ee4ebe804c62cf2dab1bee7/docs/worker-uplift-final-cutover-decision.json),
  and
  [operator runbook](https://github.com/ramideltoro/nutsnews-backend/blob/4a86fcb85a94f3821ee4ebe804c62cf2dab1bee7/runbooks/WORKER_UPLIFT_CUTOVER_CONTROLS.md).
- Post-incident backend source guards are merged in
  [`510b775d7962e2e66d430fb6d458c3c88d60cdd3`](https://github.com/ramideltoro/nutsnews-backend/tree/510b775d7962e2e66d430fb6d458c3c88d60cdd3)
  and
  [`5531014000f52fd6101f8617463d5f2c887d0788`](https://github.com/ramideltoro/nutsnews-backend/tree/5531014000f52fd6101f8617463d5f2c887d0788).
  They preserve the completed rollback receipt, consume historical authority,
  guard future protected mutations, and repair the forward publication
  contract. They do not deploy or replay anything. The worker deploy guard and
  infra verifier are not included and remain blocked work.
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

Treat the report as supporting service evidence only. The current static
manifest projection incorrectly shows `mode=shadow` and
`production_writes_enabled=false`; it does not override the authoritative
control row. Cross-check the row, cutover artifact, public scheduling status,
service health, consumers, queue state, retries, DLQs, and publication outcome.

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

Grafana changes normally follow `Grafana Cloud Plan`, reviewed Terraform, then
`Grafana Cloud Apply`. During the post-rollback freeze, Grafana apply and
synthetic rollout are frozen. A dashboard edit in the Grafana UI is not a
durable change and must not be used as an incident workaround.

## Historical capability reference: dry runs and plans

The procedures from this heading through credential rotation describe tested
capabilities, not current authorization. During the post-rollback freeze, use only
read-only status, logs, queue inspection, and immutable evidence. Do not run
Ansible check/apply, runtime dry-run or mutation, Grafana plan/apply, deploy,
restart, scale, drain, generic rollback, replay, reconciliation, smoke, broker
drill/rebuild, restore drill, or credential rotation. Rollback is complete; no
cutover-control mutation is authorized.

### Host configuration

Outside the freeze, `Protected Backend Ansible Apply` supports
`run_mode=check`, followed by a separately reviewed apply. Neither mode is
authorized during this post-rollback freeze.

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

After the freeze, use `Grafana Cloud Plan` before any Grafana apply. Use `Cloudflare DNS
Failover Apply` with `run_mode=plan` and `dns_writes_enabled=false` to validate
the controller bundle. A DNS plan is unrelated to worker cutover and must not
be bundled into a worker-uplift change.

## Historical capability reference: protected service changes

All commands in this section are mutations and are frozen. They may be used
only after a new reviewed authorization; none may rerun the completed cutover
or rollback.

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

## Historical capability reference: DLQ and reconciliation

Queue and DLQ inspection remain read-only. Every replay, deploy, and
reconciliation plan or apply described below is frozen until rollback finalize
and a new recovery decision.

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

The following apply example is historical and frozen during the incident. It
may be used only after rollback and a separately reviewed reconciliation
decision:

```bash
gh workflow run backend-worker-runtime-operations.yml \
  --repo ramideltoro/nutsnews-backend \
  --ref main \
  -f action=reconciliation \
  -f service_name=<service> \
  -f dry_run=false \
  -f confirm_target=backend.nutsnews.com
```

When the freeze is eventually lifted, the apply must match the authoritative
owner and write gate rather than the stale static manifest. Record plan count,
applied count, new message identifiers, duplicate-effect count, public
visibility, queue drain, and post-run DLQ change.

## Historical capability reference: RabbitMQ recovery and empty-broker procedure

This whole procedure is frozen during the post-rollback hold. After a separately
authorized broker incident, use PostgreSQL state, not live broker files, as the
recovery anchor.

1. Declare the incident and preserve the authoritative cutover evidence.
2. Run runtime `status`, queue/DLQ inspection, RabbitMQ recovery `status`, host
   health, and Grafana checks.
3. During the current freeze, do not use the protected restart procedure.
4. After the freeze, if broker configuration drifted, correct backend source
   control and use the protected Ansible path.
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
9. After rollback and explicit recovery authorization, run the approved smoke
   and prove queue drain, idempotent effects, stable retry/DLQ counts, and that
   runtime projections agree with the authoritative control row.

`export-definitions`, `clean-rebuild-drill`, and
`stopped-volume-restore-drill` are protected evidence actions. The drills use
disposable or stopped test targets; they are not permission to overwrite the
live broker.

## Historical capability reference: backup restore

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

## Historical capability reference: credential rotation

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
| Broker unavailable | runtime status, recovery status, metrics, host health | preserve stable generation 5 shadow and rollback evidence | frozen during the post-rollback hold unless the incident owner separately authorizes bounded recovery | broker healthy, topology and permissions valid, all consumers restored, queue drains |
| PostgreSQL outage | stage health, API health, logs, backup status | preserve stable shadow and broker state; do not acknowledge work that cannot commit | database recovery and isolated restore proof are frozen absent separate incident-owner authorization | DB health, watermarks/outboxes consistent, and new reviewed recovery evidence |
| Qwen/provider outage | approval/translation health, logs, retry/DLQ trends, credential readiness | preserve evidence; uplift scheduler remains enabled in shadow with production writes disabled | recovery mutation frozen | provider probe healthy after rollback finalize and new authorization |
| Backlog or oldest-age growth | queue depth/age, publish/ack rates, consumers, p95, host headroom | preserve queues and evidence; do not replay | restart, scale, and deploy are frozen | new reviewed recovery decision after finalize |
| Poison message or DLQ growth | DLQ metadata, safe error code, stage/outbox state | stop automated replay and preserve metadata | replay and reconciliation are frozen | new reviewed recovery decision after finalize |
| Telemetry loss | metrics check, logs check, runtime status, queue inspection | do not infer broker failure or widen the incident | Grafana/backend mutations are frozen | fresh data after rollback finalize and new authorization |
| Failed publication | publication health/logs, DB API health, outbox/watermark, queue/DLQ | preserve abort evidence and quarantine the failed candidate | cutover rollback is complete; deploy, runtime rollback, replay, and reconciliation remain frozen | stable shadow row, legacy dispatch and scheduling true, no dual writer; candidate stays disqualified until a new reviewed qualification |
| Zero consumers or dropped channel | `/ready`, runtime status, main queue consumers, cancellation/reconnect logs | preserve stable shadow; do not change the shadow scheduler under this guide | restart and deployment recovery are frozen | new reviewed recovery decision after finalize |

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

`ramideltoro/nutsnews-infra` under `cloudflare-admin` remains the owner path for
a future authorized DNS plan/apply. During this hold, use read-only status and
evidence only; do not run DNS apply or manual controller actions. Any later
authorized manual action requires the protected admin boundary and confirmation
bodies described in the immutable infra runbook. This guide intentionally does
not reproduce tokens or direct API commands.

## Historical pre-cutover sequence

The following records the pre-cutover design and is **not** a current action
plan. The cutover ran on the older Runtime 0.x candidate, met publication and
freshness abort criteria, and then rolled back to stable shadow. Do not execute
these phase steps during the freeze.

### Phase 0: Historical coexistence baseline

- Legacy worker owned production ingestion.
- Uplift services processed shadow-only work.
- Production writes were false.
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

Issue #126 implemented fixed protected controls without performing a cutover.
The state machine is `shadow → fenced → cutover_active → rollback_pending →
shadow`. Its sole database target is the `production` row in
`worker_uplift_final.cutover_control`; a dedicated least-privilege role can
select that row and compare-and-swap fixed columns, but cannot insert, delete,
truncate, change schemas, write domain tables, mutate queues, or alter its
audit rows. Database constraints and a security-definer transition/audit
trigger enforce the single-writer state graph and reject stale generations.

Uplift API production commands require all environment flags plus the
database row for the same exact candidate and watermark. A missing, stale, or
mismatched row fails closed. Before cutover, the deployed safe row was:

- `state=shadow`;
- `active_ingestion_owner=legacy_shards`;
- `legacy_dispatch_enabled=true`;
- `uplift_scheduler_enabled=true` in shadow mode;
- `uplift_production_writes_enabled=false`.

The owner standing authorization on #126 removes new per-release, first-run,
and routine environment-wait approval only for source-validated `preflight`,
`dry-run`, `rehearse`, `verify`, and safe control deployment. The validator
pins that scope to digest
`17dffe06f80ec9266761a84a2c738517c57da31e57ad8936dce16d003c021804`
and fails closed if the operations, confirmations, environment, target, role,
safe state, or exclusions change. It does not authorize #166 GO, #127
execution, production writes, an ownership switch, legacy-ingestion disable,
DNS/failover/Cloudflare changes, arbitrary SQL, secret retrieval, or residual
risk acceptance.

The implemented controls cover:

- production-owner state;
- scheduler pause/resume;
- production-write enable/disable;
- a cutover watermark and evidence artifact;
- rollback eligibility and stop conditions;
- independent DNS-failover invariants.

Use the exact confirmations `plan-worker-uplift-cutover`,
`rehearse-worker-uplift-rollback`,
`inspect-worker-uplift-cutover-controls`, or
`verify-worker-uplift-cutover-controls` for non-mutating evidence. Download
`cutover-control-report.json` and `SHA256SUMS`, verify the portable checksum,
and inspect the report. The protected apply and rollback modes require the
separate source-controlled #166 GO for the exact candidate, watermark,
deadline, control commit, #127 execution issue, and named approver. The
runtime `promote` action is not a substitute.

### Phase 4: Historical cutover watermark plan

The pre-cutover plan required:

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

This was the prior source-controlled gate. The live transition later executed
on the older Runtime 0.x candidate; the abort evidence and completed rollback now
supersede this historical authorization text.

### Phase 5: Historical protected switch plan

The protected switch executed in backend run 30713923790. Legacy ingestion was
placed in standby, public legacy scheduling was disabled, and DNS failover
remained separate. Publication failure means the transition must not be called
successful.

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

### Phase 6: Completed rollback

The observation window never started. Publication failure and freshness beyond
15 minutes met the documented abort criteria. Rollback prepare completed in
backend run 30715252632. Legacy scheduling was then verified true by worker
runs 30715590990 and 30715611673. Backend run 30715566651 completed finalize at
19:48:53 UTC, producing stable `shadow` generation 5 with legacy ownership and
dispatch restored, uplift scheduler true in shadow, uplift writes false,
publication shadow, null observation timestamps, and single-writer/DNS checks
passing. Do not rerun cutover, rollback, or finalize. The failed publication
candidate remains disqualified and quarantined.

### Phase 7: Decommission and final documentation

Do not retire legacy ingestion. Issue #128 remains blocked because the
observation window never started and the failed candidate is quarantined.
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
| Live cutover transition | [backend run 30713923790](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30713923790), older Runtime 0.x candidate `71b0303705093ad398458083547a86e9e61f50458e8799ace38de4f2404859df` |
| Cutover abort evidence | [central incident comment](https://github.com/ramideltoro/nutsnews-infra/issues/474#issuecomment-5153075316): 28 publication messages, 84 handler-error retries, retry-30m ready depth 28, zero publication success, and no post-cutover public freshness |
| Partial rollback | [backend run 30715252632](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30715252632): prepare succeeded, generation 4 `rollback_pending`, uplift writes and scheduler false, publication shadow, legacy dispatch false, finalize not run |
| Legacy scheduling propagation | [worker run 30715293972](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715293972): deploy succeeded and immediate verifier failed on stale false; public endpoint later converged to true with valid configuration |
| Verified legacy scheduling | [worker run 30715590990](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715590990), artifact `8823228760`, digest `sha256:139d8ced652948c8cfcb1703f6b2fde2490f3456cea2711f59db8bbe5a37eb9c`; [status run 30715611673](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715611673), artifact `8823231793`, digest `sha256:d4e5624b00b7e1157489d534db9dc6a9ede21cdc2152897adc1ec1efede1cb56` |
| Completed rollback | [backend run 30715566651](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30715566651), artifact `8823224422`, digest `sha256:99e295d6c5d92c310010590757b4b1c9535798401c19f971c67383464fe81d8c`, report SHA-256 `1e7fd8df881efaaeb73aca2539caa21423a9de74abd9fe8a2a84743a46e72c6b` |
| Consumed authority and guarded backend mutations | Backend [PR #482](https://github.com/ramideltoro/nutsnews-backend/pull/482), merge `510b775d7962e2e66d430fb6d458c3c88d60cdd3`; source-only, no deployment |
| Forward publication-contract repair | Backend [PR #483](https://github.com/ramideltoro/nutsnews-backend/pull/483), merge `5531014000f52fd6101f8617463d5f2c887d0788`; source-only, no deployment or replay |
| Pre-freeze Grafana baseline | [Grafana Cloud Apply 30708192621](https://github.com/ramideltoro/nutsnews-infra/actions/runs/30708192621), commit `c23403e41d42595fdef3e26cd9965bd480c5b9ea`: five synthetics, two probes, 300 seconds, 28 dashboards, 11 backend alerts, 20 worker alerts, populated host/RabbitMQ/Loki queries; later PR #473/SLO/canary/drill work remains frozen |
| Synthetic forecast acknowledgment | Protected variable `NUTSNEWS_GRAFANA_SYNTHETIC_MAJOR_FORECAST_ACKNOWLEDGED=true` set and verified at 2026-08-01 20:29:46 UTC; records the live 86,400 standing-major forecast without applying Grafana resources or changing checks |

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

- [ ] The authoritative finalize artifact records stable `shadow` generation 5,
      owner `legacy_shards`, legacy dispatch true, uplift scheduler true in
      shadow, uplift writes false, publication shadow, and null observation
      timestamps.
- [ ] Public legacy scheduling is independently verified true by successful
      apply and status artifacts.
- [ ] Single-writer and DNS invariant checks pass.
- [ ] The 28-message, 84-retry, zero-success publication failure and freshness
      breach remain preserved as abort evidence.
- [ ] The observation window is recorded as never started.
- [ ] The failed Runtime 0.x publication candidate is disqualified and
      quarantined.
- [ ] Backend PRs #482 and #483 are recorded as merged source safeguards, not
      deployment, replay, or qualification evidence.
- [ ] The unfinished worker deploy guard and infra verifier remain frozen.
- [ ] Cutover, rollback, and finalize are not rerun.
- [ ] No automatic rollback, recovery replay, or operator queue replay is
      claimed.
- [ ] Every read-only report artifact was inspected.
- [ ] No prohibited runtime, queue, Grafana-resource, synthetic-shape, or web
      mutation ran after finalize; the non-deploying forecast acknowledgment is
      recorded separately.
- [ ] All eight services are healthy with required consumers.
- [ ] Queue, retry, DLQ, and drain evidence is recorded.
- [ ] PostgreSQL outbox, watermark, backup, and reconciliation evidence agrees.
- [ ] The pre-freeze Grafana baseline apply is distinguished from the
      post-rollback freeze; no further Grafana apply, synthetic mutation, or web
      merge ran during the freeze.
- [ ] DNS failover controller state and ownership are unchanged.
- [ ] Missing apply paths or proof are recorded as readiness blockers.
- [ ] No secret value, message payload, or improvised manual mutation appears
      in the evidence.
