# NutsNews iOS Theme Transition Glow Update

This update adds a theme-change glow animation on the Theme settings page.

## What changed

- When selecting a different theme, all theme option rows glow for about one second.
- The glow starts with the currently active theme accent color.
- The glow transitions toward the newly selected theme accent color.
- The top-right home button on the Theme page also participates in the glow.
- The selected theme still changes immediately with the existing smooth UI transition.

## Files changed

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`
- `NutsNews/NutsNews/Design/NutsNewsTheme.swift`

## Notes

The theme file is included so this bundle stays compatible with the newly added theme list and theme preview colors.
