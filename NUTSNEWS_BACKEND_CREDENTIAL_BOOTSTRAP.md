# NutsNews Backend Credential Bootstrap

This documents the protected credential-management path for `ramideltoro/nutsnews-backend`.

## Purpose

The backend repo now owns a repeatable way to create and verify the GitHub Environment that future backend automation needs.

Use this flow for:

- Cloudflare DNS/API access;
- Grafana Cloud metrics and Loki telemetry writes;
- Supabase production project metadata and credentials;
- restic backup provider credentials;
- email/reporting provider credentials;
- protected backend Ansible check/apply secrets.

Do not paste secret values into chat, issues, pull requests, logs, or docs. Put values only in the GitHub `production-backend` Environment or another documented secret store.

## Source Of Truth

The executable inventory and tooling live in `ramideltoro/nutsnews-backend`:

| Backend path | Purpose |
| --- | --- |
| `docs/backend-credential-inventory.json` | Versioned credential and variable inventory |
| `scripts/validate_backend_credential_inventory.py` | Inventory schema and allowlist validator |
| `scripts/check_backend_credential_readiness.py` | Presence and shape checker that does not print values |
| `scripts/bootstrap_production_backend_environment.sh` | Local bootstrap helper for GitHub Environment variables and secrets |
| `.github/workflows/backend-credential-readiness.yml` | Manual protected readiness workflow |
| `runbooks/CREDENTIAL_BOOTSTRAP.md` | Repo-local operator runbook |

## GitHub Environment

Environment:

```text
production-backend
```

Required configuration:

- required reviewer: `ramideltoro`;
- deployment branch policy: `main`;
- admin bypass disabled;
- secrets and variables stored on the Environment, not in git.

The bootstrap helper creates or updates the Environment and sets non-secret variables from the inventory defaults. Self-review prevention is currently disabled because `ramideltoro` is the only required reviewer.

## Non-Secret Variables

The bootstrap helper sets these GitHub Environment variables:

| Variable | Value |
| --- | --- |
| `NUTSNEWS_BACKEND_HOST` | `65.75.201.18` |
| `NUTSNEWS_BACKEND_DOMAIN` | `backend.nutsnews.com` |
| `NUTSNEWS_BACKEND_ENVIRONMENT` | `production` |
| `NUTSNEWS_BACKEND_RESTIC_PROVIDER` | `s3` |
| `NUTSNEWS_REPORT_SMTP_PORT` | `587` |
| `NUTSNEWS_REPORT_SMTP_STARTTLS` | `true` |

If the backup provider changes from S3-compatible storage to Backblaze B2, set `NUTSNEWS_BACKEND_RESTIC_PROVIDER=b2` before running the bootstrap helper.

## Required Secrets

Protected backend apply:

- `NUTSNEWS_BACKEND_SSH_PRIVATE_KEY`
- `NUTSNEWS_BACKEND_KNOWN_HOSTS`

Optional early-bootstrap backend apply values:

- `NUTSNEWS_BACKEND_ANSIBLE_USER`
- `NUTSNEWS_BACKEND_BECOME_PASSWORD`

Cloudflare:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ZONE_ID`

Grafana Cloud:

- `GRAFANA_CLOUD_PROMETHEUS_URL`
- `GRAFANA_CLOUD_PROMETHEUS_USERNAME`
- `GRAFANA_CLOUD_PROMETHEUS_PASSWORD`
- `GRAFANA_CLOUD_LOKI_URL`
- `GRAFANA_CLOUD_LOKI_USERNAME`
- `GRAFANA_CLOUD_LOKI_PASSWORD`

These backend Grafana values are telemetry write credentials only. Grafana folders, dashboards, alert rules, contact points, quota guardrails, Synthetic Monitoring, OpenTofu state, and Grafana service-account credentials are owned by `ramideltoro/nutsnews-infra`, not this backend environment.

Supabase:

- `SUPABASE_ACCESS_TOKEN`
- `NUTSNEWS_PRODUCTION_SUPABASE_PROJECT_REF`
- `NUTSNEWS_PRODUCTION_SUPABASE_URL`
- `NUTSNEWS_PRODUCTION_SUPABASE_ANON_KEY`
- `NUTSNEWS_PRODUCTION_SUPABASE_SERVICE_ROLE_KEY`
- `NUTSNEWS_PRODUCTION_SUPABASE_DB_URL`

Backend Worker database compatibility API:

- `NUTSNEWS_BACKEND_API_TOKEN`
- `NUTSNEWS_BACKEND_POSTGRES_WORKER_API_PASSWORD`

Restic:

- `RESTIC_REPOSITORY`
- `RESTIC_PASSWORD`
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` when `NUTSNEWS_BACKEND_RESTIC_PROVIDER=s3`
- optional `AWS_DEFAULT_REGION` when the S3-compatible provider needs it
- `B2_ACCOUNT_ID` and `B2_ACCOUNT_KEY` when `NUTSNEWS_BACKEND_RESTIC_PROVIDER=b2`

Email/reporting:

- `NUTSNEWS_REPORT_SMTP_HOST`
- `NUTSNEWS_REPORT_SMTP_USERNAME`
- `NUTSNEWS_REPORT_SMTP_PASSWORD`
- `NUTSNEWS_REPORT_EMAIL_FROM`
- `NUTSNEWS_REPORT_EMAIL_TO`

## Operator Flow

From a clean `ramideltoro/nutsnews-backend` checkout:

```bash
git checkout main
git pull --ff-only
scripts/bootstrap_production_backend_environment.sh --dry-run
```

Store values locally as either exact-name environment variables or files under:

```text
.secrets/production-backend/<SECRET_NAME>
```

Then apply:

```bash
scripts/bootstrap_production_backend_environment.sh --apply
```

The script prints only secret names that were set or missing. It exits non-zero until all required values for the selected restic provider are available.

After loading secrets, run the backend manual workflow:

```text
Backend Credential Readiness
```

GitHub requires `production-backend` Environment approval before the workflow can read secrets.

## Provider Actions Still Manual

The repo can manage names, placement, and readiness checks. Provider dashboards or account-level token values are still manual:

- create the scoped Cloudflare token for the `nutsnews.com` zone;
- create Grafana Cloud metrics/logs access-policy tokens for backend telemetry writes only;
- manage Grafana Cloud service-account/resource-management credentials from `ramideltoro/nutsnews-infra`;
- create or retrieve Supabase production project metadata, API keys, and database URL;
- create the restic repository and object-storage credentials;
- create SMTP/reporting credentials;
- approve protected GitHub Environment jobs when they request production access.

## Rollback

If a credential is wrong, rotate it at the provider and run the bootstrap helper again with the replacement value.

If a credential is over-scoped, revoke it in the provider dashboard, create a narrower token, update the GitHub Environment secret, and rerun `Backend Credential Readiness`.

If the Environment configuration drifts, rerun:

```bash
scripts/bootstrap_production_backend_environment.sh --apply
```

Then confirm the Environment still requires reviewer approval, limits deployments to `main`, and has admin bypass disabled.
