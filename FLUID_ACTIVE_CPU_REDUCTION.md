# Fluid Active CPU Reduction

## Purpose

This update reduces avoidable Vercel Fluid Active CPU work in the NutsNews public web path while preserving the existing fallback model.

## Architecture changes

### One homepage snapshot read

The normal homepage path now reads the precomputed `public_feed_snapshot` once, scans the newest 250 rows, and derives:

- the first five homepage stories
- Community
- Animals
- Science
- Wellness
- Travel
- Culture
- Achievements

For translated home feeds, selected article IDs are deduplicated before localized summaries are loaded, so translation hydration is performed as one batched lookup instead of one lookup per section.

If the optimized snapshot path is unavailable, NutsNews falls back to the previous resilient main-feed and section reads.

### One localized-home request

Returning non-English visitors now load:

```text
/api/articles?home=1&lang=<language>
```

The browser no longer launches one main-feed request plus seven category requests. The combined payload is served through the established `/api/articles` route so the existing multilingual E2E contract remains intact. `/api/home-feed` remains available only as a cacheable error fallback. Timestamp cache busting and public `no-store` behavior were removed from language restoration.

### Larger cursor batches

The initial server-rendered homepage remains five stories for a light first render. Infinite-scroll cursor requests now return up to 15 stories per batch, reducing repeated function invocations while keeping legacy offset pagination compatible at five stories.

### Longer public cache window

Key public reader paths now use a 15-minute CDN freshness window:

```text
s-maxage=900
stale-while-revalidate=3600
```

The homepage and article APIs use `revalidate = 900`.

### Reduced success-log overhead

Routine successful article, search, and home-feed requests no longer emit `request_started` events. Completion events use sampled info logging with a default 5% sample rate.

Optional override:

```text
BETTER_STACK_INFO_SAMPLE_RATE=0.05
```

Valid values are clamped to `0..1`. Errors continue to be logged at 100%.

### Narrow middleware execution

Public security headers moved to static Next.js header configuration. Runtime middleware is now matched only for operational/no-store paths:

```text
/admin/*
/monitoring/*
/api/log-test/*
/api/auth/*
/api/contact
```

This avoids running middleware for ordinary public reader traffic.

## Regression protection

A new Fluid Active CPU regression test prevents these specific regressions:

- timestamp cache-busting on public feed restores
- public `no-store` language restores
- seven-request category fan-out
- loss of 15-minute cache settings
- loss of 15-story cursor batches
- reintroduction of request-start logging
- broad middleware matcher restoration

A new all-tests immutable guard also locks every established test-like file after merge. New test files may be added, but once present on `main` they may not be modified or deleted unless the PR title or PR body contains a standalone line exactly equal to:

```text
APPROVED
```

## Validation

Run from the application repository:

```bash
node scripts/fluid_active_cpu_regression.mjs
node scripts/immutable_all_tests_guard_regression.mjs
cd web
npm ci
npx tsc --noEmit
npm run lint
npm run test:security-headers
npm run build
npm run test:e2e:offline
```

## Production verification

After deployment, verify:

```bash
curl -I https://www.nutsnews.com/
curl -I 'https://www.nutsnews.com/api/articles?page=0'
curl -I 'https://www.nutsnews.com/api/articles?home=1&lang=fr'
```

Expected cache policy includes a 900-second shared cache window. Then inspect Vercel Usage and compare:

- Fluid Active CPU
- Function Invocations
- ISR Writes

Use the same traffic window before and after deployment when possible.
