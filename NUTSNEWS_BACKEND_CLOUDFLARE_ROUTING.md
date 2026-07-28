---
title: NutsNews Backend Cloudflare Routing
wiki:
  source_route: /technical/nutsnews-backend-cloudflare-routing/
  simple_route: /simple/nutsnews-backend-cloudflare-routing/
  primary_diagram:
    file: diagrams/NUTSNEWS_BACKEND_CLOUDFLARE_ROUTING.mmd
    accTitle: "Backend DNS and traffic route model"
    accDescr: "DNS-only backend records and Vercel route controls determine how requests reach backend services and tunnels."
  status: active
  collection: platform-and-data
  section: core-platform
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 3b81cd6b78f39148f4be2e66f0e784bf70128cc58e6639b1d0cafff2844e622a
---

# NutsNews Backend Cloudflare Routing

This documents the backend routing model for `backend.nutsnews.com`.

## Summary

The backend uses Cloudflare-managed DNS with a DNS-only `A` record:

| Name | Type | Target | Proxied |
| --- | --- | --- | --- |
| `backend.nutsnews.com` | `A` | `65.75.201.18` | `false` |

DNS-only is the reviewed first phase. It keeps SSH separate from Cloudflare HTTP
proxying, lets Caddy manage a public origin certificate, and avoids enabling
Cloudflare edge proxy behavior before backend app routes and edge policy are
designed.

## Origin Health

The backend protected apply installs Caddy and serves:

```text
/healthz -> ok
```

All other public paths return `404` until a reviewed backend app deployment owns
them.

## Apply Path

Backend repo workflows:

- `Protected Backend Ansible Apply` installs Caddy, opens reviewed HTTP/HTTPS
  ports, and verifies direct-origin health.
- `Backend Cloudflare Routing` checks, applies, or rolls back the Cloudflare DNS
  record through the protected `production-backend` Environment.

DNS apply mode verifies the origin first with:

```bash
curl --resolve backend.nutsnews.com:80:65.75.201.18 http://backend.nutsnews.com/healthz
```

## Verification

```bash
dig +short backend.nutsnews.com A
curl -fsS https://backend.nutsnews.com/healthz
curl -Iv https://backend.nutsnews.com/healthz
```

Expected health response:

```text
ok
```

## Rollback

Run `Backend Cloudflare Routing` with `run_mode=rollback` and
`confirm_apply=backend.nutsnews.com`. If the origin listener also needs removal,
revert the backend routing PR and run the protected backend Ansible check/apply
path.
