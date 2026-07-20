# Article translation backfill issue #282

This update documents the production article summary translation backfill completed for `ramideltoro/nutsnews#282` on 2026-07-20.

## What changed

- The audit script now performs URL-scoped, batched `article_summaries` lookups.
- The backfill script now uses documented numeric defaults when env values are blank.
- Generated translations that would be critical in the audit are rejected before saving.
- Publish-ready confirmation now batches PostgREST filters so broad article scans do not fail with oversized requests.

## Production result

- Public feed final audit: 474/500 rows available, 95% coverage, 0 critical issues.
- Latest 500 articles final audit: 2455/2500 rows available, 98% coverage, 0 critical issues.
- Full 500-candidate articles dry scan selected 0 non-cached rows after live batches.
- Remaining cached provider failures: 49 rows.

## Follow-up

`ramideltoro/nutsnews#287` tracks provider fallback/remediation for cached rows where the active local AI provider returned non-JSON or incomplete title/summary responses.

Full report: `reports/translations/nutsnews-issue-282-final-audit.md`.
