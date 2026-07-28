---
title: NutsNews Home Button + Contact Text Update
wiki:
  source_route: /technical/archive/readme-nutsnews-home-contact-update/
  simple_route: /simple/archive/readme-nutsnews-home-contact-update/
  primary_diagram:
    file: diagrams/archive/README-NUTSNEWS-HOME-CONTACT-UPDATE.md
    accTitle: "NutsNews Home Button + Contact Text Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 81ab9ce87e59b7c7559c59c16518072fc85e933c48b6d6a4fb82306dd2d8b37b
---

# NutsNews Home Button + Contact Text Update

This bundle updates:

1. Footer home button behavior:
   - On the home page, it scrolls smoothly back to the top with a custom eased animation.
   - From another page, it routes to `/` and fades the home page in.
   - Reduced-motion users get instant/no animation behavior.

2. Contact page email helper text:
   - Removes the privacy helper text from the bottom row beside the Send button.
   - Adds the same translated helper text directly under the “Your email” label in smaller text.
   - Adds `aria-describedby` so the email input is connected to the helper text.

## Copy into your project

From your Mac, after downloading and unzipping this bundle:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews3
rsync -av /path/to/nutsnews-home-contact-update/ ./
npm --prefix web run lint
npm --prefix web run build
git status
```

If you downloaded the zip to Downloads, this is a copy-paste version:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews3
rm -rf /tmp/nutsnews-home-contact-update
unzip -o ~/Downloads/nutsnews-home-contact-update.zip -d /tmp/nutsnews-home-contact-update
rsync -av /tmp/nutsnews-home-contact-update/nutsnews-home-contact-update/ ./
npm --prefix web run lint
npm --prefix web run build
git status
```
