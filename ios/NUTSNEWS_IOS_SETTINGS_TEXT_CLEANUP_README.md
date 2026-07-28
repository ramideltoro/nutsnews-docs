---
wiki:
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 298c2fc73677067b468b0d7f05ba28913f0df4146361b130e14f7b8b7efdb65b
---
# NutsNews iOS Settings Text Cleanup

This bundle cleans up the settings UI text.

Changed file:

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`

Behavior:

- Removed the `App Settings` heading from the settings page.
- Removed the `Select App Theme` heading from the theme page.
- Theme options now show only the theme name, not the description text.
- Removed the `Haptics` heading from the haptics page.
- Removed the haptics navigation title text.

Install from the repo root:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews-ios
unzip -o ~/Downloads/nutsnews-ios-settings-text-cleanup.zip -d .
cd NutsNews
xcodebuild -project NutsNews.xcodeproj -scheme NutsNews -destination 'id=8AABA667-DE66-44E9-8A10-A3FB84BECB39' build
```
