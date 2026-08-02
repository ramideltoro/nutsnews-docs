---
wiki:
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 146bd6290c2a782a5d343f5b9e2a73be04a666f889cffc1300b47229a0525621
---
# Observability

NutsNews is built with observability from the start.

A fully automated system needs visibility. If no human manually publishes every article, the platform needs to explain what it is doing.

---

## Observability Layers

NutsNews uses multiple observability layers:

| Layer | Purpose |
| --- | --- |
| Admin Portal | Internal operational dashboards |
| AI Usage Dashboard | OpenAI usage and cost visibility |
| Worker Shard Dashboard | Worker health and failed run visibility |
| Feed Health Dashboard | RSS source quality visibility |
| Better Stack Uptime | External availability monitoring |
| UptimeRobot | Additional external availability, keyword, API, and public page monitoring |
| Lighthouse CI | GitHub Actions quality checks for public web performance, accessibility, SEO, best practices, and Core Web Vitals-style regressions |
| Better Stack Logs | Existing app/Worker structured log searches until those repos migrate |
| Grafana Cloud | Existing host/log visibility plus a live five-check synthetic baseline; later application hardening, managed alert email, four native SLOs, canary/drill evidence, and post-incident verification remain pending |
| Backend Health Report | Daily read-only backend host report from GitHub Actions with JSON artifact and optional SMTP delivery |
| Sentry | Application error monitoring |
| Cloudflare | CDN and Worker visibility |
| Cloudflare Cache Observability | Expected-vs-actual cache header dashboard, scheduled checks, and GitHub Actions alerting |
| Vercel | Deployment and frontend runtime visibility |
| Supabase | Database state and operational tables |

---

## Centralized Logging

NutsNews infrastructure logs are centralized in Grafana Cloud Logs through
Grafana Alloy on the VPS. The infra repo owns the host-side pipeline for
systemd journal logs, auth/security logs, Caddy JSON access/error logs,
Docker/Compose logs for NutsNews runtime containers, backup/reporting logs, and
Ops Portal logs. The exact normalization contract below is source-staged in the
observability hardening work and still requires protected apply plus recent
Loki evidence.

The staged Alloy boundary normalizes indexed Loki labels to exactly:

```text
deployment_environment
service
service_version
host
source
severity
```

Keep request, message, correlation, trace, article, feed, idempotency, raw IP,
user, dynamic-path, and arbitrary-error values out of indexed labels. Query safe
`pipelineRunId`, `correlationId`, and `traceparent` values as parsed fields or
structured metadata. The source-controlled pipeline dashboard may use bounded
table field links for its logs-only drilldown; true hosted-Loki datasource or
per-row derived links remain deferred because taking ownership of the managed
datasource could overwrite its connection settings. Tempo remains disabled.

The older app/Worker Better Stack searches remain useful until those application repositories explicitly migrate their runtime logging. Do not treat an infra-only PR as an app logging migration.

Existing app/Worker service names:

```text
nutsnews-web
nutsnews-worker
nutsnews-controller
```

Important log fields:

| Field | Purpose |
| --- | --- |
| `severity` | Severity such as info, warning, error, or critical |
| `service` | Which part of the platform created the log |
| `event` | What happened |
| `message` | Human-readable summary |
| `deployment_environment` | Production, preview, or local |
| `shardIndex` | Which Worker shard produced the log |
| `durationMs` | How long an operation took |
| `status` | Request or operation status |
| `acceptedCount` | Number of accepted articles |
| `rejectedCount` | Number of rejected articles |

---

## Better Stack Uptime

Better Stack Uptime checks whether the public site is reachable from outside the platform.

Use it to answer:

```text
Is the site reachable?
```

---

## UptimeRobot

UptimeRobot is an additional external monitoring layer for simple public uptime and content checks.

Recommended first monitors:

| Monitor name | Type | URL |
| --- | --- | --- |
| `NutsNews Website` | HTTP(s) | `https://www.nutsnews.com` |
| `NutsNews Homepage Content` | Keyword | `https://www.nutsnews.com` |
| `NutsNews Articles API` | HTTP(s) or API GET | `https://www.nutsnews.com/api/articles?limit=1` |
| `NutsNews Privacy Page` | HTTP(s) | `https://www.nutsnews.com/privacy` |
| `NutsNews Contact Page` | HTTP(s) | `https://www.nutsnews.com/contact` |

The homepage keyword monitor should alert when this keyword is missing:

```text
NutsNews
```

Important safety rule: do not monitor refresh-triggering Worker or controller URLs such as `/?limit=1` or `/?shard=0`. Those URLs can run production ingestion work. Only add Worker/controller monitors after safe read-only `/health` routes exist.

Detailed setup lives in:

```text
docs/UPTIMEROBOT_ONBOARDING.md
```

## Lighthouse CI

Lighthouse CI is the automated web quality gate for NutsNews public pages.

It runs in GitHub Actions and checks:

* Performance
* Accessibility
* Best practices
* SEO
* Largest Contentful Paint
* Cumulative Layout Shift
* Total Blocking Time

Repository-layout rule:

```text
GitHub Actions workflow: .github/workflows/lighthouse-ci.yml
Lighthouse config: web/lighthouserc.js
NPM install/build/start commands: run from web/
```

Recommended first audited URLs:

```text
http://localhost:3000/
http://localhost:3000/privacy
http://localhost:3000/contact
```

Do not audit Worker refresh URLs, controller trigger URLs, admin pages, OAuth routes, or any route that can perform ingestion, AI review, translation, refresh work, database writes, or authenticated work.

Detailed setup lives in:

```text
docs/LIGHTHOUSE_CI_ONBOARDING.md
```

## axe Playwright Accessibility CI

axe Playwright Accessibility CI answers:

```text
Did a public NutsNews page introduce a serious or critical automated accessibility regression?
```

It runs from GitHub Actions using Playwright and `@axe-core/playwright`.

Checked pages:

```text
http://127.0.0.1:3100/
http://127.0.0.1:3100/about
http://127.0.0.1:3100/privacy
http://127.0.0.1:3100/contact
```

Repository-layout rule:

```text
GitHub Actions workflow: .github/workflows/accessibility-ci.yml
Playwright config: web/playwright.config.ts
axe test file: web/tests/accessibility.spec.ts
NPM install/build/test commands: run from web/
```

The first threshold fails on only serious and critical axe violations. This keeps CI practical while still catching the issues most likely to hurt launch quality, App Store review polish, and reader usability.

Do not audit Worker refresh URLs, controller trigger URLs, admin pages, OAuth routes, or routes that can perform ingestion, AI review, translation, refresh work, database writes, or authenticated work.

Detailed setup lives in:

```text
docs/AXE_PLAYWRIGHT_ACCESSIBILITY_CI.md
```

Manual WAVE browser-extension checks should still be run before App Store review and major public launches.

## Better Stack Logs

Better Stack Logs answer:

```text
What happened inside the app, Worker, or controller while those repos still use Better Stack?
```

Useful searches:

```text
service:nutsnews-web
service:nutsnews-worker
service:nutsnews-controller
level:error
shardIndex:0
event:api.log_test.completed
```

---

## Grafana Cloud

Grafana Cloud currently provides Prometheus-style host metrics, Loki logs,
dashboards, alert rules, and five live read-only Synthetic Monitoring checks.
Pre-freeze Grafana Cloud Apply
[`30708192621`](https://github.com/ramideltoro/nutsnews-infra/actions/runs/30708192621)
succeeded from commit `c23403e41d42595fdef3e26cd9965bd480c5b9ea` with
exactly five checks, two probes, and a 300-second cadence. Its retained
post-apply report passed with 28 dashboards, 11 backend alerts, 20 worker
alerts, and populated host, RabbitMQ, and Loki queries. The live shape projects
86,400 monthly executions. At 2026-08-01 20:29:46 UTC, the protected variable
`NUTSNEWS_GRAFANA_SYNTHETIC_MAJOR_FORECAST_ACKNOWLEDGED=true` was set and
verified, accepting the standing major while preserving the warning and 90,000
ceiling. PR #473 application/alert hardening, four native SLOs, the notification
canary, controlled mismatch/failure drills, and post-incident re-verification
remain unapplied and frozen.

The exact-`main` `grafana-observability-readonly` Environment exists but its
two variables and two secrets are still absent. Production writer inputs and
Environment reviewer/protection gates also remain operator work. Worker
Contracts and Runtime `1.0.0` have been released in order; all eight worker
service PRs are merged and verified immutable Runtime 1 images are published.
Backend PR [`#471`](https://github.com/ramideltoro/nutsnews-backend/pull/471)
pins those images but is now `DIRTY`/conflicting with current main and remains
undeployed. It must reconcile the PR #483 Worker API conflict, replace mutable
ownership/`expected_active` inputs with the authoritative generation 5 row, and
provide a separate runtime-container recreation path so the exact-eight identity
gate can converge. Image publication is not live telemetry.

The current ingestion state is stable generation 5 shadow after a completed
rollback. The cutover used older
Runtime 0.x candidate
`71b0303705093ad398458083547a86e9e61f50458e8799ace38de4f2404859df`
and met publication/freshness abort criteria before observation started.
[Backend run 30715252632](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30715252632)
completed rollback prepare but failed before finalize. Legacy scheduling was
verified true by worker runs
[30715590990](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715590990)
and [30715611673](https://github.com/ramideltoro/nutsnews-worker/actions/runs/30715611673).
Backend run
[30715566651](https://github.com/ramideltoro/nutsnews-backend/actions/runs/30715566651)
completed finalize. The authoritative row is stable `shadow` generation 5,
owner `legacy_shards`, legacy dispatch true, uplift scheduler true in shadow,
uplift writes false, publication shadow, observation timestamps null, and
single-writer/DNS checks passing.
These ingestion-control runs do not themselves prove Grafana state. The
separate pre-freeze apply proves the baseline inventory and populated queries;
it does not prove post-incident synthetic health, native SLO activation,
notification receipt, or controlled failure-drill behavior.

Retained
[abort-threshold evidence](https://github.com/ramideltoro/nutsnews-infra/issues/474#issuecomment-5153075316)
records 28 publication messages, 84 `handler-error` retries, no publication
success, 28 ready messages in the 30-minute retry queue, and no post-cutover
public freshness. The observation window never started. Rollback completed
through the protected finalize run. No automatic rollback, recovery replay, or
operator queue replay ran. The failed Runtime 0.x candidate is disqualified and
quarantined.

Backend source hardening is partly complete. Backend
[`PR #482`](https://github.com/ramideltoro/nutsnews-backend/pull/482), merge
`510b775d7962e2e66d430fb6d458c3c88d60cdd3`, records the immutable incident
receipt, consumes the historical cutover authority, and fail-closes protected
Ansible and generic runtime mutations against the exact maintenance-safe shadow
row. Backend [`PR #483`](https://github.com/ramideltoro/nutsnews-backend/pull/483),
merge `5531014000f52fd6101f8617463d5f2c887d0788`, hardens the forward
publication API contract and idempotency semantics. These are source-only
merges: no host/runtime deployment, Runtime 1 rollout, queue replay, or failed-
candidate rehabilitation occurred. The worker deploy guard and infra verifier
remain unfinished and frozen.

The effective safety freeze remains until incident reconciliation and those
unfinished guards are complete: no worker merge/ordinary deploy, backend
Ansible or generic runtime mutation, duplicate cutover/rollback/finalize,
Runtime 1/fetcher v2, Grafana apply, synthetic rollout, web merge, queue replay,
or reconciliation mutation. Rollback is complete; no cutover-control mutation
is authorized. Read-only evidence collection does not remove these freezes.

Worker-uplift telemetry is governed by [NutsNews Worker-Uplift Telemetry Scope](NUTSNEWS_WORKER_UPLIFT_TELEMETRY_SCOPE.md). RabbitMQ metrics, worker service metrics, and structured logs are required; full traces and exemplars are deferred; article/model payload telemetry is forbidden.

The source-staged qualification baseline uses
`nutsnews_worker_expected_active=0` for non-owning services, but rollout must
reconcile each ownership signal with stable generation 5 shadow. The
ownership gate never hides structural telemetry failures: scheduler, fetcher,
canonicalizer, enrichment, approval, translation, persistence, and publication
must all be deployed with `up == 1`, scrape age below 180 seconds, exact
non-`unknown` build/deployment identity, and readiness series. A service with
`expected_active=1` must additionally report successful readiness, loop/cycle
or delivery-stage activity as applicable, last success, and worker-local paging
eligibility.

Producer ownership is explicit. `nutsnews-backend` owns worker deployment,
backend Alloy, and backend-hosted ownership and outbox gauges. Each split-worker
repository owns its own service identity, health, lifecycle, and latency
signals. `nutsnews-infra` alone owns Grafana resources, and the
`nutsnews-worker` meta-repository coordinates rollout. These boundaries are
different from alert `owner` labels, which route and triage alerts.

The backend-owned worker-pressure pair is
`nutsnews_backend_worker_uplift_outbox_available` and
`nutsnews_backend_worker_uplift_oldest_unconfirmed_outbox_age_seconds`. The age
is valid only when availability is `1`. It is separate from the global
reader-visible feed-freshness SLO, which stays at 99% within 15 minutes and is
never split-worker ownership-gated. The API-latency SLO denominator includes
only successful article/API observations; failures remain availability and
correctness signals.

The `ramideltoro/nutsnews-infra` Grafana Cloud dashboards are managed by OpenTofu. Dashboard variables that feed regex label matchers must keep their **All** value as `.*`; otherwise PromQL such as `deployment_environment=~"$environment"` and `instance=~"$instance"` can render as `=~""` and hide every real non-empty label value. Node-exporter panels must match the labels Grafana Cloud actually receives from the integration, currently `job=~"integrations/node_exporter"` and `instance=~"$instance"`, not `service_namespace="nutsnews"`. The `NutsNews CPU Load Processes` dashboard also uses Grafana's `$__rate_interval` for CPU rate windows and distinct 1m, 5m, and 15m load-average targets so legends stay clear.

Dashboard fixes should go through the infra repository PR flow first, then the protected Grafana Cloud apply workflow after merge.

Current home-server backup monitoring uses this Prometheus data source:

```text
grafanacloud-kindcantaloupe2036-prom
```

Confirmed backup metric query:

```promql
home_server_backup_last_success{instance="chingadera", job="integrations/unix"}
```

Confirmed value meaning:

```text
1 = last backup succeeded
0 = last backup failed
```

The VPS observability layer is managed from `ramideltoro/nutsnews-infra`:

- Ansible keeps Grafana Alloy enabled as production desired state; a disable
  requires a typed protected-workflow confirmation.
- Alloy ships independent host-exporter and Alloy-self metrics,
  systemd/log/textfile telemetry, bounded `docker stats` metrics, and
  Docker/Compose logs. cAdvisor/containerd access is not used.
- OpenTofu owns existing folders, dashboards, alert rules, and the live five-
  check Synthetic Monitoring baseline. Run 30708192621 applied five checks on
  two probes every five minutes; the standing-major acknowledgment is recorded
  and the major warning remains. PR #473 operations-email hardening and four
  native SLOs still require a future protected apply after the freeze.
- The source-staged Current Production Ownership dashboard is designed to show
  the backend revision and exact deployed identities for all eight split-worker
  services alongside web, database, ingestion-owner, write-gate, and
  telemetry-freshness state. It is not live rollout evidence until protected
  apply and populated-query verification pass.
- Grafana Cloud telemetry write credentials and Grafana automation credentials are separate.
- Real Grafana URLs, usernames, tokens, tenant IDs, Synthetic Monitoring targets, and backend config stay out of Git.

Detailed setup lives in:

```text
NUTSNEWS_GRAFANA_CLOUD_OBSERVABILITY.md
```

Detailed Grafana Explore queries, dashboard setup, and alert ideas live in:

```text
docs/GRAFANA_BACKUP_MONITORING.md
```

---

## Sentry

Sentry is the canonical scrubbed exception and replay store for frontend,
runtime, and Worker errors. Grafana links releases and safe correlation fields
to operational context without copying sensitive Sentry payloads.

Use it to answer:

```text
What errors happened in production?
```

Important env vars:

```text
NEXT_PUBLIC_SENTRY_DSN
SENTRY_ORG
SENTRY_PROJECT
SENTRY_AUTH_TOKEN
SENTRY_DSN
```

---

## Admin Dashboards

### `/admin/ai-usage`

Answers:

* Is OpenAI usage controlled?
* What is the estimated cost?
* Which shards are using AI?
* Did cost protection trigger?

### `/admin/shards`

Answers:

* Are Worker shards healthy?
* Which shards are stale?
* Which runs failed?
* What was the latest error?

### `/admin/feed-health`

Answers:

* Which feeds fail often?
* Which feeds lack thumbnails?
* Which feeds produce accepted articles?

### `/admin/feeds`

Answers:

* Which feeds are active?
* Which feeds are disabled?
* Which feeds should be enabled or disabled?

### Grafana Cloud: `Home Server Backups`

Answers:

* Did the last backup succeed?
* When was the last successful backup?
* How old is the newest successful backup?
* How many backups are available now?
* When is the next backup expected, if exported by the backup script?

---

## Health Check Commands

### Public site

```bash
curl -I "https://www.nutsnews.com/"
```

### Article API

```bash
curl -s "https://www.nutsnews.com/api/articles?page=0"
```

### UptimeRobot validation set

```bash
curl -I "https://www.nutsnews.com/"
curl -s "https://www.nutsnews.com/" | grep -i "NutsNews"
curl -s "https://www.nutsnews.com/api/articles?limit=1"
curl -I "https://www.nutsnews.com/privacy"
curl -I "https://www.nutsnews.com/contact"
```

### Cache

Quick HIT-rate spot check:

```bash
./scripts/validate_cloudflare_cache_hit_rate.sh https://www.nutsnews.com
```

Full expected-vs-actual cache policy report:

```bash
cd web
npm run audit:cache -- --url https://www.nutsnews.com
```

Protected dashboard:

```text
/admin/cache
```

Detailed guide:

```text
docs/CLOUDFLARE_CACHE_OBSERVABILITY.md
```

### Worker and controller

Do not use the Worker root route with `?limit=1` or the controller root route
with `?shard=0` as health checks. Those routes can trigger ingestion work. Use
the approved read-only status workflow and retained health artifacts during the
freeze; do not probe ingestion-triggering routes.

### Better Stack web log test

```bash
curl "https://www.nutsnews.com/api/log-test"
```

### Grafana backup metric discovery

Run this in Grafana Cloud Explore, not in the terminal:

```promql
{__name__=~"home_server_backup_.*", instance="chingadera", job="integrations/unix"}
```

### Grafana last backup success

Run this in Grafana Cloud Explore:

```promql
home_server_backup_last_success{instance="chingadera", job="integrations/unix"}
```

---

## Controller and Shard Debugging

Detailed manual commands live in:

```text
docs/CONTROLLER_AND_SHARDS.md
```

Useful Better Stack searches:

```text
service:nutsnews-controller
service:nutsnews-controller level:warn
service:nutsnews-controller level:error
service:nutsnews-worker shardIndex:0
service:nutsnews-worker level:error
```

Useful Wrangler tail commands:

```bash
cd controller && npx wrangler tail nutsnews-controller
cd worker && npx wrangler tail --config generated-wrangler/wrangler.shard0.jsonc
```
