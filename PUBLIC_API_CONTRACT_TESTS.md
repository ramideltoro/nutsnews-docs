# Public API Contract Tests

NutsNews validates public API and SEO response contracts with a mocked local regression script in `ramideltoro/nutsnews`.

## Simple Summary

NutsNews now has a check that makes sure the public website keeps sending the same important boxes of information to phones, browsers, and search engines.

## Intermediate Summary

Issue [ramideltoro/nutsnews#88](https://github.com/ramideltoro/nutsnews/issues/88) adds `npm run test:api-contracts` to the web app. The test imports the public route modules with mocked data providers so CI can catch missing fields or changed value types without using live Supabase, Turnstile, or Resend services.

## Expert Summary

The regression lives in `ramideltoro/nutsnews` as `scripts/api_contract_regression.mjs` and is exposed by `web/package.json` as `test:api-contracts`. It transpiles selected Next.js route and metadata modules with the local TypeScript package, injects mocks for Supabase-backed article/search helpers, cache headers, logging, Turnstile/email side effects, and then asserts route response shapes. It covers `/api/articles`, `/api/search`, `sitemap.xml`, `robots.txt`, and `/api/contact` validation paths. No production runtime behavior, database schema, environment variable, or external provider setup changes are required.

## Request And Data Flow

```mermaid
flowchart TD
  CI[CI or local npm script] --> ContractScript[api_contract_regression.mjs]
  ContractScript --> TS[TypeScript transpile harness]
  TS --> ArticleRoute[/api/articles route]
  TS --> SearchRoute[/api/search route]
  TS --> ContactRoute[/api/contact route]
  TS --> SeoRoutes[sitemap.ts and robots.ts]
  ContractScript --> Mocks[Mocked articles, cache, logging, quota, and email dependencies]
  ArticleRoute --> Assertions[Required field and type assertions]
  SearchRoute --> Assertions
  ContactRoute --> NoEmail[Validation responses without network email sends]
  SeoRoutes --> SeoAssertions[Required URL and directive assertions]
```

## Expected Contracts

### `/api/articles`

The article API must return:

```json
{
  "articles": [],
  "nextPage": null,
  "nextCursor": null,
  "dataSource": "public_feed_snapshot",
  "languageCode": "en"
}
```

Each article must include:

- `id`, `source`, `title`, and `original_url` as strings
- `image_url`, `published_at`, `published_on_site_at`, `ai_summary`, and `category` as string or null
- `positivity_score` as number or null
- `language_code` and `requested_language_code` as strings
- `translation_available` as boolean

The test covers offset pagination, cursor pagination, and language fallback fields.

### `/api/search`

The search API must return:

```json
{
  "articles": [],
  "nextPage": null,
  "query": "community",
  "page": 0,
  "pageSize": 20,
  "languageCode": "en"
}
```

The test covers normal result payloads and empty-state behavior for short or empty queries.

### `sitemap.xml` and `robots.txt`

The sitemap generator must keep the core public URLs:

- `https://www.nutsnews.com`
- `/apps`
- `/privacy`
- `/contact`
- `/articles/:id`

The robots generator must allow `/`, disallow `/api/`, and point to `https://www.nutsnews.com/sitemap.xml`.

### `/api/contact`

The contact route must return structured JSON validation responses without sending email during tests. The contract test covers invalid email handling, honeypot success, and unconfigured Turnstile behavior while asserting no `fetch` call is made.

## How To Run

From the application repository:

```bash
cd web
npm run test:api-contracts
```

This test uses mocked responses and does not require live Supabase credentials, Turnstile secrets, or a Resend API key.

## Risks And Mitigations

- Risk: A future route refactor changes imports and the harness no longer loads a route. Mitigation: the test fails loudly when a route imports an unexpected dependency.
- Risk: The tests become too broad and block harmless formatting changes. Mitigation: assertions focus on required fields, types, key URLs, and contact validation behavior rather than full-response snapshots.
- Risk: Contact tests accidentally send email. Mitigation: the test deletes email-related secrets, replaces `fetch`, and fails if any network call is attempted.

## Rollback

Rollback is limited to removing `scripts/api_contract_regression.mjs` and the `test:api-contracts` script entry from `web/package.json` in `ramideltoro/nutsnews`. No database, provider, cache, or environment rollback is required.

## Related Docs

- [Full Archive Search](FULL_ARCHIVE_SEARCH.md)
- [Cloudflare Turnstile Contact Form](CLOUDFLARE_TURNSTILE_CONTACT_FORM.md)
- [SEO Structured Data Audit](SEO_STRUCTURED_DATA_AUDIT.md)
- [Web Offline E2E Regression Test](WEB_OFFLINE_E2E_REGRESSION_TEST.md)
