# Staging Bundle Marker Refresh Update

## Simple Summary

The VPS staging deploy bundle now stays tied to the infra commit that production
automation just reviewed. This prevents valid staging deployments from being
rejected because the server still remembers an older infra commit.

## Intermediate Summary

The staging fixed command compares the incoming infra workflow commit with the
root-owned marker in `/opt/nutsnews/staging-deploy-bundle/infra-commit`. After a
production release path updated infra without refreshing that bundle marker,
staging refused the next app candidate with `unreviewed_infra_commit`.

The targeted infra fix updates automated production release, pre-merge
production, and fixed rollback dispatches to call Protected Ansible Apply with
`enable_staging_access=true`. The same fix keeps the protected app health guard
aligned with the live VPS app identity by expecting `/healthz` to report
`production-vps`.

## Expert Summary

Protected Ansible Apply already owns the reviewed path that can refresh
staging-access material on the VPS. Enabling `enable_staging_access` in the
automated app-release callers avoids a split-brain state where the reviewed
infra manifest is current but the root-owned staging bundle remains pinned to
an older commit. Staging deploys should continue to fail closed if the marker
does not match the workflow commit; the recovery path is to rerun reviewed
Protected Ansible Apply, not to edit the marker manually.

This update also documents that VPS public app identity checks use
`production-vps` for `/healthz`, `/readyz`, and `/api/runtime-config`.

## Validation Evidence

- Related blocker:
  https://github.com/ramideltoro/nutsnews-infra/issues/314
- Local infra validation:
  - `python3 ansible/tests/validate_release_promotion.py`
  - `python3 ansible/tests/validate_production_eligibility.py`
  - `python3 ansible/tests/validate_gate_rehearsal.py`
  - `python3 ansible/tests/validate_app_deployment.py`
  - `python3 ansible/tests/validate_staging_deployment.py`
  - `/tmp/nutsnews-infra-314-venv/bin/python ansible/tests/validate_staging_access_boundary.py`
