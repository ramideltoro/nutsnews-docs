---
title: NutsNews iOS Detail Thumbnail Crop Update
wiki:
  source_route: /technical/ios/nutsnews-ios-detail-thumbnail-crop-update-readme/
  simple_route: /simple/ios/nutsnews-ios-detail-thumbnail-crop-update-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_DETAIL_THUMBNAIL_CROP_UPDATE_README.md
    accTitle: "NutsNews iOS Detail Thumbnail Crop Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: ad30fbed39f1e68205d0fdbf38ab5bd627aeb6fcfc714220497be6316bac6c7f
---

# NutsNews iOS Detail Thumbnail Crop Update

This bundle updates the article detail screen opened from `Read Story`.

Changed file:

- `NutsNews/NutsNews/Features/Article/ArticleDetailView.swift`

Behavior:

- When the detail screen opens, it inspects the thumbnail image dimensions.
- If the thumbnail is wider than 3:2, the detail thumbnail is displayed in a cropped 3:2 container.
- Non-wide thumbnails keep the existing detail hero height.
- This is display-only cropping; the original thumbnail URL is unchanged.

Install from the repo root:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews-ios
unzip -o ~/Downloads/nutsnews-ios-detail-thumbnail-crop-update.zip -d .
cd NutsNews
xcodebuild -project NutsNews.xcodeproj -scheme NutsNews -destination 'id=8AABA667-DE66-44E9-8A10-A3FB84BECB39' build
```
