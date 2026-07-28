---
title: Accepted articles require translations before publishing
wiki:
  source_route: /technical/updates/readme-accepted-articles-require-translations/
  simple_route: /simple/updates/readme-accepted-articles-require-translations/
  primary_diagram:
    file: diagrams/updates/README_ACCEPTED_ARTICLES_REQUIRE_TRANSLATIONS.mmd
    accTitle: "Accepted articles require translations before publishing diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 323bb22fc0fdab97f1c8e2893e9ce6412b188a1f45922fd0cc599af5944a2ba9
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
