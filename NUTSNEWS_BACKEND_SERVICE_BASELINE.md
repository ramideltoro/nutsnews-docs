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

## Re-Attestation Trigger

Update the attestation after protected apply changes listeners or services, after Docker/Caddy/app/database/cache/search/dashboard work lands, or whenever read-only audit finds drift.
