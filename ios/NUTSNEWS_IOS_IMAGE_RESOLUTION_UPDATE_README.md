---
wiki:
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: be15b0b4eb28a72a8603f8084406df601cc71efe38a7b85f90dd5d202427842d
---
# NutsNews iOS Image Resolution Troubleshooting Update

This bundle shows each article thumbnail's pixel resolution directly on the card image.

Changed files:

- `NutsNews/NutsNews/Features/Feed/ArticleCardView.swift`
- `NutsNews/NutsNews/Design/NutsNewsTheme.swift`

Behavior:

- When the app checks a card thumbnail, it now stores and displays the decoded image resolution.
- The badge appears on the bottom-right of the card image, for example: `1400 × 619`.
- This is intended for troubleshooting image sizing and blocked thumbnails.

Install from the repo root:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews-ios
unzip -o ~/Downloads/nutsnews-ios-image-resolution-update.zip -d .
cd NutsNews
xcodebuild -project NutsNews.xcodeproj -scheme NutsNews -destination 'id=8AABA667-DE66-44E9-8A10-A3FB84BECB39' build
```
