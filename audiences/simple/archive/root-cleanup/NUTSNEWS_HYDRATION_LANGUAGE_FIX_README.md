---
title: NutsNews Hydration Language Fix
wiki:
  source_route: /technical/archive/root-cleanup/nutsnews-hydration-language-fix-readme/
  simple_route: /simple/archive/root-cleanup/nutsnews-hydration-language-fix-readme/
  primary_diagram:
    file: diagrams/archive/root-cleanup/NUTSNEWS_HYDRATION_LANGUAGE_FIX_README.md
    accTitle: "NutsNews Hydration Language Fix diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 6957ab34b6379e468e2dbfac3b9be13866ae57d51f644edd431496bf03255b8c
---

# NutsNews Hydration Language Fix

This update fixes a homepage hydration mismatch caused by the hero tagline reading `localStorage` during the first client render.

Before the fix, the server rendered English text, but the client could render French or Japanese immediately if that language was stored in the browser. React then reported a server/client text mismatch.

Changes:

- `web/app/components/HeroTagline.tsx`
  - Uses the existing `useSelectedLanguage()` hook.
  - The first client render matches the server default language.
  - The saved language is applied after hydration.

- `web/next.config.ts`
  - Adds image quality `72` to `images.qualities` so Next.js accepts the existing article image quality setting.

Test:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews3/web
npm run lint
npm run build
npm run dev
```

Then open the homepage, switch languages, and confirm the hydration error is gone.
