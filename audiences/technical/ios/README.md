---
title: "NutsNews iOS"
wiki:
  source_route: /technical/ios/
  simple_route: /simple/ios/
  primary_diagram:
    file: diagrams/ios/README.mmd
    accTitle: "NutsNews iOS app overview"
    accDescr: "The iOS app entry points into feed, article detail, stories, notes, search, reading stats, and digest screens from the app shell."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 068717161b75e311d161ca795fd5fef923b3c3ea36bb91dde1165df89f626c80
---

# NutsNews iOS

Native SwiftUI iOS app for NutsNews.

## Current MVP

- Native SwiftUI article feed
- Thumbnail image loading
- Native Article Detail screen
- In-app Safari reader for original stories
- Share support
- Strong amber/dark NutsNews visual theme
- Custom amber/dark AppIcon asset catalog
- Branded SwiftUI startup splash screen with 1.5-second smooth fade/scale transition
- Bundle identifier: `com.nutsnews.app`

## Open locally

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews-ios
open NutsNews/NutsNews.xcodeproj
```

Choose an iPhone simulator and press `Command + R`.

## API

The app reads articles from:

```text
https://www.nutsnews.com/api/articles
```

The app supports both camelCase and snake_case article fields, including `thumbnailUrl`, `thumbnail_url`, `imageUrl`, and `image_url`.

No Supabase service keys, OpenAI keys, Cloudflare secrets, or Apple signing secrets belong in this repo.
