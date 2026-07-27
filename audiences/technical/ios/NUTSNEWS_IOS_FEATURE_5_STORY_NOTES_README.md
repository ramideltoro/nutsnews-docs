---
title: "NutsNews iOS Feature 5 — Story Notes"
wiki:
  source_route: /technical/ios/nutsnews-ios-feature-5-story-notes-readme/
  simple_route: /simple/ios/nutsnews-ios-feature-5-story-notes-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_FEATURE_5_STORY_NOTES_README.mmd
    accTitle: "Story notes flow"
    accDescr: "Users open article detail, add a personal note for a story, save it locally, and later retrieve or clear it."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: e9021bde5b3e2597118e3a9d9772dbf1b254a61f8b9c8f67b98a42392d61aba5
---

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
