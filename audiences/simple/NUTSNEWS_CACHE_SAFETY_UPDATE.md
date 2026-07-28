---
title: NutsNews Cache Safety Update
wiki:
  source_route: /technical/nutsnews-cache-safety-update/
  simple_route: /simple/nutsnews-cache-safety-update/
  primary_diagram:
    file: diagrams/NUTSNEWS_CACHE_SAFETY_UPDATE.mmd
    accTitle: "Cache-control safety update rollout"
    accDescr: "Shows how response headers, short edge TTL, and app version guard reduce stale shell risk after deployments."
  status: active
  collection: platform-and-data
  section: core-platform
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 9f86dbd6de44d2c89015f0dfc881edc4ac8a662bc2017bd0aba1b7516006ec44
---

# NutsNews Cache Safety Update

This update prevents stale browser-cached page shells from causing UI problems immediately after a deploy.

## What changed

- Public HTML/page responses now use `Cache-Control: public, max-age=0, must-revalidate` so browsers revalidate the page shell instead of holding stale UI.
- CDN-specific headers still allow short edge caching with `s-maxage=300`, so Cloudflare/Vercel can keep serving efficiently.
- `stale-while-revalidate` on public CDN pages was reduced from 3600 seconds to 300 seconds to avoid long-lived stale UI after visual deploys.
- Static icons use long immutable caching because these are stable assets.
- Added `AppVersionGuard`, which performs a one-time browser reload after a new deployed build version is detected. This helps recover users who loaded an older app shell before the new deployment finished propagating.

## Files changed

- `web/next.config.ts`
- `web/middleware.ts`
- `web/app/layout.tsx`
- `web/app/components/AppVersionGuard.tsx`

## Notes

This update does not change the visual design. It only makes deploy transitions safer for the web app.
