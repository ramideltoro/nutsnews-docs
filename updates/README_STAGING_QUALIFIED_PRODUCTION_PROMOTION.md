# Staging-Qualified Production Promotion Update

## Simple Summary

Production VPS promotion now has one intended path: a release must pass staging
qualification first, then prove Vercel Production and production Supabase are
already compatible with the same source commit before the VPS manifest changes.

The old direct `nutsnews-production-release` dispatch is not the production
entry point.

## Intermediate Summary

The infra promotion workflow starts from a successful
`nutsnews-staging-qualification.yml` run, or a manual dispatch that names that
exact run and uses the required confirmation phrase. It verifies:

- exact staging qualification attestation;
- current successful staging deployment identity;
- same-source Vercel Production deployment;
- compatible production Supabase schema contract;
- reviewed GitOps manifest PR and checks;
- protected production apply with the complete release identity bundle.

If production Supabase is behind, promotion fails and directs the operator to
the protected app workflow `production-supabase-migration.yml`. It does not run
production migrations automatically.

## Expert Summary

The promotion path keeps evidence, review, and mutation separate. The
promotion workflow does not attach `production-vps`; it creates or reuses the
manifest PR only after Vercel, Supabase, and staging-attestation gates pass.
`Protected Ansible Apply` still performs the pre-secret production eligibility
check and post-apply Docker/public-health identity verification.

```mermaid
flowchart LR
  staging["Qualified staging run"] --> vercel["Vercel Production\nsame source commit"]
  vercel --> supabase["Production Supabase\nschema contract"]
  supabase --> pr["GitOps manifest PR"]
  pr --> apply["Protected Ansible Apply"]
  apply --> verify["Docker + /healthz identity"]
```

## Updated Docs

- `NUTSNEWS_RELEASE_PIPELINE.md`
- `NUTSNEWS_PROTECTED_ANSIBLE_APPLY.md`
- `MIGRATION_RELEASE_GATE.md`

## Remaining Risks

- `production-vps` approval may still require a human reviewer.
- Vercel, Supabase, GitHub, and the VPS are not atomic; late production apply
  failure still requires the protected rollback path.
- Secret values stay outside Git; this update documents only secret names and
  workflow boundaries.
