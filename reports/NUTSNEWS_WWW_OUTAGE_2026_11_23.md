---
title: "NutsNews public website outage on November 23, 2026"
description: "Impact, verified cause, DNS recovery, and remaining secondary-hosting limits."
wiki:
  source_route: "/technical/reports/nutsnews-www-outage-2026-11-23"
  simple_route: "/simple/reports/nutsnews-www-outage-2026-11-23"
  slug: "reports/nutsnews-www-outage-2026-11-23"
  primary_diagram:
    file: "diagrams/reports/NUTSNEWS_WWW_OUTAGE_2026_11_23.mmd"
    accTitle: "NutsNews public website outage on November 23, 2026 recovery"
    accDescr: "Public DNS led to disabled Vercel hosting; readiness checks confirmed the VPS was healthy, and the controller restored proxied VPS routing."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 900
  approval:
    state: unreviewed
    publishing: blocked
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 1a362ea901e95ad3a29d95ab2b60a81bae21f132099c9b7844d29ae35f84e209
---
# NutsNews public website outage on November 23, 2026

## Outcome

At 06:44:55 EST (11:44:55 UTC), the existing Cloudflare DNS failover controller restored apex and www to the healthy VPS. Fresh Cloudflare-edge HTTPS probes returned a 200 homepage and ready production status at 06:45:32 EST. A separate backend-server check through normal DNS confirmed the homepage returned 200, readiness passed, and apex redirected to www by 06:49:48 EST (11:49:48 UTC). The operator Mac initially retained the old address in its operating-system cache.

## Impact and cause

Both https://www.nutsnews.com/ and https://nutsnews.com/ returned HTTP 402 with the Vercel error DEPLOYMENT_DISABLED. TLS and DNS resolution themselves worked. Vercel team metadata reported a soft block at 04:51:08 EST (09:51:08 UTC), with reason FAIR_USE_LIMITS_EXCEEDED and overage type fluidCpuDuration. Its reported automatic unpause time was December 23, 2026 at 04:51:08 EST. No paid upgrade or quota increase was performed.

Both public Cloudflare CNAME records pointed to edeade5949613eda.vercel-dns-017.com with proxying disabled. The direct VPS homepage, /healthz, and /readyz were healthy. The controller reported activeDnsTarget=mixed, dnsWritesEnabled=false, and lastErrorSummary="Refusing automatic failback because managed DNS is not fully on Vercel." This explains why the controller did not repair the routing. The evidence does not establish who changed DNS or disabled automatic writes, or when those changes occurred.

## Recovery

1. Confirmed the direct VPS /readyz returned ok=true, ready=true, deploymentTarget=production-vps, and databaseProviderMode=backend_postgres_primary.
2. Confirmed its source commit f04570e098b50b785fcf330d0a3502258b3e94e3 matched the existing Vercel production deployment. The VPS build ID was 42761322277-1.
3. Used the existing authenticated POST /manual-failback endpoint at https://nutsnews-dns-failover.nutsnews.workers.dev with JSON body {"confirm":"failback-to-vps"}. The bearer token was loaded privately from the operator credential store.
4. The controller returned updated:manual_failback:vps. Both managed records became CNAME vps.nutsnews.com, proxied=true, Auto TTL. No other DNS records were changed.
5. Confirmed controller status activeDnsTarget=vps, lastHealthStatus=healthy, and an empty lastErrorSummary. Automatic DNS writes remain disabled, preserving the pre-incident setting while Vercel is unavailable.

## Verification

The recovered Cloudflare edge served the homepage over verified HTTPS with HTTP 200. The apex returned HTTP 308 to https://www.nutsnews.com/. Public /readyz reported ready production status with the expected source/build identity. The public articles endpoint returned nonempty article data, and a Next.js CSS asset returned HTTP 200. Public resolver checks against 1.1.1.1 and 8.8.8.8 returned the new Cloudflare addresses, and both authoritative nameservers also returned Cloudflare addresses. An independent backend-server check through normal DNS passed homepage, readiness, and apex redirect checks by 06:49:48 EST. The operator Mac operating-system cache initially retained Vercel even after its upstream resolver returned Cloudflare.

Repeat these read-only checks after caches expire:

~~~sh
curl -fsS https://www.nutsnews.com/readyz
curl -fsS -o /dev/null -w '%{http_code}\n' https://www.nutsnews.com/
curl -fsS -o /dev/null -w '%{http_code}\n' 'https://www.nutsnews.com/api/articles?limit=2'
curl -I https://nutsnews.com/
~~~

Expect ready=true, HTTP 200 for homepage/API, and HTTP 308 to www for apex. Cloudflare Auto TTL was 300 seconds; cached clients can take longer to converge.

## Remaining limits and rollback

Vercel remains quota-blocked and is unsuitable as a fallback until its hosting is restored and verified. Do not enable automatic failover toward that disabled target merely to clear a warning. This recovery changed routing through the existing controller; it did not rebuild or replace the app, change credentials, or alter the automatic-write policy.

If VPS readiness fails, diagnose the direct origin and follow the documented recovery path. Use POST /manual-failover with {"confirm":"failover-to-vercel"} only after Vercel health and readiness have been independently verified. Keep automatic DNS writes disabled until both destinations are qualified and the operator selects the protected apply path. Treat any later CPU-limit remediation or automatic-failover policy change as separate work.

## Related docs

- [Dual-target deployment and controller operations](../NUTSNEWS_DUAL_TARGET_WEB_DEPLOYMENT.md)
- [Incident response policy](../INCIDENT_RESPONSE_POLICY.md)
- [Infra controller runbook](https://github.com/ramideltoro/nutsnews-infra/blob/main/runbooks/CLOUDFLARE_DNS_FAILOVER.md)
