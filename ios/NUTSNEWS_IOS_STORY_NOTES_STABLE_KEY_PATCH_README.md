# NutsNews iOS — Story Notes Stable Key Patch

This patch fixes story notes so a note is attached to the same article no matter where the article is opened from.

## Problem fixed

Before this patch, notes were keyed by `article.id`. Different screens can build the same article with different IDs:

- Home feed may use the database row ID.
- Saved Stories uses the original URL as the stable saved ID.
- Search and native recommendation screens may have their own article object.

That means a note saved from one entry point could disappear when opening the same story from Search, Saved Stories, Good Mood, or Today’s Picks.

## Fix

`StoryNoteStore` now uses `LikedStoryStore.stableID(for:)`, which prefers the original story URL, then falls back to the row ID, then the title.

The patch also keeps backward compatibility by reading old notes saved under `article.id` and migrating them to the stable key the next time the note is saved.

## Files changed

```text
NutsNews/NutsNews/Models/StoryNoteStore.swift
```

## Test checklist

1. Open a story from Home and save a note.
2. Open the same story from Saved Stories and confirm the note appears.
3. Edit the note from Saved Stories and save.
4. Reopen the story from Home and confirm the edit appears.
5. Open a story from Search and save a note.
6. Save that story.
7. Open it from Saved Stories and confirm the note appears.
8. Open a story from Today’s Picks / Good Mood and save a note.
9. Reopen from another screen and confirm the note appears.
10. Clear a note from any screen and confirm it is cleared everywhere.
