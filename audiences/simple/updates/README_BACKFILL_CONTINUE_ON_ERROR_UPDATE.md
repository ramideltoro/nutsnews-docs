---
title: NutsNews backfill continue-on-error update
wiki:
  source_route: /technical/updates/readme-backfill-continue-on-error-update/
  simple_route: /simple/updates/readme-backfill-continue-on-error-update/
  primary_diagram:
    file: diagrams/updates/README_BACKFILL_CONTINUE_ON_ERROR_UPDATE.mmd
    accTitle: "NutsNews backfill continue-on-error update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 8dfeb58eff2c238fa433af258d811fcedaeba49187c6ac3dd39d2c370d3fe90d
---

# NutsNews backfill continue-on-error update

This update changes `scripts/backfill_article_summaries.mjs` so a bad translation row does not stop the whole backfill.

## Behavior

- Each translation row is translated and saved independently.
- If Local AI/Ollama returns a bad response for one row, the script logs the failed row and continues.
- If Supabase rejects one row save, the script logs that row and continues.
- The final publish-ready check is also non-fatal; saved translations are kept even if that optional check fails.
- The script prints a final summary with saved count and failed/skipped count.
- The Supabase language-code filters now quote/encode language codes such as `de-CH` correctly.

## Recommended run

Use `PUBLISH_READY=0` during large backfills, then publish/check later after coverage looks good.

```bash
LANGUAGE_CODES="de-CH,de,el" \
BACKFILL_SOURCE=public_feed_snapshot \
CANDIDATE_LIMIT=250 \
BACKFILL_LIMIT=30 \
PUBLISH_READY=0 \
node scripts/backfill_article_summaries.mjs | tee /tmp/nutsnews-de-ch-de-el-backfill.log
```
