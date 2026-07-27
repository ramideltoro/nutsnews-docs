---
title: NutsNews iOS Thumbnail Crop Update
wiki:
  source_route: /technical/ios/nutsnews-ios-thumbnail-crop-update-readme/
  simple_route: /simple/ios/nutsnews-ios-thumbnail-crop-update-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_THUMBNAIL_CROP_UPDATE_README.md
    accTitle: "NutsNews iOS Thumbnail Crop Update diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: f8fc658663cefa5cf61de4c8f3b0e70f3c39f95b51b00fd5a46b9dcb123a6bcf
---

# NutsNews iOS Thumbnail Crop Update

This bundle removes the troubleshooting image-resolution badge and changes wide thumbnails to display in a cropped 3:2 image area.

Changed files:

- `NutsNews/NutsNews/Features/Feed/ArticleCardView.swift`
- `NutsNews/NutsNews/Design/NutsNewsTheme.swift`

Behavior:

- The thumbnail resolution text is no longer shown on cards.
- The card still inspects the thumbnail metadata internally.
- If a thumbnail is wider than 3:2, the card displays it inside a 3:2 container using `scaledToFill` and clipping.
- Normal/non-wide thumbnails keep the existing fixed card image height.

Install from the repo root:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews-ios
unzip -o ~/Downloads/nutsnews-ios-thumbnail-crop-update.zip -d .
cd NutsNews
xcodebuild -project NutsNews.xcodeproj -scheme NutsNews -destination 'id=8AABA667-DE66-44E9-8A10-A3FB84BECB39' build
```
