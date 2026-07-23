# NutsNews Backend Drift Check

This documents the read-only drift check for `ramideltoro/nutsnews-backend`.

## Purpose

The drift check tells whether the live backend host has moved away from the repo-managed baseline without mutating the server.

Use it after:

- protected apply changes;
- suspected manual drift;
- listener, firewall, SSH, service, backup, or monitoring changes;
- a public exposure concern.

## Workflow

Backend repo workflow:

```text
Backend Drift Check
```

The workflow is manual and uses the `production-backend` GitHub Environment. It requires approval before it can access the backend SSH key.

## What It Verifies

The workflow runs only fixed read-only SSH probes. It checks:

- hostname;
- public TCP listeners;
- failed systemd units;
- passwordless sudo readiness for protected apply;
- effective SSH authentication policy where readable;
- Docker, Caddy, backend service, PostgreSQL, and Redis/Valkey presence;
- RabbitMQ broker health, image identity, managed config checksums, topology,
  permissions metadata, listeners, backup freshness, and last smoke status when
  RabbitMQ is enabled;
- swap and reboot-required state;
- UFW status when readable;
- managed baseline file presence.

It writes a GitHub Step Summary and uploads `backend-drift-report.json`.

## Result Semantics

Each surface is classified as:

- `expected`;
- `missing`;
- `unexpected`;
- `unknown`.

Unexpected public TCP exposure or failed systemd units fail the workflow.

Missing repo-managed files are acceptable while backend issue #10 is blocked by sudo credentials. Once the protected apply path succeeds, those missing entries should disappear.

## Current Live Baseline

Latest protected run when this doc was added:

```text
https://github.com/ramideltoro/nutsnews-backend/actions/runs/29527557314
```

Result:

```text
status=pass
expected=8
missing=7
unexpected=0
unknown=0
high_priority_unexpected=[]
```

The missing entries were the known protected-apply blocker and not-yet-applied baseline files.

## Rollback

The drift workflow is read-only, so it has no server rollback step.

If it finds drift, reconcile through a backend PR and the protected backend apply workflow. Do not patch live drift manually over SSH except for documented break-glass recovery.

RabbitMQ-specific drift, smoke, and protected operation details are tracked in
[Worker-Uplift RabbitMQ Operations](NUTSNEWS_WORKER_UPLIFT_RABBITMQ_OPERATIONS.md).
