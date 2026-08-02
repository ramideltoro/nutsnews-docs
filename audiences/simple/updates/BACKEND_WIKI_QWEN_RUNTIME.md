---
title: "Backend Wiki Qwen Runtime (Simple)"
description: "How NutsNews uses its own Qwen server to update the wiki without paying for OpenAI API calls."
wiki:
  source_route: "/technical/updates/backend-wiki-qwen-runtime"
  simple_route: "/simple/updates/backend-wiki-qwen-runtime"
  slug: "updates/backend-wiki-qwen-runtime"
  primary_diagram:
    file: "diagrams/updates/BACKEND_WIKI_QWEN_RUNTIME.mmd"
    accTitle: "Backend-hosted Qwen wiki generation flow"
    accDescr: "A serialized GitHub Actions job sends an authenticated Responses API request through Caddy and a bounded proxy to loopback Ollama, then validates the generated documentation before publication."
  status: active
  collection: platform-and-data
  section: core-platform
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 52682a8c89c67a475bf3c9ce972efd67462dd629beb073288e2e4dbc468e6d6b
---
# Backend Wiki Qwen Runtime

## What changed

Automatic NutsNews wiki updates use a Qwen model running on the NutsNews
backend server. The scheduled GitHub job no longer needs a paid OpenAI API
project. The public wiki itself never calls Qwen when someone reads a page.

If Qwen is unavailable, the update job fails safely. The last validated wiki
stays online and no incomplete documentation is published.

## How it works

GitHub sends one authenticated documentation request to
`backend.nutsnews.com`. Caddy exposes only a health route and the required
Responses API route. A small proxy checks the dedicated key, request size, and
approved model before sending the request to Ollama over the server's private
loopback connection.

Ollama and its management port are not public. The model can handle only one
wiki request at a time so it cannot consume all backend resources.

## Model and server limits

The protected backend pipeline installs Ollama `0.32.5` and the pinned
`qwen3.5:4b-q4_K_M` model. GitHub refers to the model as
`nutsnews-wiki-qwen`. It has a 65,536-token context, an 8,192-token response
limit, and systemd CPU and memory ceilings.

This smaller model fits the four-core, 9.7 GiB server. The larger Qwen3-Coder
model would not leave safe capacity for the database, queues, proxy, and Worker
services.

## Safe deployment

All software installation and model changes go through the existing protected
backend Ansible workflow. Operators run check mode first, review the diff, then
run apply with the exact backend confirmation. Apply must pass public health,
authentication, a real Qwen tool call, and the normal backend safety checks.

The first installation may take longer because it downloads Ollama and the
model. Later runs reuse the same verified files and model layers.

## GitHub automation limits

The wiki job runs every 30 minutes and handles no more than the oldest three
pending pull requests in one event. Runs are serialized and each job has a
60-minute timeout. Qwen can see only bounded merge evidence and the five files
allowed by the existing isolated bundle.

The job turns off Qwen's long thinking trace for this file-editing task. Qwen
can still use its editing tools, but it spends less server time narrating hidden
reasoning. The normal content and build checks still decide whether its work is
safe to publish.

Nothing is committed until the content, links, diagram, secret checks, and full
wiki build pass. The cursor advances only after a successful validated push.

## Keys and privacy

The backend and docs repositories store the same generated key under different
secret names. The key is not shared with the older article AI service, printed
in logs, or committed. The proxy logs only a request identifier, route, status,
and duration—not prompts, patches, generated text, or credentials.

The manual `npm run docs:prepare` helper is separate and still uses OpenAI when
someone deliberately runs it with an OpenAI key. It is not part of automatic
merge documentation and should not be used when avoiding OpenAI charges.

## When something fails

Bad keys, wrong models, oversized requests, concurrent jobs, or an unavailable
model are rejected before publication. The current wiki and merge cursor stay
unchanged. If the new model is too slow or produces poor documentation, disable
the wiki job first and roll back both repositories through their normal pull
request and protected deployment paths. Never expose Ollama directly or repair
the production server by hand.
