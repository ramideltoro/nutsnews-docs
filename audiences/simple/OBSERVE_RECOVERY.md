---
title: Observe Recovery
description: >-
  How Observe checks recovery evidence, repairs backups, restores in isolation,
  and verifies results without touching production databases or services.
wiki:
  source_route: /technical/observe-recovery
  simple_route: /simple/observe-recovery
  slug: observe-recovery
  primary_diagram:
    file: diagrams/OBSERVE_RECOVERY.mmd
    accTitle: Observe isolated recovery flow
    accDescr: >-
      Backups are exported, encrypted, downloaded, and restored in a disposable
      isolated environment. Verification then decides whether recovery evidence
      is published; otherwise the failure is reported and rollback revokes
      export access while preserving evidence.
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 990
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 369563e234b0ce93cd1e43c5305e6ea73b12f11bbd1fdde7eda5afc0ea49fcd8
---
# Observe Recovery

Observe Recovery describes how Observe proves that backups can be repaired, restored, and checked without affecting production systems. It uses a disposable isolated environment, separate verification records, and specific rollback steps to keep recovery work safe and auditable.

## What this procedure is for

Observe's local server performs sequential disposable restores under a shared lock. The restore environment has:

- a 2 CPU quota
- an 8 GiB RAM limit
- a network namespace with only loopback access

That means production PostgreSQL databases, queues, and Docker sockets are not reachable from restored processes. Runtime connection settings point only to disposable local databases. Recovery changes do not enable shadow workers.

## Recovery configuration

The protected **Observe recovery configuration** workflow validates a Caddy candidate and a fixed export helper before applying only this integration. It keeps existing virtual hosts in place and reloads Caddy.

It does **not** restart:

- PostgreSQL
- Docker
- the API

Do not replace the targeted rollout with the full baseline on a host that already has adopted application configuration. The normal baseline must first reconcile that configuration.

## Export and restore model

The `observe-recovery-export` system account uses:

- a forced-command SSH key
- a sudo rule for one root-owned allowlisted export helper

It can only read either:

- the fixed backend application/configuration/dependencies and a consistent logical database backup, or
- the deployed Fantasy application/configuration and its newest saved database backup

It cannot choose:

- SQL
- paths
- hosts
- writes
- restore targets
- shell commands

Exports are sent over pinned SSH to the local server, encrypted, copied to the existing encrypted cloud destination, and then downloaded before isolated restoration. The client private key stays root-only on the local server; only the public key is versioned here. Revocation removes the account's authorized key and sudo rule.

## Verification and backup checks

A service drop-in runs the existing snapshot verifier immediately after a successful backup. The independent verification timer and all retention policies remain intact.

On 2026-09-20, snapshot `9b3b0868` passed verification. The earlier failure was caused by a delay between the 03:17 backup and the 04:17 verification, not by identified corruption. A verification failure is still a failure and does not prove that a restore will work.

## Logging and recovery evidence

Fantasy's existing Caddy virtual host adds sanitized access logging to the existing Alloy-readable access file. The following are removed from that log stream:

- client addresses
- headers
- URI
- response headers

Observe queries the exact Fantasy host in that stream. Empty error queries do not prove coverage; a fresh source event is required.

## Evidence and acceptance

The public fleet score keeps its original weights, thresholds, membership, and availability history. Per-application readiness and restore records have separate results, a deployed revision, SHA-256 encrypted backup reference, verification time, expiry, and required checks.

Key rules:

- records expire after eight days
- a changed deployed revision invalidates a previous result
- a fifteen-minute poll detects deployments
- unchanged successful applications are tested weekly
- failed restores keep failure evidence and do not earn successful recovery credit
- public output contains fixed status descriptions, scope, and timestamps
- diagnostic archives remain encrypted

The local Supabase backup's authentication failure was repaired on 2026-09-20 using the existing production session-pooler credential. No password was reset. Upload completed to the existing encrypted OneDrive destination and retention was preserved.

The backup now includes:

- the complete public schema and data
- the authentication schema without user rows
- extension prerequisites
- role definitions without passwords

An isolated restore creates role names without production privileges or memberships and installs extension prerequisites immediately after the public schema is created. Cloud download, checksum verification, and restoration are required separately from upload success. Production databases are never restoration targets.

Acceptance requires:

- two actual fleet readings of at least 70 percent, fifteen minutes apart
- healthy endpoints
- no unexpected production process changes

The modeled 71 percent is conditional, and a failed drill must be reported honestly. Source logging must show fresh application-specific activity before coverage passes. A health response log contains only its event type and HTTP status, never request contents.

## Operator procedure

1. Inspect the root-owned recovery service and its encrypted private result on the local server.
2. Run one selected application with the shared lock and the same CPU and memory limits.
3. Never run an application outside the disposable network namespace.
4. Repair the cause.
5. Rerun restoration.
6. Refresh Observe inspections.
7. Check that the deployed revision still matches.
8. Keep every existing backup and retention policy intact.

## Rollback

If rollback is needed:

- remove `observe-verification.conf` from the backup service drop-in directory and reload systemd
- restore the saved Caddy configuration, validate it, and reload Caddy
- revoke the export key and sudo rule
- preserve all backups and evidence

No password changes are part of this procedure.

## Publication status

This is a prepared review bundle, not a published guide. Its Simple text and diagram require the repository's normal review or trusted merge-documentation workflow before publication. It does not claim that the 70 percent acceptance gate has passed.

Shared documentation belongs in `ramideltoro/nutsnews-docs`, `OBSERVE_RECOVERY.md`, and its audience and diagram companions.
