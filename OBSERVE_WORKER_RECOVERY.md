---
title: "Observe Worker Recovery"
description: "Draft documentation for Observe Worker Recovery."
wiki:
  source_route: "/technical/observe-worker-recovery"
  simple_route: "/simple/observe-worker-recovery"
  slug: "observe-worker-recovery"
  primary_diagram:
    file: "diagrams/OBSERVE_WORKER_RECOVERY.mmd"
    accTitle: "Observe Worker Recovery authoring flow"
    accDescr: "The expert source and primary diagram feed a Simple draft that passes automated quality checks before publication."
  status: draft
  collection: platform-and-data
  section: core-platform
  order: 980
  approval:
    state: unreviewed
    publishing: allowed
    reviewed_by: pending
    reviewed_on: pending
    technical_source_hash: bbe0f0a33772b254bbaa9b0314a8ccba7220ee5073f78a556e3434e24e31a37c
---
# Observe Worker Recovery

## Purpose
Verify that six deployed NutsNews workers can recover from encrypted backups without restarting production workers or consuming production queue messages. This extends Observe's existing recovery controller; scoring remains conditional on genuine test success.

## Inputs and isolation
The restricted backend exporter exposes fixed read-only actions for fetcher, canonicalizer, enrichment, approval, persistence and publication. Archives contain deployed application files, effective configuration, a consistent PostgreSQL backup, role definitions without passwords, a sanitized RabbitMQ definition backup no older than eight days, and the broker runtime. Production queues must be empty before and after capture because this drill does not capture queued message bodies. Nonempty queues block verification.

Download and authenticate the encrypted cloud archive before restoration. Serialize drills under the existing shared lock with 2 CPUs, 8 GiB RAM and no swap. The disposable namespace has loopback networking only and no production database or queue sockets. Production databases are never restore targets.

## Verification requirements
Restore roles, permissions, populated worker tables, broker topology and the deployed application. Rewrite dependency addresses and broker test credentials only in the disposable environment. Start the real worker and restored dependencies, require readiness, replay a schema-valid test carrier using the completed identity from the restored inbox, and verify duplicate recognition while preserving the original record and inbox count. This verifies recovery and replay safety; it does not prove new-work throughput, full pipeline publication or production cutover readiness. Approval's Qwen dependencies also remain isolated.

Backup readiness and completed restores are separate results. Missing inputs, failed drills, corrupt archives, expired evidence or changed deployed revisions earn no passing credit. Detailed artifacts remain private and encrypted; public health exposes sanitized outcomes, scope and timestamps. Drills run weekly and after revision changes; evidence expires after eight days. Preserve score weights, thresholds, membership and availability-history requirements.

## Rollout and rollback
Backend PR 545 adds the fixed exports through the protected recovery-only workflow. Its preflight and apply passed. No full backend reconciliation, production worker activation, database restore, reboot or password change is required. Revert by deploying the prior helper through that workflow. The controller follows validated local-server-infra releases and matching Observe runbook source locks. Export success alone never proves application restoration.

## Shared backup protection
The image-backup cleanup and freshness collector select only the current hostname's exact timestamped image directories. Database and Observe recovery folders on the same encrypted destination are excluded from image retention. Existing image retention count, destinations and schedule remain unchanged.

## Acceptance
Require current-revision passing evidence and at least 76 percent across two fresh fleet checks fifteen minutes apart. Verify public endpoints, backend process identities and unrelated local services. Keep failed or unverified recovery checks visible. Observe emits a sanitized event only after real collection work completes, maintaining genuine scoped log coverage.
