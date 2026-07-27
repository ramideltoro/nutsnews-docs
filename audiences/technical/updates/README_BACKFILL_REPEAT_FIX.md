---
title: Backfill repeat fix
wiki:
  source_route: /technical/updates/readme-backfill-repeat-fix/
  simple_route: /simple/updates/readme-backfill-repeat-fix/
  primary_diagram:
    file: diagrams/updates/README_BACKFILL_REPEAT_FIX.md
    accTitle: "Backfill repeat fix diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: b78a220b66e03fcff8e52e7ef4570506dc3c86abffbb6c31d66687768206d88e
---

# Backfill repeat fix

This update fixes two translation backfill problems:

1. The backfill script could translate the same articles repeatedly because it loaded a broad capped list of existing summaries, then missed rows it had just saved. It now checks existing `article_summaries` only for the current candidate article URLs, in small URL batches.
2. Failed Ollama rows could be retried every batch. The script now supports a local failed-row cache. Set `FAILED_TRANSLATION_CACHE=/tmp/nutsnews-translation-failures.json` to skip rows that failed earlier in the same long backfill run. Set `RETRY_FAILED=1` when you want to try those rows again.

For all-article backfills, use:

```bash
LANGUAGE_CODES="de-CH,de,el" \
BACKFILL_SOURCE=articles \
SCAN_ALL_CANDIDATES=1 \
CANDIDATE_LIMIT=5000 \
CANDIDATE_PAGE_SIZE=1000 \
BACKFILL_LIMIT=60 \
PUBLISH_READY=0 \
FAILED_TRANSLATION_CACHE=/tmp/nutsnews-de-ch-de-el-failed-translations.json \
node scripts/backfill_article_summaries.mjs
```
