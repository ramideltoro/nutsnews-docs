---
title: VPS Admin Navigation Rate Limit
wiki:
  source_route: /technical/vps-admin-rate-limit/
  simple_route: /simple/vps-admin-rate-limit/
  primary_diagram:
    file: diagrams/VPS_ADMIN_RATE_LIMIT.mmd
    accTitle: "VPS Caddy rate-limit routing"
    accDescr: "A route-aware split where auth endpoints have a lower rate limit than admin navigation paths to protect abuse while avoiding admin dashboard false positives."
  status: active
  collection: product-and-reader-experience
  section: admin-experience
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 3a6528ac01c4d3631cf9a21457f808660b4fe795064a12485e9b85898ad6b80b
---

# VPS Admin Navigation Rate Limit

The VPS Caddy edge protects authentication-sensitive traffic without making
normal NutsNews admin navigation unusable.

## Policy

The rate-limit policy is managed in
`ramideltoro/nutsnews-infra/ansible/roles/vps_service_foundation/defaults/main.yml`:

| Route group | Paths | Limit |
| --- | --- | --- |
| Auth and callback endpoints | `/api/auth/*`, `/login*`, `/ops*` | 20 requests/minute per remote host |
| Admin UI navigation | `/admin*` | 120 requests/minute per remote host |

The admin UI has its own bucket because a Next.js App Router page can issue
multiple HTML, RSC, and route requests during one navigation. Auth.js and
callback endpoints retain the lower abuse-protection budget.

## Incident symptom and diagnosis

An intermittent HTTP 429 on `/admin/login` or an admin dashboard, with an
empty Caddy response and `Retry-After`, indicates that the edge bucket was
exhausted. The application does not use this 429 response for admin pages;
the Caddy access log is the source of truth:

```bash
sudo docker logs nutsnews-caddy --since 30m | grep -E '"status":429|rate'
```

Do not edit the VPS or bypass Caddy manually. Wait for the retry window while
the incident is being investigated, then correct the policy through a normal
infra PR.

## Validation and rollout

The immutable regression test
`ansible/tests/validate_caddy_rate_limits.py` asserts that `/admin*` is not
inside the Auth.js bucket, that both buckets retain their intended paths, and
that the admin UI budget remains 120 requests per minute. Infrastructure CI
must run this test whenever Ansible content changes.

For a policy change:

1. Open a normal, ready-for-review infrastructure PR.
2. Confirm the Caddy rate-limit regression, YAML, Ansible, Compose, and security checks pass.
3. Merge only after review.
4. Run Protected Ansible Apply in `check` mode, then `apply` mode after explicit approval.
5. Verify `/health`, `/healthz`, `/admin/login`, and at least two admin dashboard navigations. Confirm that a deliberate auth-endpoint burst still returns 429 and that ordinary navigation does not.

Rollback is a Git revert of the policy PR followed by the same protected
check/apply workflow. Never hand-edit the rendered Caddy configuration.
