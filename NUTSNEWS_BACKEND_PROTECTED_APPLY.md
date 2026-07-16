# NutsNews Backend Protected Apply

This documents the protected apply workflow for `ramideltoro/nutsnews-backend`.

## Purpose

The backend protected apply workflow is the normal mutation path for the backend server at `65.75.201.18`.

Routine backend host changes must go through:

```text
commit -> PR -> checks -> merge -> protected check -> approved apply -> read-only verification
```

SSH from an operator machine remains for read-only verification or documented break-glass recovery.

## Workflow

The backend repo adds:

- `.github/workflows/backend-checks.yml`
- `.github/workflows/protected-backend-ansible-apply.yml`
- `runbooks/PROTECTED_BACKEND_APPLY.md`
- `scripts/validate_no_secret_files.py`

The protected workflow is manual-only, defaults to check mode, and uses the GitHub Environment named `production-backend`.

Use [Backend Credential Bootstrap](NUTSNEWS_BACKEND_CREDENTIAL_BOOTSTRAP.md) to create or update that Environment, set non-secret variables, load provider secrets, and run the protected readiness workflow.

## Required Environment Secrets

The backend `production-backend` Environment needs:

| Secret | Purpose |
| --- | --- |
| `NUTSNEWS_BACKEND_SSH_PRIVATE_KEY` | Private key for backend Ansible SSH |
| `NUTSNEWS_BACKEND_KNOWN_HOSTS` | Verified `known_hosts` entry for `65.75.201.18` |

Optional early-bootstrap secrets:

| Secret | Purpose |
| --- | --- |
| `NUTSNEWS_BACKEND_ANSIBLE_USER` | Override for the inventory SSH user |
| `NUTSNEWS_BACKEND_BECOME_PASSWORD` | Sudo password if passwordless sudo is not ready |

Prefer a dedicated automation user with key-based SSH and reviewed sudo behavior. If a sudo password is temporarily used, rotate it after the automation user exists.

## Current Limitation

The workflow cannot prove issue #10 complete until:

- the `production-backend` Environment exists,
- the required secrets are added,
- the environment approval gate is configured,
- check mode runs successfully,
- apply mode is approved and succeeds,
- a fresh read-only SSH audit confirms the backend host matches repo-managed desired state.

Until then, issue #10 should remain open even though the pipeline definition exists.

## Validation

The backend pipeline PR used:

```bash
git diff --check
python3 scripts/validate_no_secret_files.py
actionlint .github/workflows/backend-checks.yml .github/workflows/protected-backend-ansible-apply.yml
/tmp/nutsnews-backend-ansible-venv/bin/ansible-playbook ansible/playbooks/bootstrap.yml --syntax-check -i ansible/inventories/production/hosts.yml
```
