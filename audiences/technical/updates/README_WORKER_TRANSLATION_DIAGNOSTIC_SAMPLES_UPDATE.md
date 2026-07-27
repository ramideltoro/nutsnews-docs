---
title: Worker Translation Diagnostic Samples Update
wiki:
  source_route: /technical/updates/readme-worker-translation-diagnostic-samples-update/
  simple_route: /simple/updates/readme-worker-translation-diagnostic-samples-update/
  primary_diagram:
    file: diagrams/updates/README_WORKER_TRANSLATION_DIAGNOSTIC_SAMPLES_UPDATE.md
    accTitle: "Worker Translation Diagnostic Samples Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: e7f999ab016bf35a924c2743b74154f56631f3bd79a8b9109d50acbd5a75ad02
---

# Worker Translation Diagnostic Samples Update

This update makes Worker translation failures easier to debug.

## What changed

- Adds `articleSummaryFailureSamples` to the manual Worker JSON response.
- Adds `articleSummarySaveErrorSamples` to the manual Worker JSON response.
- Keeps local AI/OpenAI provider-order reporting already added by the previous update.
- Includes representative failed article URLs, titles, languages, task source, provider order, and save error text.

## Why

The Worker was returning high failure counts such as `articleSummaryFailedTaskCount`, but not the underlying rows or Supabase error text. This update lets a single shard test show what failed next.

## Expected response fields

After deploy, test a shard and look for:

- `articleSummaryFailureSamples`
- `articleSummarySaveErrorSamples`
- `articleSummaryFailedTaskCount`
- `articleSummarySaveOk`
- `translationProviderOrder`
