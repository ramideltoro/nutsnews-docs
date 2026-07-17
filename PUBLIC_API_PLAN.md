# Public API Plan

Related issue: `ramideltoro/nutsnews#39`

Status: planning only. This document does not approve or implement a new public API route.

## Simple Summary

NutsNews may later offer a small read-only public API for approved reader and partner use cases. The first version should expose only public story-card data that already appears on the site, keep private review and operational fields hidden, and rely on conservative rate limits plus CDN caching.

## Intermediate Summary

The current `/api/articles` and `/api/search` routes are public compatibility surfaces for the web app and iOS app, but they are not yet a documented third-party developer product. A formal public API should be additive and versioned, for example under `/api/public/v1/*`, so existing clients keep their contract while external consumers get a stable, intentionally limited surface.

The first version should support read-only article discovery, single-article lookup by public ID or slug, and optional search/category filtering. It should not expose admin state, source scoring internals, AI prompts, model decisions, worker run metadata, analytics, audit logs, credentials, or unpublished/rejected content.

## Expert Summary

Public API implementation should happen only after the endpoint inventory, contract tests, abuse limits, cache policy, privacy review, and rollback plan are ready. The API should reuse existing public article serialization patterns where safe, but it must not silently change the current iOS/web compatibility contract documented in [Public API Contract Tests](PUBLIC_API_CONTRACT_TESTS.md).

The first release target is a cache-friendly, unauthenticated read API with bounded query parameters, deterministic response shapes, explicit pagination, and no write operations. If usage or abuse risk grows, API keys can be added as a second phase without changing the anonymous read contract.

## Use Cases

| Use case | Supported in first public version? | Notes |
| --- | --- | --- |
| Display the latest positive-news headlines in a small widget | Yes | Return recent public article cards with source attribution and original links. |
| Search the public archive by keyword | Yes, bounded | Keep query length, page size, and result count limited. |
| Filter by category or language | Yes | Use the same public category and language concepts visible in the reader UI. |
| Fetch one public story for preview or sharing | Yes | Use a stable public ID or slug; return only public card/detail fields. |
| Build large mirrors, bulk exports, or datasets | No | Require separate review because of publisher rights, traffic, and retention concerns. |
| Trigger ingestion, translation, review, or refresh jobs | No | These remain internal Worker/admin operations. |
| Read admin review decisions or AI audit logs | No | These are protected operational records. |
| Track reader-level behavior | No | Public API must not expose analytics or personal/device state. |

## Proposed Endpoint Shape

Use versioned routes so the contract can evolve without breaking app or iOS clients:

| Endpoint | Purpose | Request notes |
| --- | --- | --- |
| `GET /api/public/v1/articles` | Recent public article cards | `page` or cursor, `limit`, `category`, `lang`; fixed maximum limit. |
| `GET /api/public/v1/articles/{id}` | One public article | `id` is opaque and stable; unpublished, rejected, or removed stories return `404`. |
| `GET /api/public/v1/search` | Bounded public archive search | `q`, `page` or cursor, `limit`, `lang`; short queries return an empty success response. |
| `GET /api/public/v1/openapi.json` | Machine-readable contract | Generated from the same source as contract tests once implementation starts. |

Do not repurpose `/api/articles` or `/api/search` as the third-party contract without a reviewed migration. Those routes already carry web and iOS compatibility expectations.

## Exposed Fields

First-version responses should expose only public fields needed for display and attribution.

| Field | Expose? | Notes |
| --- | --- | --- |
| `id` | Yes | Opaque stable public identifier. Do not require consumers to infer database shape. |
| `url` or `article_url` | Yes | NutsNews article/detail URL if a public article page exists. |
| `original_url` | Yes | Publisher destination URL for attribution and click-through. |
| `source` | Yes | Publisher display name. |
| `title` | Yes | Public article title in the requested or fallback language. |
| `summary` | Yes | Public summary text, bounded to the same content policy as the site. |
| `category` | Yes | Public category label or slug. |
| `image_url` | Yes, nullable | Public thumbnail URL only; do not expose image-processing internals. |
| `published_at` | Yes, nullable | Publisher timestamp when known. |
| `published_on_site_at` | Yes, nullable | NutsNews publication timestamp when available. |
| `language_code` | Yes | Response language. |
| `translation_available` | Yes | Boolean language availability metadata. |
| `next_cursor` or `next_page` | Yes | Choose one pagination style per endpoint and document it before release. |

## Hidden Fields

These fields and concepts must stay private unless a later issue explicitly approves a narrower public release.

| Hidden data | Reason |
| --- | --- |
| Supabase service-role data, auth state, sessions, cookies, tokens, credentials, and environment values | Secrets and access control. |
| Admin review status, reviewer identity, moderation notes, audit logs, and rejection reasons | Operational privacy and abuse prevention. |
| AI prompts, raw model output, model/provider routing, scoring rubrics, decision traces, and prompt/model version audit reports | Internal quality and security data. |
| Source trust tier internals, allowlist administration history, quality scores, and feed health diagnostics | Could expose abuse targets and vendor/publisher operations. |
| Worker runs, queue state, controller locks, retry metadata, and local AI health details | Internal operations and reliability posture. |
| Raw feed payloads, full article bodies, scraped content, and publisher-only metadata | Publisher rights and data minimization. |
| Analytics, saved stories, consent state, IP addresses, user agents, referrers, and device/browser identifiers | Reader privacy. |
| Draft, unpublished, rejected, removed, or embargoed articles | Editorial and takedown correctness. |

## Rate Limits And Abuse Controls

Initial public API limits should be conservative and enforceable at the earliest reliable edge layer.

| Control | Initial target |
| --- | --- |
| Anonymous read limit | 60 requests per minute per client IP or equivalent edge identity. |
| Search limit | 20 requests per minute because search is more expensive and less cacheable. |
| Maximum page size | 20 articles per page. |
| Maximum deep pagination | 500 articles or an equivalent cursor age/window until usage justifies more. |
| Method support | `GET` and `HEAD` only for public API routes. |
| Request body | Not accepted. Reject bodies on `GET` requests where the framework exposes them. |
| CORS | Allow `GET` from browsers only after explicit review; otherwise keep server-to-server/public same-origin behavior documented. |
| User-agent policy | Do not require a custom user agent for v1, but log and rate-limit abusive generic traffic. |
| Error body | Stable JSON `{ "error": string }` with no stack traces, SQL details, provider messages, or internal IDs. |

If usage grows beyond free-tier or reliability budgets, add API keys, lower anonymous limits, or require allowlisted partner access before raising limits.

## Caching Policy

Public API responses should be safe to cache without exposing private state.

| Route type | Initial cache target | Notes |
| --- | --- | --- |
| Recent article list | CDN `s-maxage=300`, `stale-while-revalidate=600` | Fresh enough for readers while protecting Supabase and runtime capacity. |
| Single public article | CDN `s-maxage=3600`, `stale-while-revalidate=86400` | Revalidate or purge if takedown/removal tooling needs faster removal. |
| Search results | CDN `s-maxage=120`, `stale-while-revalidate=300` | Bound query length and normalize cache keys. |
| OpenAPI contract | CDN `s-maxage=3600`, `stale-while-revalidate=86400` | Changes only with reviewed deploys. |
| Errors, rate limits, auth failures, and validation failures | `no-store` or short private cache only | Avoid caching transient or client-specific failures. |

Cache keys must include language, category, search query, pagination token/page, and version. They must not include credentials, cookies, raw IPs, or unbounded query strings.

## Contract And Versioning Rules

- Implement all public API routes as additive versioned endpoints.
- Add each route to the app repository API inventory before release.
- Add deterministic contract tests for success, empty, validation, pagination, cache headers, rate limits, and provider failure cases.
- Publish an OpenAPI document only when it is generated or checked against the same source as the tests.
- Never remove, rename, or change the type of a public v1 field without a reviewed migration.
- Additive nullable fields are allowed only with documentation and contract coverage.
- Breaking changes require a new version path and a sunset plan for the old version.

## Privacy And Publisher Constraints

The public API must preserve the same privacy and attribution boundaries as the site:

- Keep reader-specific state client-local or protected; never expose saved stories, consent choices, analytics, or device data.
- Return publisher attribution and original links with article content.
- Do not expose full article bodies or raw feed payloads.
- Support takedown/removal by returning `404` for removed public IDs after cache purge or revalidation.
- Keep summaries bounded to the public content policy documented for NutsNews.

## Implementation Gates

Before implementation begins, create or update:

1. Endpoint inventory and compatibility tests in `ramideltoro/nutsnews`.
2. Cache and rate-limit tests for public API headers and abuse controls.
3. OpenAPI generation or validation workflow.
4. Privacy review covering exposed fields and logs.
5. Publisher attribution review covering summaries, links, images, and takedowns.
6. Observability checks for availability, latency, error rate, rate-limit rate, and cache hit rate.
7. Rollback plan that can disable or hide the public API without breaking existing web/iOS routes.

## Rollback

The first implementation should include a runtime kill switch that returns `404` or `503` for `/api/public/v1/*` without affecting existing `/api/articles`, `/api/search`, health, sitemap, or admin routes. Rollback should not require schema deletion. If a schema or migration is needed later, it must be additive and safe to leave unused after disabling the API.

## Related Docs

- [Public API Contract Tests](PUBLIC_API_CONTRACT_TESTS.md)
- [Privacy Analytics And Consent](PRIVACY_ANALYTICS_CONSENT.md)
- [Publisher Attribution And Content Use](PUBLISHER_ATTRIBUTION_AND_CONTENT_USE.md)
- [Public Feed Snapshot and Edge Fallback](PUBLIC_FEED_SNAPSHOT.md)
- [Service Level Objectives](SERVICE_LEVEL_OBJECTIVES.md)
