# Vercel Promotion Rollback Guard Update

## Short Summary

Infra promotion now locates Vercel production deploy runs by source commit
instead of a brittle run title, and rollback cannot start without rechecking a
located failed Vercel run.

## What Changed

The infra promotion workflow was hardened after promotion run
`29832194739` dispatched Vercel production run `29832933332` for app commit
`d1ec4f790f2e8e4691fc57337b86188148674ef0`.

The app Vercel workflow completed successfully, but the infra wait step was
still looking for an older display title shape. That made the parent promotion
classify the Vercel deploy as missing and incorrectly dispatch rollback run
`29833155638`. Rollback PR `#322` merged a manifest restore to older app commit
`b0c602bfcadb4d563aade92b77cf79cd8c666edb`; the protected rollback apply run
`29833305972` was canceled before the canceled Ansible baseline reached image
verification or production smoke checks.

The follow-up infra fix:

- restores the reviewed production manifest to app commit
  `d1ec4f790f2e8e4691fc57337b86188148674ef0`;
- finds the Vercel production workflow by workflow file, repository dispatch
  event, branch, dispatch timestamp, and `headSha`;
- allows automated VPS rollback only when a Vercel run id exists;
- rechecks the located Vercel run before rollback and refuses rollback if the
  run belongs to another commit, is still running, succeeded, or changed
  conclusion;
- fails promotion when the Vercel run is missing and no protected rollback
  completed.

## Operational Impact

Operators should treat a missing Vercel workflow run as a promotion automation
failure, not proof that the released app is bad. The safe response is to inspect
the dispatch/run discovery path and rerun promotion after the guard is fixed.
Do not use protected rollback unless a located Vercel production run for the
same source commit completed with a non-success result, or production health
verification proves the deployed release is actually broken.

## Verification

Expected infra validation:

- `python3 ansible/tests/validate_release_promotion.py`
- `python3 ansible/tests/validate_production_eligibility.py`
- `python3 ansible/tests/validate_gate_rehearsal.py`
- `python3 ansible/tests/validate_production_rollback.py`
- `actionlint .github/workflows/nutsnews-release-promotion.yml`

## Related Work

- `ramideltoro/nutsnews-infra` issue `#323`
- `ramideltoro/nutsnews-infra` promotion run `29832194739`
- `ramideltoro/nutsnews` Vercel production run `29832933332`
- canceled rollback run `29833155638`
- canceled protected rollback apply run `29833305972`
