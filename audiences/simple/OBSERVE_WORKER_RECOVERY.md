---
title: Observe Worker Recovery
description: >-
  How to check that NutsNews workers can recover from encrypted backups without
  touching production queues or restarting production workers.
wiki:
  source_route: /technical/observe-worker-recovery
  simple_route: /simple/observe-worker-recovery
  slug: observe-worker-recovery
  primary_diagram:
    file: diagrams/OBSERVE_WORKER_RECOVERY.mmd
    accTitle: Observe Worker Recovery flow
    accDescr: >-
      An encrypted archive is authenticated, restored in an isolated disposable
      namespace, and used to start workers, verify readiness, replay a test
      carrier, and confirm duplicate recognition while preserving records and
      inbox counts. Nonempty queues block verification.
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 980
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 9fa5126bbf27924dc16338e3f8cadebae56c4cdaeec4f71a3513edb52c947afc
---
# Observe Worker Recovery

## What this is for
This procedure checks that six deployed NutsNews workers can recover from encrypted backups. It is meant to confirm recovery without restarting production workers or consuming production queue messages.

This extends Observe's existing recovery controller. Scoring still depends on a genuine test success.

## What goes in and what stays isolated
The restricted backend exporter provides fixed read-only actions for these areas:

- fetcher
- canonicalizer
- enrichment
- approval
- persistence
- publication

The archive includes:

- deployed application files
- effective configuration
- a consistent PostgreSQL backup
- role definitions without passwords
- a sanitized RabbitMQ definition backup no older than eight days
- the broker runtime

Important isolation rules:

- Production queues must be empty before and after capture.
- This drill does not capture queued message bodies.
- Nonempty queues block verification.
- Download and authenticate the encrypted cloud archive before restoration.
- Run drills one at a time under the existing shared lock.
- Use the disposable namespace with 2 CPUs, 8 GiB RAM, and no swap.
- The disposable namespace has loopback networking only.
- It has no production database or queue sockets.
- Production databases are never restore targets.

## What must be verified
Restore:

- roles
- permissions
- populated worker tables
- broker topology
- the deployed application

In the disposable environment only:

- rewrite dependency addresses
- rewrite broker test credentials

Then:

1. Start the real worker and the restored dependencies.
2. Require readiness.
3. Replay a schema-valid test carrier using the completed identity from the restored inbox.
4. Verify duplicate recognition.
5. Confirm the original record and inbox count are preserved.

This verifies recovery and replay safety. It does not prove:

- new-work throughput
- full pipeline publication
- production cutover readiness

Approval's Qwen dependencies also remain isolated.

## Backup readiness and restore results
Backup readiness and completed restores are separate results.

A passing result requires no missing inputs, failed drills, corrupt archives, expired evidence, or changed deployed revisions.

Other points to keep in mind:

- Detailed artifacts remain private and encrypted.
- Public health exposes only sanitized outcomes, scope, and timestamps.
- Drills run weekly and after revision changes.
- Evidence expires after eight days.
- Preserve score weights, thresholds, membership, and availability-history requirements.

## Rollout and rollback
Backend PR 545 adds the fixed exports through the protected recovery-only workflow.

The documented state says:

- preflight passed
- apply passed
- no full backend reconciliation is required
- no production worker activation is required
- no database restore is required
- no reboot is required
- no password change is required

To revert, deploy the prior helper through the same workflow.

The controller follows validated local-server-infra releases and matching Observe runbook source locks.

Export success alone never proves application restoration.

## Shared backup protection
The image-backup cleanup and freshness collector select only the current hostname's exact timestamped image directories.

They exclude:

- database recovery folders on the encrypted destination
- Observe recovery folders on the encrypted destination

Existing image retention count, destinations, and schedule remain unchanged.

## Acceptance
Acceptance requires:

- current-revision passing evidence
- at least 76 percent across two fresh fleet checks
- the checks must be fifteen minutes apart

Also verify:

- public endpoints
- backend process identities
- unrelated local services

Keep failed or unverified recovery checks visible.

Observe emits a sanitized event only after real collection work completes, which keeps scoped log coverage genuine.
