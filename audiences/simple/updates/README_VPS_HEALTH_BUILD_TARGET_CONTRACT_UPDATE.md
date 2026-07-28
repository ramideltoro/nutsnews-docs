---
title: VPS Health Build Target Contract Update
wiki:
  source_route: /technical/updates/readme-vps-health-build-target-contract-update/
  simple_route: /simple/updates/readme-vps-health-build-target-contract-update/
  primary_diagram:
    file: diagrams/updates/README_VPS_HEALTH_BUILD_TARGET_CONTRACT_UPDATE.mmd
    accTitle: "VPS Health Build Target Contract Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: d10703a222df10ff0ac07af64662b585aef6b9926813c5ffe100014e45d94358
---

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
