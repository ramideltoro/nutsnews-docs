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
- `.github/workflows/backend-backup-maintenance.yml`
- `.github/workflows/backend-controlled-maintenance.yml`
- `.github/workflows/backend-cloudflare-routing.yml`
- `.github/workflows/protected-backend-ansible-apply.yml`
- `runbooks/DEPLOYMENT_SAFETY_GATES.md`
- `runbooks/PROTECTED_BACKEND_APPLY.md`
- `scripts/backend_deployment_safety.py`
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
| `RESTIC_REPOSITORY` | Encrypted restic repository for service-aware backend backups |
| `RESTIC_PASSWORD` | Restic repository encryption password |
| `AWS_ACCESS_KEY_ID` | S3-compatible restic access key when `NUTSNEWS_BACKEND_RESTIC_PROVIDER=s3` |
| `AWS_SECRET_ACCESS_KEY` | S3-compatible restic secret key when `NUTSNEWS_BACKEND_RESTIC_PROVIDER=s3` |
| `AWS_DEFAULT_REGION` | Optional S3-compatible region |

Prefer a dedicated automation user with key-based SSH and reviewed sudo behavior. If a sudo password is temporarily used, rotate it after the automation user exists.

## Ansible Role Path

The protected workflow runs `ansible-playbook` from the repo's `ansible/` directory. The backend repo keeps its roles in `ansible/roles`, so `ansible/ansible.cfg` must remain committed with:

```ini
[defaults]
roles_path = roles
```

If the workflow fails with `the role 'backend_baseline' was not found`, confirm the checked-out commit contains `ansible/ansible.cfg` and rerun check mode before approving apply mode.

## Controlled Maintenance

Routine baseline applies are not the place for disruptive OS maintenance. The
backend baseline keeps broad `dist` upgrades, package autoremove, and automatic
reboot disabled by default. Package metadata refresh and maintenance-state
reporting can stay in the baseline path, but security updates and reboot actions
use the fixed-purpose `Backend Controlled Maintenance` workflow.

Allowed controlled-maintenance actions:

- `precheck`: read-only collection of maintenance state.
- `security-upgrade`: runs only the unattended security-upgrade path.
- `reboot`: runs only the controlled reboot path, then verifies reconnect and
  post-boot state.

The workflow has no arbitrary command input. Mutating actions require
`confirm_target=backend.nutsnews.com` and the protected `production-backend`
Environment approval gate. Reports are uploaded as
`backend-controlled-maintenance-report`.

Prechecks cover backup freshness, failed systemd units, running/latest kernel,
Docker/Caddy/backend health, root disk and inode pressure, active-alert state,
reboot-required state, package-update count, and unattended-upgrade
availability. A reboot remains blocked while backup freshness or active-alert
state is not healthy.

## Deployment Safety Gates

Backend-changing workflows have fixed safety gates:

- `Protected Backend Ansible Apply`: check mode runs a non-blocking dry-run
  gate; apply mode runs enforced preflight and post-change gates.
- `Backend Cloudflare Routing`: check mode runs a non-blocking dry-run gate;
  apply and rollback run enforced preflight and post-change gates.
- `Backend Controlled Maintenance`: uses its fixed maintenance pre/post-check
  runner for `security-upgrade` and `reboot`.
- `Backend Backup Maintenance`: starts only fixed backup, verify, and
  restore-drill systemd units, then uploads sanitized status JSON.

The gates validate required secret presence by name only, never print values,
and upload JSON/Markdown reports that list the change description, blockers,
and verified checks. Missing or unknown evidence fails closed when that evidence
is critical for the selected workflow profile.

Rollback paths are fixed-purpose:

- protected Ansible changes roll back through git revert or a rollback PR plus
  protected check/apply;
- Cloudflare routing rolls back through `run_mode=rollback`;
- security update and reboot recovery follow the controlled maintenance runbook.

Foundational work can still deploy missing safety components because current
`not_configured` Docker, app, and alert surfaces are visible but not critical
blockers for the baseline-apply profile. Backup freshness and restore
verification become healthy after the backup workflow runs `backup`, `verify`,
and `restore-drill`.

## Check Mode Service Guards

Check mode is a non-mutating preview. If the backend host does not yet have
`fail2ban`, `sysstat`, or the managed swapfile, Ansible may report the package
or file creation as a pending change and skip dependent service, permission, or
format steps until apply mode. A skipped dependent step in that case is expected;
a failed dependent step means the backend role needs another check-mode guard
before apply mode is approved.

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
