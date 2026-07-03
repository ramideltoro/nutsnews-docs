# NutsNews iOS Feature 5 — Story Notes

Adds a native private notes/reflections section to the Article Detail screen.

## What changed

- Adds `StoryNoteStore.swift` for local on-device story notes.
- Adds a **My Note** card to `ArticleDetailView`.
- Users can write, save, and clear a private note for each story.
- Notes are stored locally with `@AppStorage` / UserDefaults.
- Does not change the API, search, Good Mood, Saved Stories, or hamburger menu.

## Test checklist

1. Open any story.
2. Scroll to the **My Note** card.
3. Type a short note.
4. Tap **Save note**.
5. Close and reopen the same story.
6. Confirm the note is still there.
7. Tap **Clear**.
8. Close and reopen the story.
9. Confirm the note is gone.

## App Review value

This makes NutsNews more than a content/link feed by giving users a native personal reflection tool around positive stories.
