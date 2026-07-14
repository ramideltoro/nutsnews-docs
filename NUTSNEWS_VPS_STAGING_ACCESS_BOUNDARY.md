# NutsNews VPS Staging Access And Credential Boundary

Status: implemented and verified offline; not deployed or live. Issue
`nutsnews-infra#120` must remain open until separately approved provider/VPS
applies and read-only live verification succeed.

## Easy Summary

Production and staging share one physical VPS, but they do not share an app
container, Docker project/network, files, writable state, release state, or
credentials. `staging.nutsnews.com` is an additive hostname that can reach only
`nutsnews-app-staging`.

Cloudflare Access is the front door. An approved person signs in through a
browser; an independent test runner uses a service token. The VPS also verifies
Cloudflare's signed Access token, so a request sent directly to the origin IP
does not bypass the front door. `noindex` headers are defense in depth, not the
access control.

Nothing in the offline pull request changes the live host, DNS, Cloudflare, or
production. Do not call staging live before the protected applies and the live
checklist in this guide pass.

## Intermediate Summary

| Boundary | Responsibility | Credentials it may receive | Credentials it must not receive |
| --- | --- | --- | --- |
| `staging-vps` | Submit immutable candidate configuration to the VPS fixed command | restricted SSH private key, known hosts, staging server runtime JSON | production secrets, provider-admin token, qualifier/test user credentials |
| `staging-tests` | Probe the protected hostname from an off-VPS runner | Cloudflare Access client ID/secret and future synthetic test-user material | SSH, Ansible, provider admin, app service-role/runtime secrets, production secrets |
| `cloudflare-admin` | Apply only the reviewed staging DNS/Access OpenTofu root | scoped Cloudflare token, state backend, account/zone/provider IDs | app runtime secrets, deploy SSH, test-user credentials |
| `production-vps` | Existing protected host baseline; opt-in installation of the staging origin boundary and forced command | existing production administration plus non-value staging Access verifier inputs and the deploy public key | staging deploy private key and qualifier token secret |

The staging SSH public key is installed for `nutsnews_staging_deploy` with an
OpenSSH forced command and `restrict`. The account has sudo permission for one
root-owned gateway only. The gateway rejects `SSH_ORIGINAL_COMMAND` and accepts
only JSON operations `check`, `apply`, and `verify`. It runs the root-owned
staging-only bundle whose recorded infra commit must equal the request. It
cannot select production, run a caller-provided shell command, or rewrite
production paths.

The staging app env remains `/etc/nutsnews/nutsnews-staging-app.env`, owned by
`root:root` with mode `0600`; secret-bearing Ansible tasks use `no_log: true`.
The renderer rejects test-user fields, an equal production/staging Supabase
project identity, a non-staging site/auth URL, live email, and incomplete
staging configuration.

## Expert Summary

```mermaid
flowchart LR
  Browser["Authorized browser"] --> Access["Cloudflare Access\nbrowser policy"]
  Qualifier["Off-VPS qualifier\nstaging-tests only"] --> Token["Cloudflare service token"]
  Token --> Access
  Access -->|"signed application JWT"| Caddy["Caddy\nstaging.nutsnews.com"]
  Direct["Direct origin request"] --> Caddy
  Caddy --> Verify["JWT verifier\nRS256 + iss + aud + exp/nbf"]
  Verify -->|"valid only"| StageNet["nutsnews-edge-staging"]
  StageNet --> StageApp["nutsnews-app-staging\nimmutable @sha256"]
  Caddy -->|"existing unchanged route"| ProdNet["nutsnews-edge"]
  ProdNet --> ProdApp["nutsnews-app\nproduction"]

  Deploy["staging-vps workflow"] --> SSH["restricted SSH key"]
  SSH --> Forced["forced check/apply/verify gateway"]
  Forced --> StageApp
  CFAdmin["cloudflare-admin\nfixed OpenTofu root"] --> Access
  Protected["production-vps\nopt-in Protected Ansible Apply"] --> Verify
  Protected --> Forced
```

Cloudflare owns the proxied DNS record and the self-hosted Access application.
The browser policy allows exact email addresses; the service-auth policy allows
one provider-created service token ID. The service token secret is deliberately
not an OpenTofu resource output or state value. The Access application audience
and team domain configure the origin verifier. The verifier fetches the team
JWKS, accepts only RS256, selects the configured key ID, validates the RSA
signature and expected issuer/audience, and applies bounded clock skew.

Caddy's production source remains byte-for-byte the prior `Caddyfile` when
staging access is disabled. Enabling the opt-in template inserts one host block
between the existing production and Ops Portal blocks. That block adds private
no-store/noindex/security headers, invokes `forward_auth`, and proxies only
`nutsnews-app-staging:3000`. Caddy is connected additively to
`nutsnews-edge-staging`; production stays on `nutsnews-edge` with its existing
hostname, imports, headers, authentication, upstream, and digest.

## Runtime Topology

| Item | Production | Staging |
| --- | --- | --- |
| Compose project | `nutsnews-app` | `nutsnews-staging` |
| App container/upstream | `nutsnews-app` | `nutsnews-app-staging` |
| Network | `nutsnews-edge` | `nutsnews-edge-staging` |
| App directory | `/opt/nutsnews/apps/nutsnews` | `/opt/nutsnews/apps/nutsnews-staging` |
| Env file | `/etc/nutsnews/nutsnews-app.env` | `/etc/nutsnews/nutsnews-staging-app.env` |
| Release/apply/LKG state | production-only paths | `/opt/nutsnews/ops/apps/staging/*` |
| Writable cache | `nutsnews-app-cache` | `nutsnews-app-staging-cache` |
| Hostname | unchanged `vps.nutsnews.com` | additive `staging.nutsnews.com` |
| Edge access | unchanged | Cloudflare Access plus origin JWT validation |

The #118 ceilings remain one CPU, 512 MiB memory limit, 256 MiB reservation,
128 PIDs, and 10 MiB times three app logs. The Access verifier adds a bounded
64 MiB/64 PID/5 MiB times two-log service. The app image remains
`ghcr.io/ramideltoro/nutsnews@sha256:<digest>`; staging never rebuilds it.

## Environment-Specific Application Configuration

`NUTSNEWS_STAGING_APP_ENVS_JSON` is one protected transport bundle, not a file
to commit. It must contain staging-owned values for:

- Supabase URL/project, public anonymous key, and service-role key;
- the production Supabase project reference only as a non-secret mismatch
  sentinel—never a production key or URL credential;
- app OAuth client ID/secret, `AUTH_SECRET`, and `NEXTAUTH_URL` set to
  `https://staging.nutsnews.com`;
- staging Turnstile site/secret keys;
- staging Sentry endpoint/environment (delivery remains disabled by the app's
  staging side-effect policy);
- `NUTSNEWS_EMAIL_MODE=disabled` or a dedicated sandbox; disabled mode rejects
  a Resend key;
- `NUTSNEWS_SITE_URL=https://staging.nutsnews.com` and staging runtime identity.

Test-user credentials or namespaces must not appear in this bundle. They
belong only in `staging-tests`. Staging side effects remain disabled by default,
so it cannot send real email, write production telemetry, invoke production
ingestion, or use production data.

Important application limitation: the currently merged application safety
contract refuses application OAuth callbacks outside a live production
runtime. The isolated client/callback values should still be onboarded, but
full application OAuth verification remains pending a separately reviewed app
change that preserves fail-closed side effects. Cloudflare browser auth is
independent and can be verified now.

## Exact Onboarding

All rows are `not configured` until names-only inventory confirms them. Never
paste values into a terminal command line, issue, PR, log, or document.

| Secret name | Provider/owner | GitHub Environment | Source/UI path | Required scope | New? | Safe command |
| --- | --- | --- | --- | --- | --- | --- |
| `NUTSNEWS_STAGING_VPS_SSH_PRIVATE_KEY` | operator/OpenSSH | `staging-vps` | generate offline with `ssh-keygen -t ed25519`; keep private half here | authenticates only forced `nutsnews_staging_deploy` key | yes | `gh secret set NUTSNEWS_STAGING_VPS_SSH_PRIVATE_KEY --env staging-vps --repo ramideltoro/nutsnews-infra < /secure/path/staging_deploy` |
| `NUTSNEWS_STAGING_VPS_KNOWN_HOSTS` | VPS/OpenSSH | `staging-vps` | independently verify VPS host key, then save a namespaced known-hosts file | exact VPS host key only | yes | `gh secret set NUTSNEWS_STAGING_VPS_KNOWN_HOSTS --env staging-vps --repo ramideltoro/nutsnews-infra < /secure/path/staging_known_hosts` |
| `NUTSNEWS_STAGING_APP_ENVS_JSON` | staging providers | `staging-vps` | compose offline from the provider settings listed above | staging runtime only; no test users or production keys | yes | `gh secret set NUTSNEWS_STAGING_APP_ENVS_JSON --env staging-vps --repo ramideltoro/nutsnews-infra < /secure/path/staging-app-envs.json` |
| `NUTSNEWS_STAGING_ACCESS_CLIENT_ID` | Cloudflare | `staging-tests` | Zero Trust → Access controls → Service credentials → Service Tokens | one token selected by the staging service-auth policy | yes | `gh secret set NUTSNEWS_STAGING_ACCESS_CLIENT_ID --env staging-tests --repo ramideltoro/nutsnews-infra < /secure/path/access-client-id` |
| `NUTSNEWS_STAGING_ACCESS_CLIENT_SECRET` | Cloudflare | `staging-tests` | same creation screen; shown once | paired staging token only | yes | `gh secret set NUTSNEWS_STAGING_ACCESS_CLIENT_SECRET --env staging-tests --repo ramideltoro/nutsnews-infra < /secure/path/access-client-secret` |
| `NUTSNEWS_STAGING_ACCESS_TOFU_BACKEND_CONFIG` | R2/S3 backend | `cloudflare-admin` | dedicated state bucket/access-key UI | bucket/prefix for this root only | yes | `gh secret set NUTSNEWS_STAGING_ACCESS_TOFU_BACKEND_CONFIG --env cloudflare-admin --repo ramideltoro/nutsnews-infra < /secure/path/staging-access-backend.hcl` |
| `NUTSNEWS_STAGING_ACCESS_CLOUDFLARE_API_TOKEN` | Cloudflare | `cloudflare-admin` | My Profile → API Tokens → Create custom token | DNS Edit for `nutsnews.com`; Access Apps and Policies Write for the account | yes | `gh secret set NUTSNEWS_STAGING_ACCESS_CLOUDFLARE_API_TOKEN --env cloudflare-admin --repo ramideltoro/nutsnews-infra < /secure/path/cloudflare-token` |
| `NUTSNEWS_STAGING_ACCESS_CLOUDFLARE_ACCOUNT_ID` | Cloudflare | `cloudflare-admin` | dashboard account overview | identifier only | no | `gh secret set NUTSNEWS_STAGING_ACCESS_CLOUDFLARE_ACCOUNT_ID --env cloudflare-admin --repo ramideltoro/nutsnews-infra < /secure/path/account-id` |
| `NUTSNEWS_STAGING_ACCESS_CLOUDFLARE_ZONE_ID` | Cloudflare | `cloudflare-admin` | `nutsnews.com` zone overview | identifier only | no | `gh secret set NUTSNEWS_STAGING_ACCESS_CLOUDFLARE_ZONE_ID --env cloudflare-admin --repo ramideltoro/nutsnews-infra < /secure/path/zone-id` |
| `NUTSNEWS_STAGING_ACCESS_ORIGIN_IPV4` | VPS provider | `cloudflare-admin` | VPS network overview | existing VPS IPv4 only | no | `gh secret set NUTSNEWS_STAGING_ACCESS_ORIGIN_IPV4 --env cloudflare-admin --repo ramideltoro/nutsnews-infra < /secure/path/origin-ipv4` |
| `NUTSNEWS_STAGING_ACCESS_BROWSER_EMAILS_JSON` | operator | `cloudflare-admin` | offline JSON array of exact authorized emails | browser allowlist only | yes | `gh secret set NUTSNEWS_STAGING_ACCESS_BROWSER_EMAILS_JSON --env cloudflare-admin --repo ramideltoro/nutsnews-infra < /secure/path/browser-emails.json` |
| `NUTSNEWS_STAGING_ACCESS_SERVICE_TOKEN_ID` | Cloudflare | `cloudflare-admin` | service token details page; provider ID, not client secret | exact qualifier token ID | yes | `gh secret set NUTSNEWS_STAGING_ACCESS_SERVICE_TOKEN_ID --env cloudflare-admin --repo ramideltoro/nutsnews-infra < /secure/path/service-token-id` |
| `NUTSNEWS_STAGING_ACCESS_TEAM_DOMAIN` | Cloudflare | `production-vps` | Zero Trust → Settings → Custom Pages/organization domain | `<team>.cloudflareaccess.com` only | no | `gh secret set NUTSNEWS_STAGING_ACCESS_TEAM_DOMAIN --env production-vps --repo ramideltoro/nutsnews-infra < /secure/path/team-domain` |
| `NUTSNEWS_STAGING_ACCESS_AUDIENCE` | Cloudflare | `production-vps` | Access application → overview → Application Audience (AUD) | staging application audience only | generated by apply | `gh secret set NUTSNEWS_STAGING_ACCESS_AUDIENCE --env production-vps --repo ramideltoro/nutsnews-infra < /secure/path/staging-aud` |
| `NUTSNEWS_STAGING_DEPLOY_PUBLIC_KEY` | operator/OpenSSH | `production-vps` | public half of the new restricted deploy key | one `ssh-ed25519` public key | yes | `gh secret set NUTSNEWS_STAGING_DEPLOY_PUBLIC_KEY --env production-vps --repo ramideltoro/nutsnews-infra < /secure/path/staging_deploy.pub` |

Any future synthetic app test user goes only in `staging-tests`, under names
defined by the independent qualifier issue. It is intentionally not invented
here.

## Safe Apply And Verification Procedure

1. Merge the reviewed infra PR only after all required checks pass. Do not
   close issue #120.
2. Onboard the names above and confirm with names-only inventory.
3. Run `Cloudflare Access Apply` from protected `main` with `run_mode=plan`.
   Review that only the staging A record, Access app, and its two policies are
   in scope. With separate explicit approval, rerun `run_mode=apply` and
   `confirm_apply=staging.nutsnews.com`.
4. Store the resulting staging Application Audience and existing team domain
   through stdin as described above. Do not print state or secret outputs.
5. Run `Protected Ansible Apply` with `run_mode=check`,
   `enable_staging_access=true`, normal production options preserved, and no
   apply confirmation. Review the plan for the verifier, forced user/bundle,
   Caddy additive host, and staging-network connection only.
6. With a separate explicit approval, rerun it with `run_mode=apply`,
   `confirm_apply=vps.nutsnews.com`, and `enable_staging_access=true`.
7. Run `Staging Access Probe`. It must deny anonymous access and return 200 for
   an authenticated `/healthz` request without retaining bodies/cookies.
8. Perform read-only verification: listening sockets/published ports; Docker
   projects, containers, digests, networks, limits and upstreams; env filenames,
   owners and modes without contents; active Caddy config/TLS; authenticated and
   anonymous HTTPS; staging `/healthz` and `/readyz`; production health and route.

## Failure And Rollback

- Provider apply failure: do not enable the VPS route. Fix the reviewed module
  or credentials and rerun plan; never hand-edit DNS/Access as a substitute.
- Protected check/apply failure: production remains on its existing project,
  network, route and digest. Do not retry with staging isolation disabled.
- Access verification failure: remove/disable only the staging Access app/record
  through a reviewed OpenTofu change, or rerun Protected Ansible Apply with
  `enable_staging_access=false`. Do not change the production host block.
- Staging app failure: use the existing fixed staging deployment history and
  staging-only rollback state. Never point staging at production or rebuild the
  application image.
- Lost deploy key: generate a new pair, replace the public key through the
  protected host apply and the private key in `staging-vps`, then revoke the old
  key. Do not grant the staging key to `nutsnews_ops`.

## Troubleshooting

- Anonymous 200: stop; Access or origin JWT validation is bypassed. Do not run
  qualification.
- Authenticated 401: verify service-token policy/ID, token rotation, team domain
  and app audience by name/path without logging values.
- Browser login works but app OAuth does not: distinguish Cloudflare Access from
  the application's currently fail-closed staging OAuth behavior noted above.
- 502 after Access: confirm Caddy and `nutsnews-staging-access` are on
  `nutsnews-edge-staging`, then confirm `nutsnews-app-staging` is healthy.
- Forced command returns `unreviewed_infra_commit`: the installed root-owned
  bundle and workflow commit differ. Run the protected host check/apply; do not
  bypass the commit check.
- Readiness fails: inspect sanitized reason codes and release identity only. Do
  not print the env file or response bodies containing authentication material.

## Current Honest Status

Offline code, tests, workflow boundaries, environment containers and protected
branch policies can be complete before deployment. DNS, Access resources,
secret values, the forced VPS identity, active Caddy/TLS, and live probes remain
`not configured` until the approved steps above run. Issue #120 remains open.
