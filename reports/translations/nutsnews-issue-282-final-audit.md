# NutsNews issue #282 final translation backfill audit

Generated on 2026-07-20 for `ramideltoro/nutsnews#282`.

## Simple summary

The production backfill filled every non-cached missing translation row found in the public feed and latest-500 article scans. The remaining recent-content gaps are provider failures that were cached for a later retry. No critical translation quality issues remain in either final audit, and completed `translation_pending` articles were published.

Follow-up provider work is tracked in `ramideltoro/nutsnews#287`. The wider historical backlog discovered during final confirmation is tracked separately in `ramideltoro/nutsnews#289`.

## Intermediate summary

Scope:

- Repository: `ramideltoro/nutsnews`
- Branch: `agent/nutsnews-282-translation-backfill`
- Sources audited: `public_feed_snapshot` and `articles`
- Languages: `fr`, `ja`, `de-CH`, `de`, `el`
- Live provider path: local AI at `https://ai.nutsnews.com`, model `qwen2.5:3b`
- OpenAI fallback: unavailable in the active environment because no `OPENAI_API_KEY` was present

Final audit results:

| Source | Audit limit | Expected rows | Available rows | Coverage | Missing | Warnings | Critical |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `public_feed_snapshot` | 100 | 500 | 474 | 95% | 26 | 45 | 0 |
| `articles` | 500 | 2500 | 2455 | 98% | 45 | 247 | 0 |

Failure cache after live batches:

| Metric | Count |
| --- | ---: |
| Failed rows cached | 55 |
| `el` failures | 49 |
| `ja` failures | 4 |
| `de` failures | 1 |
| `fr` failures | 1 |
| Non-JSON provider responses | 32 |
| Missing title/summary provider responses | 23 |

Pending publication status after the final no-op publish confirmation:

| Metric | Count |
| --- | ---: |
| `translation_pending` articles with images and summaries | 0 |

The final full articles dry scan selected no non-cached work:

```bash
LANGUAGE_CODES=fr,ja,de-CH,de,el \
BACKFILL_SOURCE=articles \
CANDIDATE_LIMIT=500 \
CANDIDATE_PAGE_SIZE=100 \
SCAN_ALL_CANDIDATES=1 \
BACKFILL_LIMIT=50 \
DRY_RUN=1 \
PUBLISH_READY=1 \
FAILED_TRANSLATION_CACHE=/tmp/nutsnews-282-translation-failures.json \
node scripts/backfill_article_summaries.mjs
```

Result:

```text
Candidate articles scanned: 500
Missing translation rows selected: 0
Nothing to backfill.
```

The final wider historical scan found additional older published-article gaps outside #282's recent-public-content acceptance criteria:

| Metric | Count |
| --- | ---: |
| Published articles with image and summary | 1,923 |
| Expected supported-language rows | 9,615 |
| Existing rows for those published articles | 6,709 |
| Missing historical rows | 2,906 |
| Missing `fr` rows | 1 |
| Missing `ja` rows | 3 |
| Missing `de-CH` rows | 951 |
| Missing `de` rows | 953 |
| Missing `el` rows | 998 |

That long-tail scope is tracked in `ramideltoro/nutsnews#289`.

## Expert summary

The audit and backfill scripts needed reliability fixes before the production backfill could be trusted:

- `audit_article_translations.mjs` now initializes supported language codes before parsing env-provided languages.
- Numeric env parsing now treats unset or blank values as the documented fallback instead of coercing to `0`.
- Audit summary lookup is URL-scoped and batched, so it cannot undercount rows by reading an unrelated capped slice of `article_summaries`.
- `backfill_article_summaries.mjs` rejects generated rows that would be critical in the audit before saving them.
- Publish-ready confirmation batches the summary lookup and article status patch, avoiding oversized PostgREST filters.

Backfill flow:

```mermaid
flowchart TD
  A[Run diagnostic and initial audit] --> B[Dry-run public-feed backfill]
  B --> C[Run live public-feed batches]
  C --> D{Provider row valid?}
  D -->|Yes| E[Save article_summaries row]
  D -->|No| F[Add row to FAILED_TRANSLATION_CACHE]
  E --> G[Audit public feed]
  F --> G
  G --> H[Run articles source batches]
  H --> I[Publish fully translated articles]
  I --> J[Final public-feed and latest-500 audits]
  J --> K{Non-cached recent rows remain?}
  K -->|No| L[Confirm translation_pending is zero]
  L --> M[Open provider fallback and historical backlog follow-ups]
```

## Commands run

Initial diagnostics and dry run:

```bash
LANGUAGE_CODES=fr,ja,de-CH,de,el \
AUDIT_LIMIT=100 \
WINDOW_MINUTES=90 \
node scripts/diagnose_missing_article_translations.mjs

LANGUAGE_CODES=fr,ja,de-CH,de,el \
BACKFILL_SOURCE=articles \
CANDIDATE_LIMIT=500 \
SCAN_ALL_CANDIDATES=1 \
CANDIDATE_PAGE_SIZE=100 \
BACKFILL_LIMIT=25 \
DRY_RUN=1 \
PUBLISH_READY=1 \
FAILED_TRANSLATION_CACHE=/tmp/nutsnews-282-translation-failures.json \
node scripts/backfill_article_summaries.mjs
```

Final publish confirmation:

```bash
LANGUAGE_CODES=fr,ja,de-CH,de,el \
BACKFILL_SOURCE=articles \
CANDIDATE_LIMIT=500 \
CANDIDATE_PAGE_SIZE=100 \
SCAN_ALL_CANDIDATES=1 \
BACKFILL_LIMIT=50 \
PUBLISH_READY=1 \
FAILED_TRANSLATION_CACHE=/tmp/nutsnews-282-translation-failures.json \
node scripts/backfill_article_summaries.mjs
```

Result:

```text
Candidate articles scanned: 500
Missing translation rows selected: 0
Published/confirmed 456 fully translated article(s).
Nothing to backfill.
```

Live public-feed batches:

```bash
LANGUAGE_CODES=fr,ja,de-CH,de,el \
BACKFILL_SOURCE=public_feed_snapshot \
CANDIDATE_LIMIT=100 \
BACKFILL_LIMIT=50 \
PUBLISH_READY=0 \
FAILED_TRANSLATION_CACHE=/tmp/nutsnews-282-translation-failures.json \
node scripts/backfill_article_summaries.mjs
```

Live article batches:

```bash
LANGUAGE_CODES=fr,ja,de-CH,de,el \
BACKFILL_SOURCE=articles \
CANDIDATE_LIMIT=500 \
CANDIDATE_PAGE_SIZE=100 \
SCAN_ALL_CANDIDATES=1 \
BACKFILL_LIMIT=50 \
PUBLISH_READY=1 \
FAILED_TRANSLATION_CACHE=/tmp/nutsnews-282-translation-failures.json \
node scripts/backfill_article_summaries.mjs
```

Final audits:

```bash
LANGUAGE_CODES=fr,ja,de-CH,de,el \
AUDIT_LIMIT=100 \
AUDIT_SOURCE=public_feed_snapshot \
TRANSLATION_QUALITY_REPORT_PATH=/tmp/nutsnews-282-final-public-feed-audit.md \
node scripts/audit_article_translations.mjs

LANGUAGE_CODES=fr,ja,de-CH,de,el \
AUDIT_LIMIT=500 \
AUDIT_SOURCE=articles \
TRANSLATION_QUALITY_REPORT_PATH=/tmp/nutsnews-282-final-articles-audit.md \
node scripts/audit_article_translations.mjs
```

## Remaining work

The remaining recent missing rows are intentionally left out of repeated live retries because they already failed through the active provider path. To reach complete recent-content coverage, resolve `ramideltoro/nutsnews#287`, then rerun the saved failure cache with `RETRY_FAILED=1` against an authorized fallback provider. To clear the older published-article backlog, resolve `ramideltoro/nutsnews#289`.
