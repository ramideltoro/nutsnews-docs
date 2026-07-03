# NutsNews iOS Like Glow Update

This bundle updates the article card like interaction.

Changed files:

- `NutsNews/NutsNews/Features/Feed/ArticleCardView.swift`
- `NutsNews/NutsNews/Design/NutsNewsTheme.swift`

Behavior:

- Tapping the like button triggers a 1-second glow animation on only that article card.
- After the glow ends, only that liked card keeps a subtly different border color.
- The final border/glow color is theme-aware and changes with the active theme.
- The like icon and button border now use the same theme-aware liked accent instead of fixed red.

Install from the repo root:

```bash
cd /Users/ramideltoro/WebstormProjects/nutsnews-ios
unzip -o ~/Downloads/nutsnews-ios-like-glow-update.zip -d .
cd NutsNews
xcodebuild -project NutsNews.xcodeproj -scheme NutsNews -destination 'id=8AABA667-DE66-44E9-8A10-A3FB84BECB39' build
```
