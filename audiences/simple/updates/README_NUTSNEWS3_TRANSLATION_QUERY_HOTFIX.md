---
title: NutsNews3 translation diagnostics query hotfix
wiki:
  source_route: /technical/updates/readme-nutsnews3-translation-query-hotfix/
  simple_route: /simple/updates/readme-nutsnews3-translation-query-hotfix/
  primary_diagram:
    file: diagrams/updates/README_NUTSNEWS3_TRANSLATION_QUERY_HOTFIX.md
    accTitle: "NutsNews3 translation diagnostics query hotfix diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: caf7b9fe811e39b7c48483718f30805662cdfd537ecac26748dec5faf494b03b
---

# NutsNews3 translation diagnostics query hotfix

This hotfix updates the diagnostic scripts to be safer with large audit windows.

## What changed

- `scripts/diagnose_missing_article_translations.mjs` now chunks Supabase `original_url=in.(...)` lookups so `AUDIT_LIMIT=250` does not produce an oversized REST query.
- The diagnostic, audit, and backfill scripts now accept `NEXT_PUBLIC_SUPABASE_URL` as a fallback when `SUPABASE_URL` is not set.

## Copy

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews3

UPDATE_ZIP="$HOME/Downloads/nutsnews3-translation-query-hotfix.zip"
TMP_DIR="/tmp/nutsnews3-translation-query-hotfix"

rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"
unzip -o "$UPDATE_ZIP" -d "$TMP_DIR"
rsync -av "$TMP_DIR"/ ./

chmod +x scripts/validate_translation_update.sh
chmod +x scripts/diagnose_missing_article_translations.mjs
chmod +x scripts/audit_article_translations.mjs
chmod +x scripts/backfill_article_summaries.mjs

scripts/validate_translation_update.sh /Users/ramideltoro/WebstormProjects/nutsnews3
```

## Run diagnosis

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews3

set -a
source web/.env.local
set +a

LANGUAGE_CODES=fr,ja,de-CH,de,el AUDIT_LIMIT=250 WINDOW_MINUTES=45 \
node scripts/diagnose_missing_article_translations.mjs
```

If Supabase still rejects a request, lower chunk size without losing the 250-article audit window:

```bash
LANGUAGE_CODES=fr,ja,de-CH,de,el AUDIT_LIMIT=250 WINDOW_MINUTES=45 IN_CHUNK_SIZE=20 \
node scripts/diagnose_missing_article_translations.mjs
```
