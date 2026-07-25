# NutsNews Supabase Standby Restricted Probe

This is the shared operations guide for proving Supabase standby credential and
direct-connectivity readiness for `ramideltoro/nutsnews#496`.

Backend replacement issues: `ramideltoro/nutsnews-backend#333` through `#340`.
This guide supersedes the paid DigitalOcean/self-hosted-runner design from
backend issues `#323` through `#331`.

Backend source of truth:
`ramideltoro/nutsnews-backend/runbooks/SUPABASE_STANDBY_PROBE_BOUNDARY.md` and
`docs/supabase-standby-probe-boundary.json`.

## Purpose

The approved design has zero additional recurring cost. The app readiness
workflow stays on GitHub-hosted `ubuntu-latest`; the existing backend host at
`65.75.201.18` is used only as a locked forced-command SSH probe because that
host already has the verified direct IPv6 path to Supabase PostgreSQL.

Do not provision a DigitalOcean VM, register a GitHub self-hosted runner, create
a runner-admin token, buy a Supabase IPv4 add-on, switch to a new Supabase
project, or use the Supabase pooler for this readiness path.

## Boundary

Public-repository workflow code must never execute on the backend. The backend
only accepts one restricted SSH key for the dedicated `nutsnews-standby-probe`
identity, and that key is forced to run one root-owned program:

```text
/usr/local/libexec/nutsnews-standby-supabase-probe
```

The probe identity has:

- locked password;
- no sudo/admin/Docker/production runtime groups;
- no interactive shell;
- no PTY;
- no agent, TCP, stream-local, tunnel, or X11 forwarding;
- no user-controlled environment;
- no production-file access.

The forced command rejects any non-empty `SSH_ORIGINAL_COMMAND`.

## Probe Contract

The app workflow pipes exactly one protected direct PostgreSQL URL to SSH stdin.
GitHub does not run `psql`, does not send SQL, and does not pass caller-chosen
executables, hosts, arguments, or shell commands.

The backend probe:

- accepts only one bounded, single-line PostgreSQL URL from stdin;
- validates `postgres`/`postgresql` protocol;
- validates the exact protected expected `db.<project-ref>.supabase.co` host;
- validates port `5432`, database `postgres`, credentials, and `sslmode=require`;
- rejects Supabase pooler URLs;
- invokes `psql` without putting the database URI or password in argv;
- runs one fixed read-only query with connection and statement timeouts;
- serializes execution with `flock` and imposes a hard timeout;
- discards raw `psql` stdout/stderr;
- returns only the safe success token:

```text
READY
```

Failures return only generic failure output. The backend must not persist the DB
URL or log credentials, project refs, hostnames, database users/passwords,
PostgreSQL errors, or row data.

## Run Procedure

1. Confirm `ramideltoro/nutsnews` has no self-hosted runners.
2. Confirm the app workflow is on `main` and both jobs use `ubuntu-latest`.
3. Dispatch `Supabase Standby Credential Readiness` from `main` with
   confirmation `verify-supabase-standby-readiness`.
4. Approve only the expected `supabase-standby` environment gate.
5. Verify preflight and readiness both pass on GitHub-hosted runners.
6. Verify the restricted backend probe returns `READY`.
7. Review logs and summaries for protected-value leakage.
8. Update `ramideltoro/nutsnews#496` with only safe evidence and the non-failover
   scope statement.

## Required Protected Values

`ramideltoro/nutsnews` `supabase-standby` Environment secrets:

- `NUTSNEWS_STANDBY_SUPABASE_PROJECT_REF`
- `NUTSNEWS_STANDBY_SUPABASE_URL`
- `NUTSNEWS_STANDBY_SUPABASE_DB_URL`
- `NUTSNEWS_STANDBY_SUPABASE_SERVICE_ROLE_KEY`
- `NUTSNEWS_STANDBY_SUPABASE_ANON_KEY`
- `NUTSNEWS_STANDBY_PROBE_SSH_PRIVATE_KEY`
- `NUTSNEWS_STANDBY_PROBE_KNOWN_HOSTS`

`ramideltoro/nutsnews` variables:

- `NUTSNEWS_STANDBY_PROBE_HOST`
- `NUTSNEWS_STANDBY_PROBE_USER`

`ramideltoro/nutsnews-backend` `production-backend` protected inputs:

- `NUTSNEWS_STANDBY_PROBE_SSH_PUBLIC_KEY`
- `NUTSNEWS_PRODUCTION_SUPABASE_PROJECT_REF`
- optional `NUTSNEWS_STANDBY_PROBE_EXPECTED_SUPABASE_PROJECT_REF`
- optional `NUTSNEWS_STANDBY_PROBE_EXPECTED_SUPABASE_HOST`

The app stores only the private key. The backend stores only the public key and
the protected expected target. Known hosts must be independently verified; do
not trust a fresh `ssh-keyscan` result without comparing it to the existing
trusted backend host key.

## Safe Evidence

Allowed:

- workflow run URL;
- commit SHA;
- GitHub-hosted runner labels;
- `READY` token;
- statement that direct connectivity succeeded through the restricted probe;
- statement that logs/summaries were reviewed for protected-value leaks;
- no self-hosted runner count.

Forbidden:

- Supabase database URLs, hosts, project refs, users, passwords, service-role
  keys, or anon keys;
- SSH private keys;
- backend production credentials;
- PostgreSQL errors;
- table row data.

## Abort And Incident Response

Abort if:

- the app workflow no longer runs both jobs on `ubuntu-latest`;
- any self-hosted runner appears;
- the protected environment approval is stale or unexpected;
- the backend probe returns anything other than `READY`;
- protected values appear in logs, summaries, artifacts, comments, or retained
  diagnostics.

Incident response:

1. Cancel the workflow run.
2. Remove the app probe private-key and known-hosts secrets if exposure is
   suspected.
3. Rotate exposed Supabase, GitHub, backend SSH, or probe SSH material.
4. Run the backend protected probe workflow in rollback/remove mode if the
   backend probe identity or public key must be removed.
5. Record only redacted facts and remaining actions.

## Non-Failover Scope

A green readiness run proves only protected credential readiness and direct
database connectivity through the restricted backend probe. It does not approve
failover.

Before failover, these gates remain separate requirements: lag <= 30 seconds,
parity, schema, sequence, writer-pause, and split-brain checks.
