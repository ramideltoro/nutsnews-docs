# NutsNews Immutable Staging Deployment

## Purpose

The `Deploy Verified NutsNews Staging Candidate` workflow in
`ramideltoro/nutsnews-infra` is the only GitOps path that can mutate the
NutsNews staging runtime. It deploys a reviewed GHCR digest to the isolated
`nutsnews-app-staging` Compose project; it does not promote production, change
the production container, attach Caddy to staging, or create a public staging
route.

The deployment key is designed to terminate at a server-side forced command
for the root-owned staging bundle. The workflow proves arbitrary SSH commands
are rejected, then submits only `check`, `apply`, and sanitized `verify`
requests. Hostname/Access onboarding remains a separate protected step; see
[VPS Staging Access And Credential Boundary](NUTSNEWS_VPS_STAGING_ACCESS_BOUNDARY.md).

The workflow is activated only by the `nutsnews-staging-release`
`repository_dispatch` event. Its manual `workflow_dispatch` path is a
validation-only rehearsal: it can never attach `staging-vps`, read a staging
secret, use SSH, or run Ansible.

## Candidate Contract

The dispatch `client_payload` must be exactly this JSON object. Extra fields,
missing fields, non-string values, leading/trailing whitespace, mutable tags,
and incompatible values are rejected.

```json
{
  "schema_version": "20260712170000",
  "source_repository": "ramideltoro/nutsnews",
  "source_commit": "<full lowercase 40-character SHA>",
  "image_repository": "ghcr.io/ramideltoro/nutsnews",
  "image_digest": "sha256:<64 lowercase hexadecimal characters>",
  "build_id": "<GitHub workflow run ID>-<positive attempt>",
  "source_workflow_run_id": "<GitHub workflow run ID>"
}
```

`schema_version` is the 14-digit application migration schema version expected
by `/readyz`. `build_id` must be the supplied source workflow-run ID followed
by its actual run attempt. The image is always addressed as
`ghcr.io/ramideltoro/nutsnews@sha256:…`; no tag is accepted.

## Trust Boundary Before Secrets

The preflight job has no GitHub Environment attachment, SSH credential, or
staging secret. Before the `staging-vps` job is eligible to start, it requires:

1. The exact candidate contract above.
2. A completed, successful `Container Image` `push` workflow on the trusted
   app repository's `main`, whose head SHA and attempt match the candidate.
3. GitHub's `<candidate-SHA>...main` comparison to prove the source SHA is
   reachable from app `main`: only `ahead` (current `main` contains the
   candidate) or `identical` is accepted. `behind` and `diverged` fail closed.
4. OCI index, linux/amd64 manifest, and attached SLSA v1 provenance checks in
   GHCR. The provenance must bind the manifest, app repository, source SHA,
   build ID, deployment target, and GitHub Actions run/attempt to the candidate.

No event field is interpolated into a shell or SSH command. The staging job
revalidates the approved fields into a private Ansible vars file before use.

## What an Approved Dispatch Does

After the `staging-vps` Environment approval, the workflow:

1. Uses only `NUTSNEWS_STAGING_VPS_SSH_PRIVATE_KEY`,
   `NUTSNEWS_STAGING_VPS_KNOWN_HOSTS`, and optional
   `NUTSNEWS_STAGING_APP_ENVS_JSON` from that Environment. Production secrets
   and the `production-vps` Environment are never referenced.
2. Runs repository guardrails, Ansible syntax validation, and the fixed
   `ansible/playbooks/deploy-staging.yml` in check mode. That play initializes
   its reviewed service-foundation defaults before evaluating the fixed
   staging-only guard, so no check can rely on a later role include.
3. Uses a non-cancelling GitHub concurrency queue and a staging-host mutation
   lock. The play accepts only the `staging-vps` inventory alias, staging
   project/container/network identity, and the `nutsnews-staging-deploy` tag.
4. Applies only `nutsnews-staging`, then performs bounded `/readyz` retries
   (30 attempts, three seconds apart; SSH commands have explicit timeouts).
5. Requires both the configured container reference and Docker's resolved
   `RepoDigests` to equal the requested immutable digest.
6. Creates a GitHub Deployment in environment `staging`, with a sanitized
   candidate-derived deployment ID, requested digest, source/build metadata,
   infrastructure commit, config generation, timestamp, and per-run history.
   Its final Deployment status records the actual digest. A failed, timed-out,
   or cancelled run can never post a successful status.

Rerunning a candidate is idempotent at the Compose layer and intentionally
creates another GitHub Deployment history entry for auditability.

## Staging Supabase Schema Prerequisite

The app repository now supplies a separate, fixed-purpose `Apply Verified
NutsNews Staging Supabase Migrations` workflow. It is the only GitOps path for
the staging Supabase schema. It exists because `/readyz` rejects a staging
runtime until `nutsnews_migration_schema_contract` reports the migration head
and catalog fingerprint expected by the immutable app image. This is a
staging-only forward-migration path; it does not deploy a container, open SSH,
use `staging-vps`, or promote production.

### Simple Summary

Before the staging app can say it is ready, this workflow safely gives the
staging database the page it is missing. A person must approve the staging
database step, and the workflow checks that it used the right app version.

### Intermediate Summary

An operator starts the workflow from the protected `main` branch with a full
source SHA, the migration head expected by that source, and an exact
confirmation phrase. The unprotected preflight rejects incomplete or mutable
values and proves that the SHA is already in `main`. Only then can the
`staging-supabase` GitHub Environment provide a staging database connection.
The protected job serializes requests, applies forward migrations under the
database advisory lock, reloads PostgREST's schema cache, and verifies the
database contract before reporting success.

### Expert Summary

The request contract is intentionally narrower than the immutable image
candidate contract: the schema operation executes reviewed SQL from a trusted
source commit, so it accepts only `source_commit`, `migration_head`, and the
literal `apply-staging-supabase-migrations` confirmation. The preflight has no
Environment attachment or database secret. It checks the full lowercase SHA,
the 14-digit head, and `git merge-base --is-ancestor <sha> origin/main`, then
checks out that exact commit and requires its compiled migration contract to
match the requested head. The protected job uses
`NUTSNEWS_STAGING_MIGRATION_DATABASE_URL` only from `staging-supabase`, runs
the reviewed workflow revision's forward-only locked migration runner against
the approved source checkout's migration files, invokes `NOTIFY pgrst, 'reload
schema'`, and queries `nutsnews_migration_schema_contract` directly for both
the expected head and matching fingerprint. It never executes scripts from the
older approved source checkout, so a valid historical source cannot bypass a
newer automation safeguard.

```mermaid
flowchart LR
  A[Operator supplies source SHA and migration head] --> B[Preflight on main: strict validation and main reachability]
  B -->|no secrets available| C[Checkout exact reviewed source and validate migration contract]
  C --> D[staging-supabase Environment approval]
  D --> E[Advisory lock and forward-only supabase db push]
  E --> F[Record head, reload PostgREST schema cache, verify fingerprint]
  F --> G[Dispatch immutable staging runtime candidate]
  G --> H[/readyz and actual Docker digest verification]
```

### Required One-Time Environment Setup

Before an authorized run, a repository administrator must create the
`staging-supabase` GitHub Environment in `ramideltoro/nutsnews`, limit its
deployment branches to protected `main`, and configure required reviewers.
Store exactly one database credential there:

- `NUTSNEWS_STAGING_MIGRATION_DATABASE_URL` — a connection URL for the
  isolated staging Supabase Postgres project with only the privileges needed
  to apply its reviewed migrations.

Do not put this value in repository secrets, `NUTSNEWS_STAGING_APP_ENVS_JSON`,
workflow inputs, application configuration, logs, or documentation. Do not
reuse a production database URL or production credential. The preflight job
must remain free of this Environment and its secret.

### Authorized Run and Evidence

Run `Apply Verified NutsNews Staging Supabase Migrations` from `main` with:

1. `source_commit`: the exact full SHA of the already-qualified app source.
2. `migration_head`: the 14-digit last migration filename at that SHA (for the
   current `/readyz` failure, `20260713000000`).
3. `confirmation`: `apply-staging-supabase-migrations`.

The run is queued under a non-cancelling concurrency group and the database
advisory lock, so a repeated approved request is safe to retry and does not
apply concurrently. Success evidence is the workflow's direct database
contract/fingerprint verification. It is schema evidence only, not staging
runtime evidence. After it succeeds, send the existing immutable
`nutsnews-staging-release` candidate to the infrastructure workflow and retain
that workflow's `/readyz` and actual Docker digest evidence before considering
the staging deployment complete.

### Safe Connection-Failure Diagnosis

#### Simple Summary

If the staging database cannot be reached, the workflow says what kind of
connection problem it found without showing the database password.

#### Intermediate Summary

The advisory-lock client keeps at most a small internal amount of PostgreSQL
error text and converts it to one fixed, non-secret diagnosis. The available
diagnoses cover malformed connection URLs, rejected authentication, DNS,
network reachability, a missing database, and TLS or database access-policy
rejection. A failure stops before the lock is acquired, so no migration SQL is
applied and no staging runtime deployment may be dispatched.

#### Expert Summary

The reviewed lock runner never writes the `psql` stderr stream, connection
string, or password to GitHub Actions output. It only matches the bounded
internal stderr buffer against predefined patterns and emits a constant
operator message. In particular, a password containing reserved URL characters
can be diagnosed as a malformed URL without exposing the URL; encode those
password characters before saving the Session Pooler URL in
`NUTSNEWS_STAGING_MIGRATION_DATABASE_URL`. Any unrecognized error remains a
generic fail-closed connection failure. The migration command and PostgREST
reload are reached only after the advisory lock is acquired.

The reviewed runner creates a private per-run `psql` script and starts `psql`
directly, with no wrapper process. After PostgreSQL grants the advisory lock,
the script writes the constant `LOCK_ACQUIRED` result to a local marker file
and immediately closes that file; the runner polls only that flushed local
marker. This avoids treating a buffered stdout pipe as a 30-second lock
timeout and ensures a timeout or normal release signals the actual lock-holder
process. The temporary script and marker are mode-restricted and removed on
both failure and release. The exact lock key, timeout, and no-secret logging
boundary remain unchanged.

### Risks, Mitigations, and Rollback

- Forward SQL is intentionally not automatically reversed. If a migration is
  wrong, stop the staging release, correct it in a reviewed follow-up
  migration, and use the separately documented staging restore process if a
  restore is genuinely required.
- The workflow cannot silently use production because it references neither a
  production Environment nor a production secret or target. GitHub Environment
  branch restrictions and required reviewers add an independent boundary.
- If the runner cannot start `psql`, create its private lock files, or observe
  the flushed marker within the bounded wait, the lock client fails before any
  migration SQL runs; it never bypasses locking to keep the release moving.
- A cancelled or failed run cannot claim the schema contract was verified; the
  infrastructure release remains blocked by `/readyz` until a later successful
  run proves the contract.

This prerequisite supports [infrastructure issue #117](https://github.com/ramideltoro/nutsnews-infra/issues/117).

## Rehearse a Candidate

From GitHub Actions, select `Deploy Verified NutsNews Staging Candidate`, enter
the exact candidate JSON, and type:

```text
rehearse-staging-candidate
```

Success is evidence that schema validation, source-main trust, and OCI
provenance checks agree. It is not deployment evidence and it changes no VPS
state.

## Separate Live-Apply Approval and Evidence

This documentation and its infrastructure PR do not authorize or perform a
live staging apply. After the infrastructure PR is merged, an authorized source
workflow must send the exact `nutsnews-staging-release` candidate. Approve the
`staging-vps` Environment only after the candidate and check-mode output are
reviewed.

The issue may be closed only after one approved workflow run supplies all of
the following evidence:

- a successful GitHub Deployment status for `staging`;
- the workflow's bounded `/readyz` success with matching source SHA, build ID,
  `vps-staging` target, config generation, schema version, and expected digest;
- Docker's actual `RepoDigests` containing the requested
  `ghcr.io/ramideltoro/nutsnews@sha256:…` reference; and
- read-only staging/production capacity and health verification required by
  [VPS Staging Capacity Budget](NUTSNEWS_VPS_STAGING_CAPACITY.md).

Do not SSH in manually to start, repair, or verify a deployment outside this
GitOps workflow. If a workflow fails, fix the reviewed configuration in a new
pull request and retry the same immutable candidate.

## Related Docs

- [VPS Runtime Environment Isolation](NUTSNEWS_VPS_RUNTIME_ENVIRONMENT_ISOLATION.md)
- [VPS Staging Capacity Budget](NUTSNEWS_VPS_STAGING_CAPACITY.md)
- [Dual-Target Web Deployment](NUTSNEWS_DUAL_TARGET_WEB_DEPLOYMENT.md)
