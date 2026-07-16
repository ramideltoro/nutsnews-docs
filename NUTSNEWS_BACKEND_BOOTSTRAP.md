# NutsNews Backend Bootstrap

This documents the initial operating model for `ramideltoro/nutsnews-backend`, which owns the backend server at `backend.nutsnews.com` / `65.75.201.18`.

## Summary

The backend repo now has a first bootstrap scaffold:

- `AGENTS.md` defines backend-specific repo boundaries and safety rules.
- `README.md` defines the host contract and chosen runtime shape.
- `runbooks/BACKEND_BOOTSTRAP.md` is the backend bootstrap entry point.
- `ansible/` contains the initial production inventory and syntax-valid bootstrap contract playbook.

The scaffold does not mutate the backend server yet. It defines how future backend host changes should be made: pull request, checks, merge, protected pipeline check, approved protected apply, then read-only verification.

## Backend Host Contract

| Item | Value |
| --- | --- |
| Hostname | `backend` |
| IPv4 | `65.75.201.18` |
| Target domain | `backend.nutsnews.com` |
| Target OS | Ubuntu 26.04 LTS |
| Repo | `ramideltoro/nutsnews-backend` |

## Runtime Direction

The backend runtime direction is:

- Ansible for host configuration.
- GitHub Actions protected workflow for check/apply once implemented.
- Docker Compose for backend application services.
- Caddy for reverse proxy once DNS, TLS, firewall, and health checks are ready.
- Static read-only status dashboard backed by sanitized JSON snapshots.
- PostgreSQL failover only after backup, restore, access-control, and failover design is reviewed.

No backend service is considered deployed until the protected pipeline applies it and read-only verification confirms it.

## Cloud-Init Provider Warning

Backend issue #9 verified that `cloud-init status --long` reports:

```text
status: done
extended_status: degraded done
detail: DataSourceNoCloud [seed=/dev/sr0]
errors: []
```

The recoverable warnings are deprecated NoCloud seed keys for `chpasswd.list`, `lists`, and multiline `chpasswd` syntax. The backend repo does not currently own a cloud-init template, so this is treated as provider image/bootstrap hygiene rather than an app blocker.

The backend rebuild path is Ansible plus the protected backend apply workflow. If this repo later owns cloud-init templates, they must use non-deprecated `users` and `chpasswd` syntax.

Read-only verification:

```bash
ssh -i ~/.ssh/servercheap_65_75_201_18 rami@65.75.201.18 'cloud-init status --long 2>&1 || true'
```

## Boundaries

- Public app work stays in `ramideltoro/nutsnews`.
- Existing production VPS/GitOps platform work stays in `ramideltoro/nutsnews-infra`.
- Shared documentation stays here in `ramideltoro/nutsnews-docs`.
- Backend server setup for `65.75.201.18` stays in `ramideltoro/nutsnews-backend`.

## Validation

Backend scaffold validation used:

```bash
git diff --check
/tmp/nutsnews-backend-ansible-venv/bin/ansible-playbook ansible/playbooks/bootstrap.yml --syntax-check -i ansible/inventories/production/hosts.yml
```

The Ansible CLI was installed in a temporary local virtual environment for validation only.

## Current Limitations

The backend protected apply workflow, GitHub Environment, Environment secrets, Cloudflare access, backup credentials, Supabase credentials, database credentials, and dashboard access boundary are not yet available in the backend repo.

Issues that require server mutation or provider changes must remain open until those prerequisites exist and the protected apply path is approved.
