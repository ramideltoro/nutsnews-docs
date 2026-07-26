---
title: Project Overview (Simple)
wiki:
  source_route: /technical/project/
  simple_route: /simple/project/
  primary_diagram:
    file: diagrams/PROJECT.mmd
    accTitle: "NutsNews project overview"
    accDescr: "An end-to-end view of ingestion, curation, delivery, storage, monitoring, and publishing workflows."
  status: active
  collection: start-here
  section: overview
  approval:
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: d76e72dbee761318bd7ee0f32d2ffd10e8d475bb640c3087e5e9b8d16f11ff99
---

# Project Overview

NutsNews is a calm, mobile-first positive news platform powered by automation,
AI curation, serverless infrastructure, CDN caching, centralized observability,
and a private admin portal.

The platform collects uplifting stories from trusted RSS feeds, filters out
stressful topics, creates short cheerful summaries, and links readers back to the
original publishers.

## Mission

NutsNews exists to make positive stories easier to find.

The platform focuses on stories about:

* Community
* Wellness
* Science
* Culture
* Animals
* Travel
* Lifestyle
* Nature
* Space
* Creativity
* Human achievement
* Inspiring people
* Helpful discoveries
* Remarkable moments

The goal is to become a fully automated positive-news discovery layer that helps
readers find uplifting stories from around the web.

## What NutsNews avoids

NutsNews intentionally avoids content that creates stress or conflict.

The platform filters out stories mainly focused on:

* Politics
* War
* Crime
* Tragedy
* Violence
* Fear
* Market panic
* Financial stress
* Election conflict
* Government conflict
* Outrage-driven news

This keeps the product focused and preserves a clear identity.

## Product experience

NutsNews is designed for quick mobile reading.

Each story card gives the reader:

* A clear title
* A short cheerful summary
* A source label
* A published date
* Category badges
* A story image when available
* A link to the original publisher

The homepage works like a calm feed of uplifting stories instead of a noisy news
portal.

## Source-friendly publishing

NutsNews does not replace the original article.

It stores and shows:

* Original title
* Source name
* Short summary
* Category
* Article image when available
* Link back to the original publisher

This supports discovery while respecting the original publisher.

## Open Graph images

NutsNews includes branded Open Graph image generation for social sharing.

Routes:

```text
/opengraph-image
/articles/[id]/opengraph-image
```

Generated images use NutsNews dark-and-amber visuals and are sized for large
social previews:

```text
1200 × 630
```

Homepage previews include:

* NutsNews branding
* Product tagline
* Positive-news positioning
* Amber visual treatment

Article previews include:

* Article title
* Article summary
* Source name
* Category badge when available
* NutsNews branding

## Benefits

### For readers

NutsNews provides a calmer alternative to stressful news feeds.

### For publishers

NutsNews sends readers back to the original source instead of replacing publisher
content.

### For operators

The system is automated, monitored, logged, protected, and designed to run at
low cost.

### For developers

The architecture is modular, serverless, and easy to extend.

### For the business

The platform can become the foundation for a fully automated positive-news agency.

## Current status

NutsNews currently includes:

* A public mobile-first website
* RSS-based content discovery
* AI-assisted article filtering
* AI-generated short summaries
* Supabase article storage
* Cloudflare Worker automation
* Worker sharding
* Controller Worker orchestration
* Cloudflare CDN caching
* Better Stack uptime monitoring
* Better Stack centralized structured logs
* Sentry error monitoring
* Google-protected admin portal
* AI usage dashboard
* Worker health dashboard
* RSS feed health dashboard
* Feed management dashboard
* Dynamic Open Graph image generation
* Optimized public article API pagination
* Database indexes for feed and article API performance
* GitHub documentation in `docs/`
* Production troubleshooting guide
* MIT license
