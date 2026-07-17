# Web Saved Stories

Related issue: https://github.com/ramideltoro/nutsnews/issues/101

## Simple Summary

Readers can save a happy story on the NutsNews website without making an account. The saved list stays only in that browser on that device, and readers can remove a story by pressing the saved button again.

## Intermediate Summary

The web app adds a no-login saved-stories path for public readers. Article cards expose a save/unsave control, the footer links to `/saved`, and the saved page renders the locally stored story cards. This affects readers who want to return to stories on the same device. It does not add account sync, a server API, database writes, analytics events, or cross-device state.

## Expert Summary

The application stores saved story cards in browser `localStorage` under `nutsnews.web.saved-stories`. The payload is versioned, capped at 100 stories, and contains only the public card fields needed to render a saved story again: article ID, source, title, original publisher URL, thumbnail URL, publish dates, summary, category, language code, and `saved_at`. The `/saved` route is `noindex` because its useful content is local user state. The privacy policy now states that website saved-story card data stays in browser storage and is removable without an account.

No external service state changes are required. There are no Supabase tables, migrations, Worker changes, server-side sessions, cookies, or account identifiers for this feature.

## Data Flow

```mermaid
flowchart LR
  Reader[Reader] --> Feed[Home feed article card]
  Feed --> SaveButton[Save or unsave button]
  SaveButton --> LocalStorage[(Browser localStorage<br/>nutsnews.web.saved-stories)]
  Reader --> SavedPage[/saved page]
  SavedPage --> LocalStorage
  SavedPage --> Publisher[Original publisher link]
  SaveButton -. no API call .-> NoServer[NutsNews server]
  LocalStorage -. not synced .-> OtherDevice[Other browsers or devices]
```

## Behavior

- Saving a story writes only the local browser payload.
- Unsaving removes that story from the local browser payload.
- Reloading the page keeps saved stories on the same device/browser.
- Opening `/saved` without local saved data shows an empty saved-stories state.
- Clearing browser site data, using a different browser profile, or using another device removes or hides the local saved list.
- The saved page links readers back to original publisher URLs and does not republish full publisher articles.

## Privacy Notes

- No login is needed.
- No saved-story API request is sent.
- No account ID, visitor ID, cookie, IP address, referrer, or analytics event is stored in the saved-stories payload.
- Saved-story state is not included in the current website analytics taxonomy.
- The public privacy policy covers browser local storage for saved stories.

## Tests And Validation

Expected app checks:

- `npm run test:saved-stories`
- `npm run test:components`
- `npm run test:i18n`
- `npm run test:privacy-analytics`
- `npm run test:accessibility`
- `npm run lint`
- `npm run build`

Browser verification should use `chrome-devtools` only. Validate that saving a story updates the button state, reload preserves it, `/saved` renders it, and unsaving removes it from the saved page.

## Risks And Mitigations

- Browser storage can be disabled or full. The save button degrades locally and does not block reading.
- Local state is device-specific. Cross-device sync is intentionally deferred until an account or privacy-preserving sync model exists.
- Stored card data may become stale. Saved stories link to original publishers, and stale local cards can be removed by unsaving or clearing browser data.
- The payload is capped at 100 stories to avoid unbounded local storage growth.

## Rollback

Revert the application PR that adds the saved-stories helper, button, `/saved` route, footer link, privacy copy, tests, and styles. No database rollback, Worker rollback, external service cleanup, or credential rotation is required. Readers who already saved stories may still have inert `nutsnews.web.saved-stories` localStorage data until they clear browser data.
