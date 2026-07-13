# NutsNews Immutable Staging Deployment

## Purpose

The `Deploy Verified NutsNews Staging Candidate` workflow in
`ramideltoro/nutsnews-infra` is the only GitOps path that can mutate the
NutsNews staging runtime. It deploys a reviewed GHCR digest to the isolated
`nutsnews-app-staging` Compose project; it does not promote production, change
the production container, attach Caddy to staging, or create a public staging
route.

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
3. GitHub's commit comparison to prove the source SHA is reachable from app
   `main`.
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
   `ansible/playbooks/deploy-staging.yml` in check mode.
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
