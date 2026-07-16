# NutsNews Backend Service Baseline

This documents the read-only service baseline attestation for `ramideltoro/nutsnews-backend` and `65.75.201.18`.

## Live Evidence

Captured over read-only SSH on 2026-07-16:

```text
host: backend
ssh user: rami
kernel: 7.0.0-14-generic
failed systemd units: 0
cloud-init status: done
```

Current public listeners:

| Address | Port | Purpose |
| --- | --- | --- |
| `0.0.0.0` | `22/tcp` | SSH |
| `[::]` | `22/tcp` | SSH |

Current local listeners are system DNS and chrony only.

Not deployed at attestation time:

- Docker Engine
- Docker Compose
- Caddy
- backend app service
- public HTTP/HTTPS
- PostgreSQL
- Redis or Valkey
- search service
- ops dashboard

## Repo Inventory

The backend repo includes a machine-readable inventory:

```text
docs/backend-service-baseline.json
```

Validation:

```bash
python3 scripts/validate_service_baseline.py
```

The validator fails if the baseline lists a public TCP port other than SSH or any failed systemd units.

## Public Exposure Policy

Current expected public exposure is SSH only.

HTTP/HTTPS must remain closed until a reviewed reverse-proxy/routing PR enables Caddy, health checks, TLS strategy, and compatible UFW policy. Database, cache, search, and dashboard ports must not be public.

## Optional Service Decisions

### Redis Or Valkey

Backend issue #27 records a no-install decision for Redis/Valkey.

Simple Summary:

NutsNews is not adding Redis or Valkey right now because there is no current job that needs it.

Intermediate Summary:

The app currently uses Supabase, Next.js caching, CDN cache headers, and route-level anti-abuse behavior. The inspected app dependency list does not include a Redis or Valkey client, and the backend host has no deployed queue, cache, job-progress, session, or retry-buffer workload. Adding Redis/Valkey now would add another service to operate without a concrete reliability or product benefit.

Expert Summary:

The backend repo now has `docs/backend-redis-valkey-decision.json`, `runbooks/REDIS_VALKEY_DECISION.md`, and `scripts/validate_redis_valkey_decision.py`. The validator fails if the service baseline stops marking Redis/Valkey as not deployed while the decision still says `do_not_install_now`. Any future Redis/Valkey implementation must be private-only, authenticated or equivalently access-bound, resource-capped, observable, and covered by persistence/backup/fallback rules before protected apply.

### Dedicated Search Service

Backend issue #29 records a no-install decision for a dedicated search daemon.

Simple Summary:

NutsNews is not adding Meilisearch, Typesense, OpenSearch, or Elasticsearch to the backend server right now because the app already has working Postgres search.

Intermediate Summary:

The current app has a Supabase/Postgres full-text search migration with a generated `tsvector`, a GIN index, and `public.search_articles`. The `/api/search` route already bounds query inputs, uses a runtime feature flag, and emits public search cache headers. A separate search daemon would add always-on memory, disk, backup, rebuild, and observability work before there is measured need.

Expert Summary:

The backend repo now has `docs/backend-search-service-decision.json`, `runbooks/SEARCH_SERVICE_DECISION.md`, and `scripts/validate_search_service_decision.py`. The validator fails if the service baseline stops marking search service as not deployed while the decision still says `keep_postgres_full_text_search_now`. A future search service requires private-only binding, resource sizing, rebuild or snapshot strategy, health checks, low-cardinality observability, app fallback, and a concrete `ramideltoro/nutsnews` integration issue before protected apply.

References used for resource expectations:

- PostgreSQL text-search indexes: https://www.postgresql.org/docs/current/textsearch-indexes.html
- Meilisearch hardware FAQ: https://meilisearch.com/docs/resources/help/faq
- Meilisearch memory configuration: https://meilisearch.com/docs/resources/self_hosting/configuration/reference
- Typesense system requirements: https://typesense.org/docs/guide/system-requirements.html
- Typesense memory sizing: https://cloud-help-center.typesense.org/article/22-choosing-how-much-memory-you-need

## Re-Attestation Trigger

Update the attestation after protected apply changes listeners or services, after Docker/Caddy/app/database/cache/search/dashboard work lands, or whenever read-only audit finds drift.
