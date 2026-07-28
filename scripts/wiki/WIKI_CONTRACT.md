# NutsNews wiki contract

This document is the human-readable companion to `wiki-contract.mjs`. The
contract validator fails when the machine-checked JSON block below differs from
the executable contract.

## Source, mirror, and diagram paths

Every canonical Markdown source has one Simple mirror and one primary Mermaid
diagram at the same relative path:

- `<source>.md`
- `audiences/simple/<source>.md`
- `diagrams/<source-without-md>.mmd`

Canonical sources may live at the repository root or in `archive/`, `ios/`,
`reports/`, or `updates/`. Contract fixtures exercise the root and every nested
source area. Paths are repository-relative, may not traverse above the
repository, and keep their `.md` extension until a slug or diagram path is
derived.

## Author-time draft preparation

Run `npm run docs:prepare -- <canonical-source.md>` to draft the matching
Simple Markdown, primary Mermaid diagram, diagram accessibility text, and
adjacent `.review.json` manifest. The command uses the official OpenAI SDK and
Responses API only at author time. It reads `OPENAI_API_KEY` only from the
process environment, pins `gpt-5.4-mini-2026-03-17`, requests strict structured
output with `store: false`, and never adds an AI dependency to the built wiki.

Every generated bundle is marked `unreviewed` with publishing `blocked`. A
human must resolve its review notes and approve it before publication. The
command validates Mermaid locally and retries an invalid diagram once. It
checks all target paths before the API request and refuses to replace any
existing artifact unless the author explicitly adds `--force`.

After review, run
`npm run docs:approve -- <canonical-source.md> --reviewed-by <identity> --confirm-human-review`.
This separate command records the reviewer, review time, and normalized
Technical-source hash on the canonical Technical source, Simple mirror, and
tracked Technical mirror. Generator, automation, bot, and pending identities
are rejected. The hash excludes the approval record itself and normalizes line
endings, so approval metadata and LF/CRLF conversions do not stale content;
any substantive Technical source change does. Draft, blocked, missing, or
stale approval fails CI and the production build.

For a new document, run
`npm run docs:new -- <canonical-source.md> --collection <collection> --section <section>`.
The command deterministically creates the canonical expert scaffold, blocked
Simple draft, tracked Technical mirror, accessible Mermaid diagram, and review
manifest. It rejects unsafe, duplicate, route-colliding, or unclassified paths
and refuses to overwrite any target. On success it prints the exact
`docs:prepare`, `docs:approve`, and approval-validation commands to run next.

## Complete publication gate

Run `npm run validate:content` after `npm run wiki:prepare`. This single,
deterministic gate validates the stable inventory, generated schema, Simple and
Technical mirrors, human approval freshness, accessible Mermaid syntax,
unique slugs/orders/routes, internal links and heading fragments, image alt
text/captions/assets, and orphan artifacts. Failures are grouped by source and
include a remediation. Any defect exits nonzero, and the production build runs
the same gate before Astro.

The offline `npm run test:content-routes` suite builds and inspects both `/` and
the custom `/wiki-preview/` base without a browser or network service. It loads
every generated audience pair and built route, checks root and nested content,
mirror/category/slug metadata, internal links and fragments, audience
precedence/persistence, and Pagefind filters. Controlled broken metadata and
link fixtures must fail. The test finishes with the default-base build so later
validation and deployment steps inspect production-shaped output.

Run `npm run test:browser` for the Chromium reader-journey matrix. Its
1440×1024, 834×1194, and 390×844 projects cover collection navigation, the
mobile drawer, filtered search and History, audience switching, local Mermaid
rendering/zoom/fullscreen, edit links, nested content, and the branded 404.
Each project rejects serious or critical axe findings and document-level
horizontal overflow, verifies keyboard focus restoration, and compares the
article shell and search dialog with six reviewed responsive baselines. Update
those baselines intentionally with `npm run test:browser:update`.

## Frontmatter and precedence

Generated expert frontmatter always contains `title`, `description`, `slug`,
`collection`, `section`, `status`, and `order`.

Canonical source metadata is authoritative. A value nested under `wiki` wins
over the same top-level value, followed by the documented contract default.
Title may fall back to the Simple mirror. Description may fall back to the
first canonical prose, then the Simple description. Slugs fall back to the
canonical relative source path, lowercased with underscores converted to
hyphens.

Explicit `wiki.source_route` and `wiki.simple_route` values win over generated
routes. Otherwise the route is the audience prefix plus the canonical slug.
Internal route values omit the final slash; published URLs always include it.
An explicit `wiki.primary_diagram` string or `{ file }` value wins over the
derived diagram path.

## Root resolver and navigation

`/` resolves an explicit audience choice first, then the stored
`nutsnews.wiki.audience` preference, then the Simple default. The only accepted
audiences are `simple` and `technical`.

An explicit root choice uses `?audience=simple` or `?audience=technical`. The
resolver removes that control parameter before navigating, preserves every
other query parameter and the fragment, and replaces the root history entry.
Invalid audience values are ignored. With JavaScript disabled, the root remains
a branded landing page with normal Simple and Technical links; those fallback
links start at the chosen audience root without forwarding the root query or
fragment.

Navigation uses the ordered collections and sections in the checked contract
block. Documents without collection or section metadata use `start-here` and
`overview`. The seven-item collection rail maps directly to the seven accepted
section values. Status must be `active`, `draft`, `deprecated`, or `obsolete`.

History groups canonical sources from `updates/`, `reports/`, `archive/`, and
`ios/` as Updates, Reports, Archives, and Classified notes. These pages stay
directly browsable. Static search always keeps the active audience filter;
History is excluded by default and can be included with an explicit control.

## Machine-checked contract

<!-- wiki-contract:start -->
```json
{
  "version": "1.4.0",
  "audiences": [
    "simple",
    "technical"
  ],
  "sourceAreas": [
    {
      "id": "root",
      "prefix": ""
    },
    {
      "id": "archive",
      "prefix": "archive"
    },
    {
      "id": "ios",
      "prefix": "ios"
    },
    {
      "id": "reports",
      "prefix": "reports"
    },
    {
      "id": "updates",
      "prefix": "updates"
    }
  ],
  "pathPatterns": {
    "canonical": "<source>.md",
    "simple": "audiences/simple/<source>.md",
    "diagram": "diagrams/<source-without-md>.mmd"
  },
  "expertFields": [
    "title",
    "description",
    "slug",
    "collection",
    "section",
    "status",
    "order"
  ],
  "route": {
    "root": "/",
    "technicalPrefix": "/technical",
    "simplePrefix": "/simple",
    "trailingSlash": "always",
    "landingAudience": "simple",
    "resolver": {
      "preferenceKey": "nutsnews.wiki.audience",
      "queryParameter": "audience",
      "allowedValues": [
        "simple",
        "technical"
      ],
      "precedence": [
        "explicit-choice",
        "stored-preference",
        "landing-audience"
      ],
      "forwarding": {
        "removeQueryParameters": [
          "audience"
        ],
        "preserveOtherQueryParameters": true,
        "preserveFragment": true
      },
      "destinations": {
        "simple": "/simple/",
        "technical": "/technical/"
      }
    }
  },
  "statusValues": [
    "active",
    "draft",
    "deprecated",
    "obsolete"
  ],
  "navigationCollections": [
    {
      "id": "start-here",
      "label": "Start here",
      "order": 0,
      "sections": [
        "overview",
        "start-here",
        "contributing"
      ]
    },
    {
      "id": "product-and-reader-experience",
      "label": "Product and reader experience",
      "order": 1,
      "sections": [
        "public-product",
        "admin-experience",
        "ios"
      ]
    },
    {
      "id": "platform-and-data",
      "label": "Platform and data",
      "order": 2,
      "sections": [
        "core-platform"
      ]
    }
  ],
  "navigationRail": [
    {
      "id": "start-here",
      "label": "Start here",
      "shortLabel": "Start",
      "order": 0
    },
    {
      "id": "overview",
      "label": "Overview",
      "shortLabel": "Overview",
      "order": 1
    },
    {
      "id": "public-product",
      "label": "Public product",
      "shortLabel": "Public",
      "order": 2
    },
    {
      "id": "admin-experience",
      "label": "Admin experience",
      "shortLabel": "Admin",
      "order": 3
    },
    {
      "id": "ios",
      "label": "iOS",
      "shortLabel": "iOS",
      "order": 4
    },
    {
      "id": "core-platform",
      "label": "Core platform",
      "shortLabel": "Platform",
      "order": 5
    },
    {
      "id": "contributing",
      "label": "Contributing",
      "shortLabel": "Contribute",
      "order": 6
    }
  ],
  "history": {
    "groups": [
      {
        "id": "updates",
        "label": "Updates"
      },
      {
        "id": "reports",
        "label": "Reports"
      },
      {
        "id": "archive",
        "label": "Archives"
      },
      {
        "id": "ios",
        "label": "Classified notes"
      }
    ],
    "searchFilter": {
      "key": "history",
      "currentValue": "current",
      "historicalValue": "historical",
      "defaultIncludeHistory": false
    }
  },
  "defaults": {
    "title": "NutsNews documentation",
    "description": "NutsNews documentation page.",
    "section": "overview",
    "collection": "start-here",
    "status": "active",
    "order": 0
  },
  "precedence": {
    "sharedMetadata": [
      "source.wiki.<field>",
      "source.<field>",
      "contract default"
    ],
    "title": [
      "source.title",
      "simple.title",
      "contract default"
    ],
    "description": [
      "source.description",
      "first source prose",
      "simple.description",
      "contract default"
    ],
    "slug": [
      "source.wiki.slug",
      "source.slug",
      "canonical source path"
    ],
    "route": [
      "source.wiki.<audience>_route",
      "source.<audience>_route",
      "audience prefix + slug"
    ],
    "diagram": [
      "source.wiki.primary_diagram",
      "source.primary_diagram",
      "canonical source path"
    ]
  }
}
```
<!-- wiki-contract:end -->
