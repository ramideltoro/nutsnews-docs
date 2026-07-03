# NutsNews iOS New Themes Update

This update adds three new selectable app themes to NutsNews iOS and wires them into the existing theme system.

## Added themes

1. **The Modern SaaS**
   - Background: `#121212`
   - Surface / Cards: `#1E1E1E`
   - Text: `#E0E0E0`
   - Accent: `#3B82F6`

2. **The Creative Premium**
   - Background: `#0F172A`
   - Surface / Cards: `#1E293B`
   - Text: `#94A3B8`
   - Accent: `#7C3AED`

3. **The Moody Cyberpunk**
   - Background: `#1A211B`
   - Surface / Cards: `#2C362F`
   - Text: `#E5E7EB`
   - Accent: `#FACC15`

## Files changed

- `NutsNews/NutsNews/Design/NutsNewsTheme.swift`
- `NutsNews/NutsNews/Features/Feed/FeedView.swift`

## Notes

- The new themes appear on the theme settings page.
- Theme preview swatches were added for all three themes.
- Card, border, badge, button, background, category dot, and liked-card glow colors now respond to the new themes.
