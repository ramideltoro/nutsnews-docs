---
title: "Backend Wiki Qwen Runtime (Technical)"
description: "How the backend-hosted Qwen runtime generates bounded NutsNews merge documentation without OpenAI API usage."
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
    technical_source_hash: 86754e64bdb9e50cf70b17d5166e8f0d6290c071b8a997886f057eeba41b3a68
---
# Backend Wiki Qwen Runtime

## Outcome

NutsNews automated merge documentation uses a Qwen model hosted on
`backend.nutsnews.com`. The scheduled workflow does not send requests to the
OpenAI API and does not require an OpenAI-funded project. The existing pinned
Codex Action remains the workspace agent and points its Responses API traffic
to the NutsNews endpoint.

The built wiki does not call the model at reader runtime. If the backend AI
service is unavailable, documentation generation stops safely while the last
validated wiki remains online.

## Architecture

The protected backend pipeline installs and configures the complete inference
path on `65.75.201.18`:

1. Caddy accepts only `/wiki-ai/health` and `/wiki-ai/v1/responses`.
2. The Responses route forwards to an authenticated Python proxy on
   `127.0.0.1:18089`.
3. The proxy runs one inference at a time, permits one authenticated request to
   wait for that slot for up to 600 seconds, enforces the request-size and model
   allowlists, and strips authentication before forwarding.
4. Ollama listens only on `127.0.0.1:11434` and serves the
   `nutsnews-wiki-qwen` alias.
5. The GitHub-hosted wiki job imports only the generated five-file bundle and
   runs the existing content, link, Mermaid, secret, approval, and build gates
   before committing anything.

Raw Ollama model-management routes and port `11434` are never public.

## Pinned runtime and capacity

The backend Ansible role pins:

- Ollama `0.32.5` and the reviewed amd64 archive SHA-256 checksum
- Qwen base model `qwen3.5:4b-q4_K_M` with expected model ID `2a654d98e6fb`
- model alias `nutsnews-wiki-qwen`
- a 49,152-token context and a 6,144-token per-response output ceiling
- one active inference request, one bounded authenticated waiter, and one
  loaded model
- 15-second Server-Sent Events (SSE) heartbeat comments while a streaming
  request waits for the inference slot or for Ollama output
- systemd CPU, task, and memory limits sized for the four-core, 9.7 GiB backend

The 4B quantized model is deliberate. Larger Qwen3-Coder images do not fit the
backend host while preserving capacity for PostgreSQL, RabbitMQ, Caddy, and the
Worker services.

The context and output ceilings leave enough room for the isolated five-file
editing bundle while bounding CPU generation time. A production 8,192-token
turn exceeded the proxy's 55-minute upstream limit on this host; the lower
6,144-token ceiling prevents that known overrun without weakening the existing
validation gates.

## Protected deployment

`ramideltoro/nutsnews-backend` is the source of truth. Routine installation,
model pulls, service changes, and Caddy changes must use
`.github/workflows/protected-backend-ansible-apply.yml` from exact `main`:

1. Run `check` with `deployment_scope=full-baseline`.
2. Review the protected Ansible diff.
3. Run `apply` with `confirm_apply=backend.nutsnews.com`.
4. Require the public health check, authenticated Responses request, Qwen tool
   call, and normal backend safety postcheck to pass.

The apply job is bounded to 90 minutes because the first run downloads a
verified Ollama archive and the pinned model. Later runs are idempotent and
reuse the matching installation and model layers.

## Credentials

The same randomly generated value is stored under two repository-scoped names:

- `NUTSNEWS_WIKI_AI_API_KEY` in the backend `production-backend` Environment
- `WIKI_AI_API_KEY` in `ramideltoro/nutsnews-docs`

Do not reuse `LOCAL_AI_API_KEY`, print either value, place it in workflow
outputs, or add it to source control. The proxy uses constant-time comparison
and records only request ID, route, status, and duration metadata.

## Wiki automation limits

`.github/workflows/automated-merge-docs.yml` runs every 30 minutes, serializes
workflow runs and repository jobs, and has a 90-minute job timeout. Each event
contains the oldest three pending pull requests at most. The cursor advances
only after the generated bundle passes all deterministic gates and is pushed.

The job requests reasoning effort `none`. Ollama maps that value to disabled
Qwen thinking traces, which preserves tool calling while avoiding long hidden
reasoning generations on the CPU-only backend. Content quality remains guarded
by the same deterministic bundle, provenance, contract, and build checks.

Streaming requests receive an immediate SSE response and a `: keep-alive`
comment at least every 15 seconds while the proxy is waiting. The proxy relays
Ollama's SSE output line by line once generation begins. This keeps long
CPU-only generations alive through the public edge without inventing model
events or allowing a second inference to run concurrently.

The existing isolation contract remains unchanged: Qwen receives bounded merge
evidence and exactly five allowlisted wiki artifacts, cannot access GitHub or
the network, and must change the canonical, Simple, Technical, and Mermaid
files. Deterministic code writes provenance after the agent exits.

The manual `npm run docs:prepare` authoring helper remains a separate optional
OpenAI-based command. It is not called by automated merge documentation and
must not be used when avoiding OpenAI API charges.

## Failure and rollback

- Missing or invalid authentication returns `401` and writes no documentation.
- An unapproved model or malformed request returns `400`; an oversized request
  returns `413`. The first overlapping authenticated request may wait for up to
  600 seconds; additional overlap returns `429`.
- An unavailable Ollama upstream returns `502`; an unready model makes health
  return `503`.
- Model, timeout, content, or validation failures leave the wiki cursor and
  published site unchanged and use the existing bounded retry record.

If quality or latency is unacceptable, stop or disable the wiki automation
before rollback. Revert the wiki endpoint change through a normal docs PR, then
revert the backend runtime through a normal backend PR and protected
check/apply cycle. Do not change the server manually and do not expose Ollama
directly as a shortcut.
