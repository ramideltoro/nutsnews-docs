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
