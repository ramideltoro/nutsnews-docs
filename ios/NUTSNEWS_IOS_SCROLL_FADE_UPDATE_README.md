# NutsNews iOS Scroll Fade Update

This bundle updates the home feed so article cards fade, scale slightly, and lift into place while scrolling.

Changed file:

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`

Install from the repo root:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews-ios
unzip -o ~/Downloads/nutsnews-ios-scroll-fade-update.zip -d .
cd NutsNews
xcodebuild -project NutsNews.xcodeproj -scheme NutsNews -destination 'id=8AABA667-DE66-44E9-8A10-A3FB84BECB39' build
```
