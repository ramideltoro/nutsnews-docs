---
title: Observability
wiki:
  source_route: /technical/observability/
  simple_route: /simple/observability/
  primary_diagram:
    file: diagrams/OBSERVABILITY.mmd
    accTitle: "Observability diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: platform-and-data
  section: Operations & Monitoring
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 2befcf402f4569c07f3be35413b46fd5e1731bb50a681dd756d91ac590b76904
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
| Grafana Cloud | Existing host/log visibility plus staged application metrics, managed alert email, five HTTP synthetics with an unresolved cadence choice, four SLOs, and quota guardrails pending protected apply evidence |
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

Grafana Cloud currently provides Prometheus-style host metrics, Loki logs, and
existing dashboards and alert rules. The source-controlled hardening stages
normalized application telemetry, operations-email delivery, five Synthetic
Monitoring checks, and four 30-day SLOs. The current infra candidate encodes a
five-minute cadence, which projects to 86,400 monthly executions and crosses the
85,000 major band. Issue
[`ramideltoro/nutsnews-infra#474`](https://github.com/ramideltoro/nutsnews-infra/issues/474)
keeps the choice unresolved: change source to six minutes, explicitly accept the
standing major at five minutes, or change the major threshold in reviewed
source while retaining the 90,000 ceiling. Those additions are not live until
the choice, protected inputs, apply, and post-apply evidence all succeed.

The exact-`main` `grafana-observability-readonly` Environment exists but its
two variables and two secrets are still absent. Production writer inputs and
Environment reviewer/protection gates also remain operator work. Worker
Contracts and Runtime `1.0.0` have been released in order; the eight worker
repin/conformance PRs remain in progress and are not deployed telemetry.

Worker-uplift telemetry is governed by [NutsNews Worker-Uplift Telemetry Scope](NUTSNEWS_WORKER_UPLIFT_TELEMETRY_SCOPE.md). RabbitMQ metrics, worker service metrics, and structured logs are required; full traces and exemplars are deferred; article/model payload telemetry is forbidden.

The legacy `nutsnews-worker` remains the production ingestion owner. All eight
split services are shadow-only in the baseline with
`nutsnews_worker_expected_active=0`. Shadow mode does not hide structural
telemetry failures: scheduler, fetcher, canonicalizer, enrichment, approval,
translation, persistence, and publication must all be deployed with `up == 1`,
scrape age below 180 seconds, exact non-`unknown` build/deployment identity, and
readiness series. Only a service with `expected_active=1` must additionally
report successful readiness, loop/cycle or delivery-stage activity as
applicable, last success, and worker-local paging eligibility.

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
- OpenTofu owns existing folders, dashboards, and alert rules and stages the
  protected operations-email contact point and policies, exactly five
  production Synthetic Monitoring checks, and four Grafana SLOs. The five-minute
  source cadence is still blocked on the issue #474 budget decision. A branch or
  plan is not evidence that the staged resources exist in Grafana Cloud.
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

### Worker

```bash
curl "https://nutsnews-worker-0.nutsnews.workers.dev/?limit=1"
```

### Controller

```bash
curl "https://nutsnews-controller.nutsnews.workers.dev/?shard=0"
```

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
