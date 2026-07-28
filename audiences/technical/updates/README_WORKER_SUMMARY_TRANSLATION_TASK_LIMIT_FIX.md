---
title: Worker summary translation task limit fix
wiki:
  source_route: /technical/updates/readme-worker-summary-translation-task-limit-fix/
  simple_route: /simple/updates/readme-worker-summary-translation-task-limit-fix/
  primary_diagram:
    file: diagrams/updates/README_WORKER_SUMMARY_TRANSLATION_TASK_LIMIT_FIX.mmd
    accTitle: "Worker summary translation task limit fix diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 0e6bd3893d0c97b79119bb14b545d4f4f202a55f9540d825fe3f850968d60fc2
---

# Worker summary translation task limit fix

This update makes `SUMMARY_TRANSLATION_LIMIT` control the number of translation tasks per Worker invocation directly.

Previously, `SUMMARY_TRANSLATION_LIMIT=1` became 5 tasks because the Worker multiplied the value by the number of enabled summary languages (`fr,ja,de-CH,de,el`). That still hit Cloudflare's subrequest limit on feed-heavy shards.

After this update:

- `SUMMARY_TRANSLATION_LIMIT=1` means 1 translation task per run.
- `SUMMARY_TRANSLATION_LIMIT=2` means 2 translation tasks per run.
- The hard maximum remains 5 translation tasks per run.
- `articleSummaryTranslationTaskBudget` in the curl response should now match the configured limit, capped at 5.

Use `SUMMARY_TRANSLATION_LIMIT=1` while shards still fetch 20 feeds per run.
