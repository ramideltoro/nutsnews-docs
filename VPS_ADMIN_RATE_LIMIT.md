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
