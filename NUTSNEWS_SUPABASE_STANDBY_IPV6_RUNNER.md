# NutsNews Supabase Standby IPv6 One-Job Runner

This is the shared operations guide for the isolated runner used to prove Supabase hot-standby credential readiness for `ramideltoro/nutsnews#496`.

Backend implementation issues: `ramideltoro/nutsnews-backend#323` through `#331`.

App workflow routing issue: `ramideltoro/nutsnews-backend#329`, implemented in `ramideltoro/nutsnews`.

Backend source of truth: `ramideltoro/nutsnews-backend/runbooks/SUPABASE_STANDBY_IPV6_RUNNER.md` and `docs/supabase-standby-ipv6-runner-boundary.json`.

## Purpose

Supabase direct Postgres connections use IPv6 unless the project has the paid IPv4 add-on. GitHub-hosted Actions does not provide the required direct IPv6 path, so the protected readiness job uses one disposable Ubuntu VM with real outbound IPv6.

The VM is not a general self-hosted runner. It exists for one protected manual job, then it is deregistered and destroyed.

## Boundary

Never run this runner on `65.75.201.18`, in a container on that host, or inside a nested VM on that host. The backend host owns production runtime state, backend credentials, persistent disks, Docker networks, SSH trust, and sensitive service reachability. Public-repository workflow code must not execute there.

The approved model is:

- dedicated Ubuntu 24.04 LTS VM;
- globally routed outbound IPv6;
- no production/backend credentials;
- repository-scoped runner for `https://github.com/ramideltoro/nutsnews`;
- `--ephemeral` one-job registration;
- `--no-default-labels`;
- single label: `supabase-standby-ipv6`;
- non-root `github-runner` account with no sudo;
- destruction/wipe immediately after the one allowed job.

Runner labels are routing selectors, not authorization. The authorization boundary is the combination of `workflow_dispatch`, `main` ref checks, protected GitHub Environment approval, read-only `GITHUB_TOKEN`, repository workflow controls, branch/ruleset protection, and post-run destruction.

## Activation Checklist

Before registering the runner:

1. Confirm `ramideltoro/nutsnews` public-repo Actions controls are hardened:
   - strongest available external-contributor workflow approval;
   - default workflow token read-only;
   - `main` has reviewed branch protection/ruleset coverage;
   - `supabase-standby` requires approval and is limited to `main`;
   - source-controlled regression rejects `supabase-standby-ipv6` outside the approved readiness workflow.
2. Confirm the reviewed readiness workflow is on `main`.
3. Confirm `preflight.runs-on` remains `ubuntu-latest`.
4. Confirm only `readiness.runs-on` is `[supabase-standby-ipv6]`.
5. Confirm the readiness job has no `sudo`, `apt-get`, package installation, Docker, browser, compiler, or database-server dependency.
6. Run backend Ansible check mode against the disposable VM.
7. Apply the backend hardening/tooling baseline.
8. Run the redacted IPv6 probes:
   - outbound HTTPS over IPv6;
   - DNS AAAA resolution for the configured direct Supabase DB host without printing the hostname;
   - redacted IPv6 TCP/5432 reachability.

## One-Job Run Procedure

1. Register exactly one repository runner with only `supabase-standby-ipv6`.
2. Dispatch `supabase-standby-readiness.yml` from `ramideltoro/nutsnews` `main` with confirmation `verify-supabase-standby-readiness`.
3. Approve the `supabase-standby` Environment.
4. Verify preflight ran on GitHub-hosted `ubuntu-latest`.
5. Verify readiness ran on the one-job IPv6 runner.
6. Verify the inventory validator and read-only direct `psql` metadata query passed.
7. Review logs and summaries for leaked URLs, users, passwords, keys, project refs, runner tokens, private keys, or row data.
8. Verify automatic runner deregistration.
9. Destroy/wipe the VM.
10. Update `ramideltoro/nutsnews#496` and backend issue #331 with only safe evidence.

## Safe Evidence

Allowed:

- workflow run URL;
- timestamp;
- provider, region, OS, architecture;
- boolean IPv6 HTTPS/DNS/TCP results;
- runner label/status/deregistration status;
- VM destruction confirmation;
- statement that retained logs were reviewed for protected-value leaks.

Forbidden:

- Supabase database URLs, hosts, project refs, users, passwords, service-role keys, anon keys;
- GitHub runner registration/removal tokens;
- provider API tokens;
- SSH private keys;
- backend production credentials;
- table row data.

## Abort And Incident Response

Abort and destroy/wipe the VM if:

- IPv6 HTTPS, DNS AAAA, or TCP/5432 probes fail;
- the runner advertises generic labels such as `self-hosted`, `linux`, `x64`, or `arm64`;
- any unexpected job is assigned;
- the workflow is not running from the expected `main` commit;
- the environment approval is stale or unexpected;
- protected values appear in logs, summaries, artifacts, comments, or retained diagnostics;
- runner deregistration fails.

Incident response:

1. Cancel the workflow run.
2. Remove the GitHub runner.
3. Destroy/wipe the VM.
4. Delete logs if they contain protected values.
5. Rotate exposed Supabase, GitHub, provider, or SSH credentials.
6. Revert the readiness runner label to `ubuntu-latest` if the IPv6 runner path must be disabled.
7. Record a redacted issue comment with facts, commands, and remaining actions.

## Non-Failover Scope

A green readiness run proves only that the protected workflow reached the configured Supabase DB over IPv6 and ran a read-only metadata query. It does not approve failover.

Before failover, these gates remain separate requirements: lag <= 30 seconds, parity, schema, sequence, writer-pause, and split-brain checks.

## Rollback

- Stop registering new runners.
- Remove any stale repository runner.
- Destroy/wipe the disposable VM.
- Revert `ramideltoro/nutsnews/.github/workflows/supabase-standby-readiness.yml` so `readiness.runs-on` is `ubuntu-latest`.
- Keep `supabase-standby` secrets unless the owner separately approves rotation or removal.
- Use the Supabase IPv4 add-on only through a separate reviewed decision.
