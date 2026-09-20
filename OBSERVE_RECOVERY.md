---
title: "Observe Recovery"
description: "Application recovery evidence, backup repair, isolation and verification."
wiki:
  source_route: "/technical/observe-recovery"
  simple_route: "/simple/observe-recovery"
  slug: "observe-recovery"
  primary_diagram:
    file: "diagrams/OBSERVE_RECOVERY.mmd"
    accTitle: "Observe isolated recovery flow"
    accDescr: "Archived backups are downloaded, decrypted and restored in a disposable isolated environment before separate recovery evidence is published."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 990
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: 4debf68e8f3117200098fcf1081c08bbf4e96bdd1fd731b5b84304956b34aab1
---
# Observe Recovery

Observe's local server performs sequential disposable restores under a shared lock,
2 CPU quota, 8 GiB RAM limit, and a network namespace with only loopback. PostgreSQL
production databases, queues and Docker sockets are unreachable from restored
processes. Runtime connection settings point only to disposable local databases. Recovery changes do not enable shadow workers.

The protected `Observe recovery configuration` workflow validates a Caddy candidate
and fixed export helper before applying only this integration. It preserves existing
virtual hosts and reloads Caddy. It does not restart PostgreSQL, Docker or the API.
Do not substitute the full baseline for this targeted rollout on a host with adopted
application configuration. The normal baseline must first reconcile that configuration.

The `observe-recovery-export` system account has a forced-command key and a sudo rule
for one root-owned allowlisted export helper. It can read only the fixed backend
application/configuration/dependencies and a consistent logical database backup, or
the deployed Fantasy application/configuration and its newest saved database backup.
It cannot choose SQL, paths, hosts, writes, restore targets or shell commands.
Exports travel over pinned SSH to the local server, are encrypted and copied to the
existing encrypted cloud destination, then downloaded before isolated restoration.
The client private key stays root-only on the local server; only its public key is
versioned here. Revocation removes this account's authorized key and sudo rule.

A service drop-in runs the existing snapshot verifier immediately after successful
backup. The independent verification timer and all retention policies remain intact.
On 2026-09-20, snapshot `9b3b0868` passed verification: the prior failure was a delay
between the 03:17 backup and 04:17 verification, rather than identified corruption.
A verification failure remains a failure and does not establish a restore result.

Fantasy's existing Caddy virtual host gains sanitized access logging to the existing
Alloy-readable access file. Client addresses, headers, URI and response headers are
removed. Observe queries the exact Fantasy host within that stream. Empty error
queries do not establish coverage; a fresh source event is required.

Rollback: remove `observe-verification.conf` from the backup service drop-in directory
and reload systemd; restore the saved Caddy configuration, validate it, and reload
Caddy; revoke the export key/sudo rule. Preserve all backups and evidence. No password
changes are part of this procedure. Shared documentation belongs in
`ramideltoro/nutsnews-docs`, `OBSERVE_RECOVERY.md` and its audience/diagram companions.

## Evidence and acceptance

The public fleet score continues to use its original weights, thresholds, membership
and availability history. Per-application readiness and restore records have separate
results, a deployed revision, SHA-256 encrypted backup reference, verification time,
expiry and required checks. Records expire after eight days. A changed deployed
revision invalidates a previous result. A fifteen-minute poll detects deployments;
unchanged successful applications are tested weekly. Failed restores retain failure
evidence and receive no successful recovery credit. Public output contains fixed
status descriptions, scope and timestamps; diagnostic archives remain encrypted.

The local Supabase backup's authentication failure was repaired on 2026-09-20 with
the existing production session-pooler credential. No password was reset. Upload
completed to the existing encrypted OneDrive destination and retention was preserved.
The backup now includes the complete public schema and data, authentication schema
without user rows, extension prerequisites and role definitions without passwords.
An isolated restore creates role names without production privileges or memberships
and installs extension prerequisites immediately after the public schema is created.
A cloud download, checksum verification and restoration are required independently
of upload success. Production databases are never restoration targets.

Acceptance requires two actual fleet readings of at least 70 percent fifteen minutes
apart, healthy endpoints, and no unexpected production process changes. The modeled
71 percent is conditional; a failed drill is reported honestly. Source logging must
show fresh application-specific activity before coverage passes. A health response
log contains only its event type and HTTP status, never request contents.

## Operator procedure

Inspect the root-owned recovery service and its encrypted private result on the local
server. Run one selected application with the shared lock and the same CPU/memory
limits. Never run an application outside the disposable network namespace. Repair
the cause, rerun restoration, refresh Observe inspections and check that the deployed
revision still matches. Keep every existing backup and retention policy intact.

## Publication status

This operational guide is a prepared review bundle. Its Simple text and diagram
require the repository's normal review or trusted merge-documentation workflow before
publication. It does not assert that the 70 percent acceptance gate has passed.
