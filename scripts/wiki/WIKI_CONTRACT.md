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

Navigation uses the ordered collections and sections in the checked contract
block. Documents without collection or section metadata use `start-here` and
`overview`. The seven-item collection rail maps directly to the seven accepted
section values. Status must be `active`, `draft`, `deprecated`, or `obsolete`.

## Machine-checked contract

<!-- wiki-contract:start -->
```json
{
  "version": "1.2.0",
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
      "allowedValues": [
        "simple",
        "technical"
      ],
      "precedence": [
        "explicit-choice",
        "stored-preference",
        "landing-audience"
      ],
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
