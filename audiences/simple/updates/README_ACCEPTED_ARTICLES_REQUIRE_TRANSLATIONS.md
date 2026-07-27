---
title: Accepted articles require translations before publishing
wiki:
  source_route: /technical/updates/readme-accepted-articles-require-translations/
  simple_route: /simple/updates/readme-accepted-articles-require-translations/
  primary_diagram:
    file: diagrams/updates/README_ACCEPTED_ARTICLES_REQUIRE_TRANSLATIONS.md
    accTitle: "Accepted articles require translations before publishing diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 612b0c9953190207350ae1a8f5904ff84ee71451fcab7415a8993486973f6779
---

# Accepted articles require translations before publishing

This update makes the Worker treat accepted articles as `translation_pending` until every enabled summary language has a saved row in `article_summaries`.

## What changed

- `HOLD_ARTICLES_FOR_TRANSLATIONS` is now included in generated shard Wrangler configs.
- When summary languages are enabled, the Worker defaults to holding accepted articles until translations are complete.
- The default Worker translation article limit increased from 6 to 18, matching the hard AI review cap, so every newly accepted article in a normal shard run can be attempted for all supported languages.
- Existing summary lookup now chunks article URLs and quotes language filters safely, so `de-CH` and larger batches do not cause missed/partial lookups.
- Worker startup logging now includes enabled summary languages, translation limit, and hold mode.

## Required deploy env

Use these values when regenerating/deploying Workers:

```bash
export ENABLED_SUMMARY_LANGUAGES="fr,ja,de-CH,de,el"
export HOLD_ARTICLES_FOR_TRANSLATIONS="true"
export SUMMARY_TRANSLATION_LIMIT="18"
```

With those settings, new accepted articles are not displayed until all five translation rows exist.
