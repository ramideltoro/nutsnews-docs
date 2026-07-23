# NutsNews Documentation

Welcome to the NutsNews documentation hub.

This repository is the canonical documentation home for NutsNews web, NutsNews Worker, and NutsNews iOS. Keep product, operations, deployment, cache, automation, and environment documentation here instead of in the application repositories so documentation-only updates do not trigger app deployments.

This folder is organized by what you are trying to do: understand the product, change the platform, operate production, monitor risk, or debug problems.

---

## Fast Paths

| Goal | Start here |
| --- | --- |
| Learn what NutsNews is | [Project Overview](PROJECT.md) |
| Understand the system | [Architecture](ARCHITECTURE.md) |
| Run the platform | [Operations](OPERATIONS.md) |
| Understand the VPS operating model | [Infra Operations Platform](NUTSNEWS_INFRA_OPERATIONS_PLATFORM.md) |
| Bootstrap the VPS baseline | [VPS Ansible Bootstrap](NUTSNEWS_VPS_ANSIBLE_BOOTSTRAP.md) |
| Bootstrap the backend server | [Backend Bootstrap](NUTSNEWS_BACKEND_BOOTSTRAP.md) |
| Bootstrap backend credentials | [Backend Credential Bootstrap](NUTSNEWS_BACKEND_CREDENTIAL_BOOTSTRAP.md) |
| Run the protected backend apply workflow | [Backend Protected Apply](NUTSNEWS_BACKEND_PROTECTED_APPLY.md) |
| Route backend.nutsnews.com | [Backend Cloudflare Routing](NUTSNEWS_BACKEND_CLOUDFLARE_ROUTING.md) |
| Run the backend drift check | [Backend Drift Check](NUTSNEWS_BACKEND_DRIFT_CHECK.md) |
| Review backend host security baseline | [Backend Security Baseline](NUTSNEWS_BACKEND_SECURITY_BASELINE.md) |
| Review backend backup and restore baseline | [Backend Backup and Restore](NUTSNEWS_BACKEND_BACKUP_RESTORE.md) |
| Review backend monitoring baseline | [Backend Monitoring](NUTSNEWS_BACKEND_MONITORING.md) |
| Review backend health report automation | [Backend Health Report](NUTSNEWS_BACKEND_HEALTH_REPORT.md) |
| Run backend cleanup report or dry-run | [Backend Cleanup Maintenance](NUTSNEWS_BACKEND_CLEANUP_MAINTENANCE.md) |
| Run fixed backend recovery checks or actions | [Backend Recovery](NUTSNEWS_BACKEND_RECOVERY.md) |
| Review backend OpenAI maintenance robot | [Backend OpenAI Maintenance Robot](NUTSNEWS_BACKEND_OPENAI_MAINTENANCE_ROBOT.md) |
| Review backend service baseline attestation | [Backend Service Baseline](NUTSNEWS_BACKEND_SERVICE_BASELINE.md) |
| Find the worker-uplift operation owner map | [Worker-Uplift Operation Map](NUTSNEWS_WORKER_UPLIFT_OPERATION_MAP.md) |
| Review worker-uplift RabbitMQ capacity and security | [Worker-Uplift RabbitMQ Capacity And Security](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_CAPACITY_SECURITY.md) |
| Provision worker-uplift RabbitMQ | [Worker-Uplift RabbitMQ Provisioning](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_PROVISIONING.md) |
| Operate worker-uplift RabbitMQ drift, smoke, and canary workflows | [Worker-Uplift RabbitMQ Operations](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_OPERATIONS.md) |
| Rebuild, restore, or upgrade worker-uplift RabbitMQ | [Worker-Uplift RabbitMQ Recovery](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_RECOVERY.md) |
| Operate worker-uplift services on the backend host | [Worker-Uplift Service Runtime](NUTSNEWS_WORKER_UPLIFT_SERVICE_RUNTIME.md) |
| Verify worker-uplift RabbitMQ metrics collection | [Worker-Uplift RabbitMQ Metrics](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_METRICS.md) |
| Run the protected VPS baseline workflow or trigger an on-demand report | [Protected Ansible Apply](NUTSNEWS_PROTECTED_ANSIBLE_APPLY.md); [Operations Portal v1](NUTSNEWS_OPERATIONS_PORTAL_V1.md) |
| Run protected VPS package maintenance or reboot | [VPS Maintenance](NUTSNEWS_VPS_MAINTENANCE.md) |
| Synchronize reviewed Vercel Production variables to the VPS | [Vercel-to-VPS environment synchronization](NUTSNEWS_VERCEL_VPS_ENV_SYNC.md) |
| Understand the VPS service foundation | [VPS Service Foundation](NUTSNEWS_VPS_SERVICE_FOUNDATION.md) |
| Review production/staging VPS runtime isolation | [VPS Runtime Environment Isolation](NUTSNEWS_VPS_RUNTIME_ENVIRONMENT_ISOLATION.md) |
| Review same-host staging capacity and safeguards | [VPS Staging Capacity Budget](NUTSNEWS_VPS_STAGING_CAPACITY.md) |
| Rehearse or approve an immutable staging deployment | [VPS Immutable Staging Deployment](NUTSNEWS_VPS_STAGING_DEPLOYMENT.md) |
| Qualify an isolated deployed staging candidate | [VPS Immutable Staging Deployment — Independent Off-VPS Qualification](NUTSNEWS_VPS_STAGING_DEPLOYMENT.md#independent-off-vps-qualification-nutsnews-infra122) |
| Rehearse staging gate failures and bypass closure | [Protected Ansible Apply — Gate Rehearsal And Bypass Inventory](NUTSNEWS_PROTECTED_ANSIBLE_APPLY.md#gate-rehearsal-and-bypass-inventory) |
| Configure the protected staging hostname and credential boundary | [VPS Staging Access and Credential Boundary](NUTSNEWS_VPS_STAGING_ACCESS_BOUNDARY.md) |
| Understand the VPS operations portal | [Operations Portal v1](NUTSNEWS_OPERATIONS_PORTAL_V1.md) |
| Set up or restore encrypted VPS backups | [VPS Backups](NUTSNEWS_VPS_BACKUPS.md); [VPS Restore](NUTSNEWS_VPS_RESTORE.md); [VPS Disaster Recovery](NUTSNEWS_VPS_DISASTER_RECOVERY.md) |
| Set up Grafana Cloud observability | [Grafana Cloud Observability](NUTSNEWS_GRAFANA_CLOUD_OBSERVABILITY.md) |
| Ship a change | [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) |
| Understand the current end-to-end release pipeline | [Release Pipeline](NUTSNEWS_RELEASE_PIPELINE.md) |
| Write or review production release notes | [Release Notes Workflow](RELEASE_NOTES_WORKFLOW.md) |
| Understand the Vercel + VPS web delivery model | [Dual-Target Web Deployment](NUTSNEWS_DUAL_TARGET_WEB_DEPLOYMENT.md) |
| Prepare or operate VPS-primary Cloudflare DNS failover | [Dual-Target Web Deployment - Cloudflare DNS Failover Controller](NUTSNEWS_DUAL_TARGET_WEB_DEPLOYMENT.md#cloudflare-dns-failover-controller) |
| Fix a production issue | [Troubleshooting](TROUBLESHOOTING.md) |
| Check cost and quota risk | [Free-Tier Guardrails](FREE_TIER_GUARDRAILS.md) |
| Validate public API contracts | [Public API Contract Tests](PUBLIC_API_CONTRACT_TESTS.md) |
| Plan a formal external public API | [Public API Plan](PUBLIC_API_PLAN.md) |
| Work on translations | [Multi-language Summaries](MULTI_LANGUAGE_SUMMARIES.md); [Multilingual Quality and Fallbacks](MULTILINGUAL_QUALITY_AND_FALLBACKS.md) |
| Work on local AI | [Worker Local AI Lock](NUTSNEWS_WORKER_LOCAL_AI_LOCK.md); see ramideltoro/nutsnews-worker |
| Investigate worker queue pressure | [Worker Backpressure and Lock Safety](WORKER_BACKPRESSURE_AND_LOCK_SAFETY.md) |
| Run regression tests | [Web Offline E2E](WEB_OFFLINE_E2E_REGRESSION_TEST.md); [Vercel Preview Smoke Test](VERCEL_PREVIEW_SMOKE_TEST.md); Worker tests live in ramideltoro/nutsnews-worker |
| Review iOS notes | [iOS documentation and update notes](ios/README.md) |

---

## Documentation Tree

### 1. Start Here

These docs explain the product and the system at a high level.

| Doc | Use it for |
| --- | --- |
| [Project Overview](PROJECT.md) | Product story, mission, reader experience, and current status |
| [Architecture](ARCHITECTURE.md) | System components, data flow, and repository layout |
| [Operations](OPERATIONS.md) | Day-to-day operating model, admin portal, and maintenance tasks |
| [Infra Operations Platform](NUTSNEWS_INFRA_OPERATIONS_PLATFORM.md) | VPS GitOps model, CI stability layer, Ops Portal goal, support-node rules, reports, and provider migration strategy |
| [VPS Ansible Bootstrap](NUTSNEWS_VPS_ANSIBLE_BOOTSTRAP.md) | First Ubuntu VPS baseline, SSH lockout prevention, firewall, updates, logging, and recovery flow |
| [Backend Bootstrap](NUTSNEWS_BACKEND_BOOTSTRAP.md) | Backend server host contract, runtime direction, repo boundaries, and initial Ansible scaffold |
| [Backend Credential Bootstrap](NUTSNEWS_BACKEND_CREDENTIAL_BOOTSTRAP.md) | Protected GitHub Environment setup, credential inventory, provider secret names, readiness workflow, and rollback |
| [Backend Protected Apply](NUTSNEWS_BACKEND_PROTECTED_APPLY.md) | Manual protected backend Ansible check/apply workflow, Environment secrets, blockers, and validation |
| [Backend Cloudflare Routing](NUTSNEWS_BACKEND_CLOUDFLARE_ROUTING.md) | DNS-only Cloudflare backend route, Caddy `/healthz`, protected apply order, verification, and rollback |
| [Backend Drift Check](NUTSNEWS_BACKEND_DRIFT_CHECK.md) | Protected read-only drift workflow, classification semantics, current evidence, and rollback boundary |
| [Backend Security Baseline](NUTSNEWS_BACKEND_SECURITY_BASELINE.md) | Backend SSH hardening desired state, verification commands, and apply blocker |
| [Backend Backup and Restore](NUTSNEWS_BACKEND_BACKUP_RESTORE.md) | Backend backup scope, retention, restore-test gate, secret boundary, and recovery order |
| [Backend Monitoring](NUTSNEWS_BACKEND_MONITORING.md) | Backend host smoke checks, alert thresholds, log retention, and alert-delivery blocker |
| [Backend Health Report](NUTSNEWS_BACKEND_HEALTH_REPORT.md) | Scheduled read-only backend host reports from GitHub Actions, JSON artifacts, SMTP delivery, and rollback |
| [Backend Cleanup Maintenance](NUTSNEWS_BACKEND_CLEANUP_MAINTENANCE.md) | Fixed-purpose backend cleanup report, dry-run, protected apply, allowlists, and protected paths |
| [Backend Recovery](NUTSNEWS_BACKEND_RECOVERY.md) | Fixed-purpose backend recovery checks, protected service actions, pre/postchecks, and last-run evidence |
| [Backend OpenAI Maintenance Robot](NUTSNEWS_BACKEND_OPENAI_MAINTENANCE_ROBOT.md) | Daily OpenAI-assisted maintenance scan, scan labels, issue routing, artifacts, and safety boundaries |
| [Backend Service Baseline](NUTSNEWS_BACKEND_SERVICE_BASELINE.md) | Read-only live service inventory, public exposure policy, and re-attestation trigger |
| [Worker-Uplift Operation Map](NUTSNEWS_WORKER_UPLIFT_OPERATION_MAP.md) | Backend-owned old-to-new operation map for legacy Worker scripts, backend host operations, Grafana ownership, DNS failover separation, and worker-uplift runtime controls |
| [Worker-Uplift RabbitMQ Capacity And Security](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_CAPACITY_SECURITY.md) | RabbitMQ release pin, queue-type decision, hard limits, access boundary, benchmark path, and recovery model for the backend-owned worker-uplift broker |
| [Worker-Uplift RabbitMQ Provisioning](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_PROVISIONING.md) | Protected Ansible/Compose provisioning path, topology bootstrap, credential boundary, durable probe, host-restart verification, and rollback model for the backend-owned worker-uplift broker |
| [Worker-Uplift RabbitMQ Operations](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_OPERATIONS.md) | Protected RabbitMQ apply guardrails, read-only drift coverage, smoke checks, private canary checks, health-report integration, artifacts, and issue #84/#91 proof paths |
| [Worker-Uplift RabbitMQ Recovery](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_RECOVERY.md) | Sanitized definition exports, clean rebuild drills, stopped-volume restore drills, upgrade procedure, and health signals for the backend-owned worker-uplift broker |
| [Worker-Uplift Service Runtime](NUTSNEWS_WORKER_UPLIFT_SERVICE_RUNTIME.md) | Shadow-first backend worker service runtime framework, fixed protected operations, service manifest validation, and issue #85 proof plan |
| [Worker-Uplift RabbitMQ Metrics](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_METRICS.md) | Backend Alloy RabbitMQ scrape path, bounded queue metrics, Grafana Cloud remote-write boundary, and issue #87 proof plan |
| [Backend PostgreSQL Failover](NUTSNEWS_BACKEND_POSTGRES_FAILOVER.md) | Backend PostgreSQL shadow target, worker/app compatibility boundaries, parity gates, and rollback boundary |
| [Protected Ansible Apply](NUTSNEWS_PROTECTED_ANSIBLE_APPLY.md) | Manual protected GitHub Actions workflow for check/apply runs against the VPS baseline, plus the separate on-demand health report workflow |
| [VPS Service Foundation](NUTSNEWS_VPS_SERVICE_FOUNDATION.md) | Docker, Compose, `/opt/nutsnews`, Caddy, and public infrastructure health routing |
| [VPS Runtime Environment Isolation](NUTSNEWS_VPS_RUNTIME_ENVIRONMENT_ISOLATION.md) | Separate production/staging Compose identities, state, Caddy boundary, immutable digest rule, and #118 blocker |
| [VPS Staging Capacity Budget](NUTSNEWS_VPS_STAGING_CAPACITY.md) | Measured #118 capacity decision, fixed resource/test budgets, disk limitation, and post-apply verification |
| [VPS Immutable Staging Deployment](NUTSNEWS_VPS_STAGING_DEPLOYMENT.md) | Candidate schema, pre-secret trust checks, staging-only GitOps apply, deterministic non-destructive qualification, off-VPS attestation, audit evidence, and required live verification |
| [VPS Staging Access and Credential Boundary](NUTSNEWS_VPS_STAGING_ACCESS_BOUNDARY.md) | Shared-host topology, Cloudflare Access, fixed deployment identity, secret onboarding, protected apply, rollback, and live verification |
| [Dual-Target Web Deployment](NUTSNEWS_DUAL_TARGET_WEB_DEPLOYMENT.md) | One application commit, Vercel and GHCR artifacts, immutable VPS promotion, staged validation, public opt-in, and rollback |
| [Operations Portal v1](NUTSNEWS_OPERATIONS_PORTAL_V1.md) | Read-only VPS dashboard, local collector, public Google OAuth route, status JSON, and recovery notes |
| [VPS Alert Email Policy](VPS_ALERT_EMAIL_POLICY.md) | Stable alert identity, cooldown/escalation behavior, backup freshness semantics, and read-only troubleshooting |
| [VPS Backups](NUTSNEWS_VPS_BACKUPS.md) | Encrypted restic backups to a dedicated OneDrive rclone remote, setup secrets, status, alerts, and validation |
| [VPS Maintenance](NUTSNEWS_VPS_MAINTENANCE.md) | Protected package maintenance, reboot approval, post-reboot validation, and failure handling |
| [VPS Restore](NUTSNEWS_VPS_RESTORE.md) | Restoring encrypted VPS snapshots to staging, copying selected data/config, and restore testing |
| [VPS Disaster Recovery](NUTSNEWS_VPS_DISASTER_RECOVERY.md) | Rebuilding on another VPS provider, restoring data, verifying, cutting over DNS, and rollback |
| [Grafana Cloud Observability](NUTSNEWS_GRAFANA_CLOUD_OBSERVABILITY.md) | Grafana Alloy telemetry, centralized OpenTofu-managed dashboards/alerts, Synthetic Monitoring, backend imports, and free-tier guardrails |
| [Troubleshooting](TROUBLESHOOTING.md) | Common failures, checks, and recovery steps |

### 2. Product and Reader Experience

#### Public site

| Doc | Use it for |
| --- | --- |
| [Full Archive Search](FULL_ARCHIVE_SEARCH.md) | Search behavior and archive lookup flow |
| [Multi-language Summaries](MULTI_LANGUAGE_SUMMARIES.md) | Supported languages, storage, Worker generation, and API display behavior |
| [Multilingual Quality and Fallbacks](MULTILINGUAL_QUALITY_AND_FALLBACKS.md) | Translation coverage checks, English-leak detection, admin visibility, and fallback policy |
| [Public Page Translations](NUTSNEWS_PUBLIC_PAGE_TRANSLATIONS.md) | About, Contact, Privacy, and settings language behavior |
| [Public Pages Theme Consistency](NUTSNEWS_PUBLIC_PAGES_THEME_CONSISTENCY.md) | Theme behavior across public pages |
| [Privacy Analytics And Consent](PRIVACY_ANALYTICS_CONSENT.md) | GA4 consent gate, allowed event taxonomy, disallowed data, retention, and rollback |
| [Publisher Attribution And Content Use](PUBLISHER_ATTRIBUTION_AND_CONTENT_USE.md) | Publisher credit, summary/excerpt limits, source removal workflow, and future digest/social requirements |
| [Public API Plan](PUBLIC_API_PLAN.md) | Future formal external public API use cases, fields, rate limits, caching, versioning, and privacy constraints |
| [Sitemap Scaling Strategy](SITEMAP_SCALING_STRATEGY.md) | Sitemap index, article sitemap shards, crawler discovery, cache policy, and SEO audit coverage |

#### UI and polish

| Doc | Use it for |
| --- | --- |
| [Modern Theme UI](NUTSNEWS_WEB_MODERN_THEME_UI_UPDATE.md) | Current public visual direction |
| [Cache Safety Update](NUTSNEWS_CACHE_SAFETY_UPDATE.md) | Safe public caching behavior |
| [Feed Visibility Fade Fix](NUTSNEWS_FEED_VISIBILITY_FADE_FIX.md) | Feed rendering visibility behavior |
| [Home Button Update](NUTSNEWS_HOME_BUTTON_UPDATE.md) | Public navigation home button behavior |
| [Page Fade Appear Update](NUTSNEWS_PAGE_FADE_APPEAR_UPDATE.md) | Page transition polish |

#### Admin experience

| Doc | Use it for |
| --- | --- |
| [Admin Article Reviews](ADMIN_ARTICLE_REVIEWS.md) | Accepted/rejected stories, filters, and review investigation |
| [Admin Audit Log](ADMIN_AUDIT_LOG.md) | Protected audit trail for sensitive admin changes, retention, privacy, and validation |
| [Incident Response Policy](INCIDENT_RESPONSE_POLICY.md) | SEV1/SEV2/SEV3 definitions, alert routing, incident checklist, and post-incident review template |
| [Production Readiness Dashboard](PRODUCTION_READINESS_DASHBOARD.md) | Admin green/yellow/red scorecard for shipping readiness across public API health, Worker freshness, DB growth, translations, images, backups, and CI |
| [Responsive Admin Dashboards](ADMIN_RESPONSIVE_DASHBOARDS.md) | Mobile-friendly admin dashboard patterns |
| [Home Server Dashboard](HOME_SERVER_DASHBOARD.md) | `/admin/home-server` setup and troubleshooting |

### 3. Platform and Data

#### Core platform

| Doc | Use it for |
| --- | --- |
| Worker ingestion, controller, and local AI | See ramideltoro/nutsnews-worker |
| [Worker Backpressure and Lock Safety](WORKER_BACKPRESSURE_AND_LOCK_SAFETY.md) | Queue visibility, Redis lock lease safety, backpressure thresholds, and worker report counters |
| [Public Feed Snapshot and Edge Fallback](PUBLIC_FEED_SNAPSHOT.md) | Supabase snapshot reads, Cloudflare KV fallback, headers, admin status, and recovery checks |
| [Runtime Feature Flags](RUNTIME_FEATURE_FLAGS.md) | Protected shared runtime switches for archive search and optional Worker edge-snapshot publishing, with no-redeploy rollback steps |
| [Supabase RLS Regression Tests](SUPABASE_RLS_REGRESSION_TESTS.md) | Local Supabase allow/deny policy tests for public reads, denied anonymous writes, and service-role-only database surfaces |
| [RSS Source Quality](RSS_SOURCE_QUALITY.md) | Feed quality scoring, ranking, and source decisions |
| [Image Delivery](IMAGE_DELIVERY.md) | Thumbnails, image optimization, cache TTL, and category-aware non-photo fallbacks |
| [Secure Image Proxy/Cache Design](IMAGE_PROXY_CACHE_DESIGN.md) | Issue #105 design for optional Cloudflare image proxy/cache, domain controls, quotas, rollout, and kill switches |
| [Performance and Resiliency](PERFORMANCE_AND_RESILIENCY.md) | Caching, pagination, indexes, sharding, and reliability |
| [Homepage Performance Budget](HOMEPAGE_PERFORMANCE_BUDGET.md) | Homepage LCP, JS, CSS, image, and transfer budgets |
| [Web Visual Regression Tests](WEB_VISUAL_REGRESSION_TESTS.md) | Playwright screenshot baselines for public page layout states |
| [Cloudflare Cache Observability](CLOUDFLARE_CACHE_OBSERVABILITY.md) | Cache policy dashboard, scheduled alerts, route expectations, and common fixes |

#### Data protection and recovery

| Doc | Use it for |
| --- | --- |
| [Supabase Backup Automation](NUTSNEWS_DB_BACKUPS.md) | Home-server backups to encrypted OneDrive |
| [VPS Backups](NUTSNEWS_VPS_BACKUPS.md) | VPS restic backups to encrypted OneDrive storage through rclone |
| [VPS Restore](NUTSNEWS_VPS_RESTORE.md) | VPS restic restore and restore-test procedure |
| [VPS Disaster Recovery](NUTSNEWS_VPS_DISASTER_RECOVERY.md) | Provider-agnostic VPS rebuild and cutover runbook |
| [Worker-Uplift RabbitMQ Operations](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_OPERATIONS.md) | RabbitMQ protected apply, drift, smoke, private canary, and health-report operating evidence |
| [Worker-Uplift RabbitMQ Recovery](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_RECOVERY.md) | RabbitMQ topology rebuild, stopped-volume restore, and upgrade procedure |
| [Worker-Uplift RabbitMQ Metrics](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_METRICS.md) | RabbitMQ metrics collection, cardinality guardrails, and Grafana ownership boundary |
| [Supabase Restore Procedure](SUPABASE_RESTORE.md) | Restore order, SQL import, and validation queries |
| [Migration Release Gate](MIGRATION_RELEASE_GATE.md) | Ordered migrations, schema-drift readiness, deterministic staging fixtures, compatibility windows, and protected rollout |
| [Free-Tier Guardrails](FREE_TIER_GUARDRAILS.md) | Quota, cost, and usage warning dashboard |

### 4. AI and Automation

#### AI providers

| Doc | Use it for |
| --- | --- |
| [Worker Local AI Lock](NUTSNEWS_WORKER_LOCAL_AI_LOCK.md) | Web-side note for the Worker repo local-AI deployment lock |
| [Worker Backpressure and Lock Safety](WORKER_BACKPRESSURE_AND_LOCK_SAFETY.md) | Ingestion pressure controls, lock overlap safety, and queue/deferred report fields |
| Worker/local AI repository | See ramideltoro/nutsnews-worker |
| [Multi-language Summaries](MULTI_LANGUAGE_SUMMARIES.md) | Website translation display and recovery context |
| [Multilingual Quality and Fallbacks](MULTILINGUAL_QUALITY_AND_FALLBACKS.md) | Quality gates, daily reports, admin dashboard, and fallback behavior |

#### Automation and Workers

| Doc | Use it for |
| --- | --- |
| [Cloudflare Turnstile Contact Form](CLOUDFLARE_TURNSTILE_CONTACT_FORM.md) | Contact form bot protection |
| [GitHub Actions Automation](GITHUB_ACTIONS_AUTOMATION.md) | CI and automation workflow overview |
| [GitHub Wiki Automation](GITHUB_WIKI_AUTOMATION.md) | Publishing docs to the GitHub Wiki |

### 5. Operations and Release Management

#### Deploy and maintain

| Doc | Use it for |
| --- | --- |
| [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) | Safe release steps for web, DB, and cache |
| [Release Pipeline](NUTSNEWS_RELEASE_PIPELINE.md) | Current end-to-end commit, PR, Vercel, image, staging, qualification, protected promotion, production VPS, and verification pipeline |
| [Release Notes Workflow](RELEASE_NOTES_WORKFLOW.md) | Manual release-note format, cross-repo checklist, evidence, automation boundary, and rollback notes |
| [Dual-Target Web Deployment](NUTSNEWS_DUAL_TARGET_WEB_DEPLOYMENT.md) | Build identity, environment parity, image publishing, digest promotion, VPS-primary DNS failover, protected rollout, and rollback |
| [Dependency Updates](DEPENDENCY_UPDATES.md) | npm audit, safe upgrades, Dependabot, and validation |
| [Mandatory NutsNews Docs Policy](updates/README_MANDATORY_NUTSNEWS_DOCS_POLICY.md) | Required docs updates, release-note summaries, diagrams, and app/docs PR linkage for every NutsNews change |
| [Platform Improvement Backlog](PLATFORM_IMPROVEMENT_ISSUE_BACKLOG.md) | Planned platform improvement issues |

#### Monitoring and incidents

| Doc | Use it for |
| --- | --- |
| [Observability](OBSERVABILITY.md) | Logs, errors, dashboards, and health checks |
| [VPS Production Runtime 500 Incident](NUTSNEWS_VPS_PRODUCTION_RUNTIME_500_INCIDENT.md) | Correlated RSC 500 evidence, GitOps recovery, protected Supabase migration, and schema-compatible release promotion |
| [Backend Health Report](NUTSNEWS_BACKEND_HEALTH_REPORT.md) | Daily backend host health report, generated JSON, email delivery, and read-only evidence |
| [Grafana Cloud Observability](NUTSNEWS_GRAFANA_CLOUD_OBSERVABILITY.md) | VPS host/container/service/app/log dashboards, quota alerts, and Synthetic Monitoring setup |
| [Cloudflare Cache Observability](CLOUDFLARE_CACHE_OBSERVABILITY.md) | Expected-vs-actual cache header reports and alerts |
| [UptimeRobot Onboarding](UPTIMEROBOT_ONBOARDING.md) | External uptime monitors |
| [Grafana Backup Monitoring](GRAFANA_BACKUP_MONITORING.md) | Backup freshness and success panels |
| [PageSpeed Insights](PAGESPEED_INSIGHTS.md) | Production performance audits |

### 6. Quality, Security, and Regression Tests

#### Quality checks

| Doc | Use it for |
| --- | --- |
| [Homepage Performance Budget](HOMEPAGE_PERFORMANCE_BUDGET.md) | Build-size report, hard budgets, and common fixes |
| [Web Visual Regression Tests](WEB_VISUAL_REGRESSION_TESTS.md) | Screenshot snapshots, update workflow, and failure artifacts |
| [Supabase RLS Regression Tests](SUPABASE_RLS_REGRESSION_TESTS.md) | Disposable local database tests for Supabase grants, RLS policies, and approved public/service-role access |
| [Multilingual Quality and Fallbacks](MULTILINGUAL_QUALITY_AND_FALLBACKS.md) | Translation coverage report, language-code checks, and fallback quality rules |
| [Lighthouse CI Onboarding](LIGHTHOUSE_CI_ONBOARDING.md) | Lighthouse CI setup and thresholds |
| [PageSpeed Insights](PAGESPEED_INSIGHTS.md) | Manual production speed checks |
| [axe Playwright Accessibility CI](AXE_PLAYWRIGHT_ACCESSIBILITY_CI.md) | Accessibility regression checks |
| [SEO Structured Data Audit](SEO_STRUCTURED_DATA_AUDIT.md) | SEO and structured data review |
| [Sitemap Scaling Strategy](SITEMAP_SCALING_STRATEGY.md) | Sitemap index and shard validation for large article archives |

#### Security checks

| Doc | Use it for |
| --- | --- |
| [CodeQL Security Scan](CODEQL_SECURITY_SCAN.md) | GitHub CodeQL setup and usage |
| [Snyk Security Scan](SNYK_SECURITY_SCAN.md) | Snyk dependency and code scanning |
| [Security Hardening](SECURITY_HARDENING.md) | CSP, browser headers, admin no-store behavior, contact form controls, and CI validation |
| [Security CI Scans](SECURITY_CI_SCANS.md) | CodeQL, Dependency Review, Dependabot, Gitleaks, OSV, actionlint, OpenSSF Scorecard, Lighthouse, ZAP, and manual GitHub security settings |
| [Dependency Updates](DEPENDENCY_UPDATES.md) | Safe package update routine |

#### Public web regression tests

| Doc | Use it for |
| --- | --- |
| [Public API Contract Tests](PUBLIC_API_CONTRACT_TESTS.md) | Mocked contract checks for `/api/articles`, `/api/search`, `/api/contact`, sitemap, and robots |
| [Web Offline E2E Regression Test](WEB_OFFLINE_E2E_REGRESSION_TEST.md) | Fully mocked public web flow test before preview deploy |
| [Web Public Reader Smoke Test](WEB_PUBLIC_READER_SMOKE_TEST.md) | PR Playwright smoke coverage for home feed, infinite scroll, language switching, contact validation, public pages, and article detail |
| [Web Visual Regression Tests](WEB_VISUAL_REGRESSION_TESTS.md) | Public-page screenshot snapshots for desktop/mobile and representative UI states |
| [Vercel Preview Smoke Test](VERCEL_PREVIEW_SMOKE_TEST.md) | Live PR preview checks after Vercel deploys |
| Worker Offline E2E Regression Test | See ramideltoro/nutsnews-worker |
| [Worker Local AI Lock](NUTSNEWS_WORKER_LOCAL_AI_LOCK.md) | Why the Worker repo prevents accidental OpenAI-first deploys |

### 7. Archive and Update Notes

Older one-off implementation notes are kept out of the main reading path.

| Area | Location |
| --- | --- |
| Archived root notes | [archive/](archive/) |
| Older update notes | [updates/](updates/) |
| iOS update notes | [ios/](ios/) |

---

## Recommended Reading Order

For a new contributor:

1. [Project Overview](PROJECT.md)
2. [Architecture](ARCHITECTURE.md)
3. [Operations](OPERATIONS.md)
4. [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
5. [Troubleshooting](TROUBLESHOOTING.md)

For production support:

1. [Operations](OPERATIONS.md)
2. [Observability](OBSERVABILITY.md)
3. [Free-Tier Guardrails](FREE_TIER_GUARDRAILS.md)
4. [Troubleshooting](TROUBLESHOOTING.md)
5. [Supabase Restore Procedure](SUPABASE_RESTORE.md)

For UI or reader-facing work:

1. [Full Archive Search](FULL_ARCHIVE_SEARCH.md)
2. [Multi-language Summaries](MULTI_LANGUAGE_SUMMARIES.md)
3. [Image Delivery](IMAGE_DELIVERY.md)
4. [Web Offline E2E Regression Test](WEB_OFFLINE_E2E_REGRESSION_TEST.md)

---

## Documentation Standards

Keep docs:

- Short at the top
- Clear before detailed
- Action-oriented
- Easy to scan
- Linked from this index when they matter
- Archived when they become one-off notes

See [Documentation Style Guide](DOCUMENTATION_STYLE_GUIDE.md) for naming, structure, and wording rules.


## Vercel preview smoke test protection bypass

Protected Vercel preview deployments require the GitHub Actions secret `VERCEL_AUTOMATION_BYPASS_SECRET`, created from Vercel Project Settings -> Deployment Protection -> Protection Bypass for Automation. The live Playwright smoke test uses this secret only as an HTTP header and does not commit it to the repo.
