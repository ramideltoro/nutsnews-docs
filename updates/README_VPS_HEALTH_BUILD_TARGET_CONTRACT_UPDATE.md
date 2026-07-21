# VPS Health Build Target Contract Update

## Summary

The shared VPS image now treats `/healthz` as a cached build identity surface.
It should report the image build target, `vps`. Runtime identity still belongs
to `/readyz` and `/api/runtime-config`, which report `vps-staging` on staging
and `production-vps` on production.

## What Changed

- App staging qualification expects `/healthz` target `vps`.
- Infra protected production smoke expects `/healthz` target `vps`.
- Readiness and runtime public config remain strict runtime guards.

## Evidence

- VPS staging deploy run `29829997650` deployed the exact image digest.
- Qualification run `29830113005` showed `/healthz` returning `vps` while the
  container env, `/readyz`, and `/api/runtime-config` reported `vps-staging`.
- The app container-image workflow already smoke-tests this split contract by
  using a separate `--expected-health-deployment-target`.
