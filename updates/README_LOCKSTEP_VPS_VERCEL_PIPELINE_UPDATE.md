# VPS and Vercel Production Lockstep Update

## Simple Summary

Production deployments now stay in lockstep: VPS and Vercel Production must both pass on the same locked release identity, and deployment failure on either side triggers the fixed rollback/redeploy recovery path instead of leaving one service on a different version.

## Intermediate Summary

This update makes release promotion and rollback behavior deterministic after the latest production pipeline hardening:

- In `nutsnews-infra/.github/workflows/nutsnews-release-promotion.yml`:
  - The production Vercel dispatch step always writes `run_id`, `run_url`, `run_conclusion`, and `deploy_failed` outputs, even if the run cannot be discovered.
  - `deploy_failed` is explicitly set to `true` when Vercel never starts or does not complete successfully, so subsequent rollback step is always deterministic.
- In `nutsnews-infra/.github/workflows/protected-nutsnews-rollback.yml`:
  - Rollback now captures `HEAD^` manifest content and passes it to rollback selection as a fallback when manifest history is too short.
  - Rollback now redeploys restored digest to Vercel Production after protected Ansible apply succeeds, so VPS+Vercel are repaired together.
- In `nutsnews-infra/ansible/scripts/rollback_nutsnews_release.py`:
  - Rollback selection accepts an optional `--previous-manifest` input for short-history recovery.
  - Fallback behavior can still select the recorded last-known-good digest from the previous manifest when git history cannot be walked.
- In `nutsnews-infra/ansible/scripts/verify_production_eligibility.py`:
  - Rollback verification reuses the same short-history fallback by validating a restored digest from checked `previous-manifest`.
- In `nutsnews/.github/workflows/vercel-production-release.yml`:
  - The workflow no longer rewrites `HOME`, `PATH`, or `SHELL` inside `.vercel/.env.production.local`; the local build now runs with workflow-managed environment control.

This change affects operators, release automation, and incident response because a production promotion failure in Vercel now always routes into the same controlled recovery sequence as a VPS release failure.

## Expert Summary

## What changed

- Promotion now enforces deterministic outputs in the coupled Vercel wait step:
  - if the workflow cannot identify a Vercel run after dispatch, it marks deployment as failed and surfaces explicit failure output.
  - rollback logic can rely on workflow outputs and does not proceed without an explicit `deploy_failed` signal.
- Protected rollback workflows now keep manifest continuity:
  - `rollback_nutsnews_release.py` writes rollback evidence from current and optional previous manifest, then writes rollback identity to workflow outputs.
  - `protected-nutsnews-rollback.yml` keeps the protected-apply run id in step output and includes it in retention summary.
  - rollback path can recover the last-known-good digest from a passed-in previous manifest when git history depth is insufficient.
- Vercel lockstep recovery now has an explicit restore dispatch path:
  - rollback workflow dispatches the restored release and waits for restore deploy completion.
  - restore metadata is recorded for post-rollback audit/review.
- Pipeline tests now include the new lockstep/restore checks:
  - `ansible/tests/validate_production_rollback.py`
  - `ansible/tests/validate_production_eligibility.py`
  - `ansible/tests/validate_release_promotion.py`
  - `ansible/tests/validate_gate_rehearsal.py`

## Why this changed

An earlier state could produce a successful VPS promotion while Vercel deployment failed and returned no usable run metadata, making the coupling claim unreliable. The new behavior ensures both systems either complete together on the same release identity or enter a controlled rollback/redeploy path.

## Who is affected

- Release engineers monitoring `nutsnews-release-promotion.yml` and `protected-nutsnews-rollback.yml`
- Operators approving `production-vps` protected runs
- Teams triaging post-release partial-state incidents

## Behavior difference

Before:
- Vercel failure or missing workflow-discovery state could hide as an unclear partial release.
- Protected rollback depended on in-repo manifest history being present.

After:
- Rollback/redeploy can proceed even when git history depth is insufficient.
- A failed Vercel stage emits explicit `deploy_failed=true`, and recovery path runs with known evidence IDs.
- Rollback now includes a verified Vercel redeploy of the restored digest.

## Risks, mitigations, and rollback notes

Risk: rollback fallback may validate restored metadata from fallback input instead of deep history.
Mitigation: fallback requires `previous_manifest.last_known_good_digest == restored_digest`, and normal path still prefers git history when present.

Risk: Vercel redeploy may fail for environment/config reasons unrelated to restored digest.
Mitigation: restore run evidence is captured in artifacts; operators run normal read-only verification after restore and can rerun rollback flow from fixed manifest state.

Risk: a failed Vercel child workflow can be hidden if the parent promotion
workflow fails before writing `run_conclusion` and `deploy_failed` outputs.
Mitigation: infra PR #269 fixes the observed jq quoting bug in
`nutsnews-release-promotion.yml` and adds regression coverage for the
`deploy_failed` output path. The observed failure was promotion run
`29697948255`, where Vercel child run `29698142670` failed but the parent hit
`failed to parse jq expression` while reading the conclusion.

Rollback notes:
- If a release is already partially coupled, trigger the existing fixed rollback path first through the protected rollback workflow and follow standard environment/environmental verification.
- If the Vercel API is unavailable, the workflow surfaces deployment failure and skips silent success paths; manual release re-run requires a fresh promotion input identity.

## Mermaid flow

```mermaid
flowchart TD
  A[Promote NutsNews Production Release] --> B[Verify staging qualification + Supabase contract + PR checks]
  B --> C[Protected Ansible Apply (VPS)]
  C --> D{Vercel dispatch starts and completes}
  D -->|fail| E[deploy_failed=true]
  E --> F[Protected rollback workflow]
  F --> G[Rollback manifest write + fixed rollback PR]
  G --> H[Protected rollback apply]
  H --> I[Redeploy restored digest to Vercel]
  D -->|success| J[Deployment URLs and aliases confirm restored commit]
  J --> K[Coupled release complete]
```

## References

- `ramideltoro/nutsnews-infra/.github/workflows/nutsnews-release-promotion.yml`
- `ramideltoro/nutsnews-infra/.github/workflows/protected-nutsnews-rollback.yml`
- `ramideltoro/nutsnews-infra/ansible/scripts/rollback_nutsnews_release.py`
- `ramideltoro/nutsnews-infra/ansible/scripts/verify_production_eligibility.py`
- `ramideltoro/nutsnews/.github/workflows/vercel-production-release.yml`
- Infra PR #269: https://github.com/ramideltoro/nutsnews-infra/pull/269
- Parent promotion failure-output evidence: https://github.com/ramideltoro/nutsnews-infra/actions/runs/29697948255
- Failed Vercel child evidence: https://github.com/ramideltoro/nutsnews/actions/runs/29698142670

## Related issues

- Production lockstep and rollback hardening (in current active deployment pipeline queue)
