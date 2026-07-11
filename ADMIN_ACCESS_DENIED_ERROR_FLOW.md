# Admin Access-Denied Error Flow

This guide records the application-owned denied/error-flow parity fix for
[nutsnews #168](https://github.com/ramideltoro/nutsnews/issues/168), its link to
[nutsnews-infra #93](https://github.com/ramideltoro/nutsnews-infra/issues/93),
and the parent VPS rollout
[nutsnews-infra #67](https://github.com/ramideltoro/nutsnews-infra/issues/67).

Related application PR: [nutsnews #171](https://github.com/ramideltoro/nutsnews/pull/171).

## Simple Summary

If an admin sign-in does not work, NutsNews shows a helpful page instead of a
missing-page error. The page never shows private sign-in details and gives the
person a clear button to try signing in again.

## Intermediate Summary

Auth.js already directs its error page to `/admin/access-denied`, but the
previous app image had no page at that route. This caused
`/admin/access-denied?error=Configuration` to return HTTP 404 even though the
VPS route, public app pages, APIs, contact form, Google provider registration,
OAuth POST redirect, and allowlisted Google admin login had passed their
existing GitOps and read-only checks.

The app page maps a small allowlist of common Auth.js query values to generic
copy. It does not echo an unknown error value, provider response, token, URL,
or credential. `/admin/*` is already protected by the shared admin cache
boundary: browsers must revalidate the response and all CDN-specific headers
are `no-store`. The route is also `noindex`.

## Expert Summary

`web/app/admin/(public)/access-denied/page.tsx` is an App Router Server
Component that awaits the Next 16 `searchParams` promise. It opts into dynamic
rendering and has zero revalidation. Its message map handles `AccessDenied`,
`Configuration`, `OAuthAccountNotLinked`, `Callback`, `OAuthCallbackError`,
`OAuthSignInError`, and `CredentialsSignin`; all other values use one generic
fallback.

The existing `web/middleware.ts` and `web/next.config.ts` apply the following
admin cache and discovery controls without a new route-specific proxy rule:

- Browser: `Cache-Control: no-store, max-age=0`.
- Shared CDNs: `CDN-Cache-Control`, `Cloudflare-CDN-Cache-Control`, and
  `Vercel-CDN-Cache-Control` are all `no-store`.
- Discovery: `X-Robots-Tag: noindex, nofollow, noarchive`, with page metadata
  that also sets `noindex, nofollow, nocache`.

The standalone `npm run test:admin-access-denied` regression checks the route
contract, intentional dynamic rendering, generic handling of known and
untrusted query values, the `/admin/login` recovery link, the cache/discovery
boundaries, and the Auth.js error target. The existing axe suite continues to
check the public admin route surface for serious and critical accessibility
violations.

```mermaid
flowchart LR
  auth[Auth.js denied or error flow] --> page[/admin/access-denied]
  page --> map[Allowlisted generic message]
  map --> login[/admin/login]
  page --> boundary[Browser revalidation + CDN no-store + noindex]
  approved[Future approved app merge] --> image[Main-only immutable GHCR image]
  image --> gate[Matching Vercel Production deployment]
  gate --> promotion[Normal infra digest-promotion PR]
  promotion --> verified[Protected GitOps apply and read-only verification]
```

## Current Rollout Status

`vps.nutsnews.com` is already publicly promoted through GitOps. This page fix
does not change DNS, Cloudflare routing, `nutsnews.com`, load balancing,
failover, the Worker, application secrets, or the current VPS container.

Pull requests build and smoke-test a production-shaped image but do **not**
publish an image. Therefore app PR #171 has no production immutable digest to
promote and there is no infra promotion PR or Protected Ansible Apply to run
for this change yet.

## Future Immutable Promotion Plan

Only after an approved merge of the app PR to `nutsnews` `main` may the normal
release pipeline publish a new immutable GHCR digest. It must verify the
matching Vercel Production deployment before requesting the infra receiver.

The smallest GitOps-only promotion change is the generated normal infra PR
that uses `ansible/scripts/promote_nutsnews_release.py` to update only the
reviewed release-state fields in
`ansible/inventories/production/host_vars/vps.nutsnews.com.yml`:

- `vps_service_foundation_nutsnews_app_image_repo`
- `vps_service_foundation_nutsnews_app_image_digest`
- `vps_service_foundation_nutsnews_app_source_commit`
- `vps_service_foundation_nutsnews_app_build_id`
- `vps_service_foundation_nutsnews_app_deployment_target`
- `vps_service_foundation_nutsnews_app_last_known_good_digest`

The public-route flags stay unchanged. The digest must be a full immutable
`sha256:` value for `ghcr.io/ramideltoro/nutsnews`; tags such as `latest` are
not a deployment input. The helper records the previous digest as the
last-known-good rollback target. No VPS file, Docker Compose command, runtime
environment file, or secret may be edited by hand.

After a future approved apply, read-only verification must confirm:

1. `https://vps.nutsnews.com/health` remains healthy and infrastructure-owned.
2. `https://vps.nutsnews.com/healthz` reports the new source commit, build ID,
   and VPS target identity.
3. `/admin/access-denied?error=Configuration` returns intentional non-404
   content with the cache and discovery boundary above.
4. Static assets, public API, contact route, security headers, CORS/CSRF,
   secure cookies, Sentry identity, and writable cache retain their existing
   behavior.
5. The allowlisted Google account can complete the existing admin-login flow
   and reach `/admin`.

The final item is the only interactive check: open
`https://vps.nutsnews.com/admin/login` in a signed-in browser, choose the
already allowlisted Google account, and confirm `/admin` loads. Do not provide
credentials, cookies, tokens, or screenshots containing sensitive data to an
automation agent.

## Risks And Rollback

The error page is deliberately generic, so it may not expose enough detail to
diagnose a provider outage by itself. Operators should use sanitized Auth.js,
Vercel, and protected-workflow logs instead of adding raw error rendering.

Before promotion, rollback is a normal revert of app PR #171. After a future
promotion, rollback is an infra-only GitOps promotion of the recorded
last-known-good immutable digest, followed by the same protected apply and
read-only identity checks. Do not retag or rebuild an older image as rollback.
