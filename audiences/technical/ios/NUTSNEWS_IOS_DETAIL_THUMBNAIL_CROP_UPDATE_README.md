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
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 9187857488c3611e187afcd76b00bd55a29e9a449349dc7e4fa04d4a7f84f674
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
