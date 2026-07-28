---
title: Backend translation publish guard
wiki:
  source_route: /technical/updates/readme-backend-translation-publish-guard/
  simple_route: /simple/updates/readme-backend-translation-publish-guard/
  primary_diagram:
    file: diagrams/updates/README_BACKEND_TRANSLATION_PUBLISH_GUARD.mmd
    accTitle: "Backend translation publish guard diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 4d9ac7a2b04f6eb621649d8a884c5d5cf59f47b6989ae96dd459de6bdcce9856
---

# Backend translation publish guard

This update documents the backend compatibility API guard for `ramideltoro/nutsnews-backend#263`.

## What changed

- Backend-primary Worker writes can no longer insert accepted articles as already `published`.
- `publish-articles-batch` now requires enabled summary `languageCodes` before publishing.
- The backend checks `public.article_summaries` for every requested article/language pair.
- Missing rows leave articles hidden and return structured `missingTranslations` details.
- Recovery reads include both `published` and `translation_pending` articles.

## Worker boundary

The Worker repo must pass its enabled languages to `publish-articles-batch`, treat `ok=false` as a recoverable translation gap, and log the returned article URL/language pairs through `worker.translation.*` diagnostics.

## Validation

Backend validation:

```bash
python3 -m unittest tests.test_worker_db_api
python3 scripts/validate_backend_api_compatibility_contract.py
python3 scripts/backend_postgres_smoke_tests.py --offline
python3 scripts/backend_app_db_api_smoke.py --offline
python3 -m unittest discover -s tests
python3 scripts/validate_no_secret_files.py
git diff --check
```
