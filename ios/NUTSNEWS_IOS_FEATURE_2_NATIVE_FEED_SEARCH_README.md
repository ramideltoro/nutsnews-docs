---
title: "NutsNews iOS — Feature 2: Native Feed Search"
wiki:
  source_route: /technical/ios/nutsnews-ios-feature-2-native-feed-search-readme/
  simple_route: /simple/ios/nutsnews-ios-feature-2-native-feed-search-readme/
  primary_diagram:
    file: diagrams/ios/NUTSNEWS_IOS_FEATURE_2_NATIVE_FEED_SEARCH_README.mmd
    accTitle: "Native feed search flow"
    accDescr: "Local search input filters loaded home feed items by title, summary, source, category, or date in-app."
  status: active
  collection: product-and-reader-experience
  section: ios
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 04984d8451b7ea6f6ea4d487ed5fcba14598f2304176352646f8e543f8ff7cc6
---

# NutsNews iOS — Feature 2: Native Feed Search

This update adds one native App Review-friendly feature on top of Feature 1: a searchable home feed.

## What changed

- Adds a native search field below the category chips on the home screen.
- Searches the currently loaded feed by title, summary, source, category, and display date.
- Shows a native search results card with the number of matches.
- Shows a native empty state when the query has no matches.
- Does not change API calls, themes, splash screen, saved stories, article detail, or the Xcode project scheme.

## Files changed

- `NutsNews/NutsNews/Features/Feed/FeedView.swift`

## Test checklist

1. Launch the app.
2. Confirm the search field appears under the category row.
3. Search for a visible source name.
4. Confirm the feed filters locally.
5. Search for a visible category.
6. Confirm matching stories remain.
7. Search for nonsense text such as `zzzzzz`.
8. Confirm the native no-results screen appears.
9. Tap Clear search.
10. Confirm the normal feed returns.
11. Tap a story while search is active.
12. Confirm the native article detail screen opens.
13. Tap Saved and confirm Feature 1 still works.

## Why this helps App Review

Apple rejected the first build because the app looked too much like aggregated web content. This update adds native search behavior inside the app, giving users an interactive way to explore and organize the feed without simply browsing external links.
