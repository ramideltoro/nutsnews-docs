# Vercel-to-VPS environment synchronization

NutsNews keeps one source of truth with two deployment targets:

```text
Vercel Production variables --reviewed mapping--> VPS production app env
VPS-only variables ---------protected infra input--> VPS production app env
```

Vercel is the source only for variables explicitly enabled in
`ramideltoro/nutsnews-infra/config/vercel-vps-env-sync.json`. The VPS is never
written directly over SSH. The protected Ansible workflow renders
`/etc/nutsnews/nutsnews-app.env` with mode `0600`; Ansible is the only writer.

## Variable classification

The mapping is an allowlist, not a copy-everything rule. A Vercel Production
variable that is absent from the mapping fails the sync. A variable classified
for manual review also stops the sync.

| Category | Current policy | Examples |
| --- | --- | --- |
| Safe to synchronize | Explicitly allowlisted; values are public or non-credential runtime configuration used by the web app. | `ADMIN_EMAILS`, `ADMIN_SHARD_*`, `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_NUTSNEWS_*`, `NUTSNEWS_EDGE_FEED_SNAPSHOT_URL`, and the non-secret `NUTSNEWS_*` runtime/data/project identity variables |
| Server-side secrets to synchronize securely | Supported only through an explicit `sync: true` mapping and the protected Ansible secret path. | `ACTIONS_READ_TOKEN`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `BETTER_STACK_SOURCE_TOKEN`, `HOME_SERVER_STATS_API_KEY`, `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `TURNSTILE_SECRET_KEY` are synchronized because the current VPS web runtime consumes them. |
| Vercel/platform-only | Excluded. | `VERCEL_*`, `NOW_*`, `NEXT_PUBLIC_VERCEL_*`, deployment commit metadata, `SENTRY_ORG`, `SENTRY_PROJECT`, and unused cost-estimation metadata |
| Preview/development-only | Excluded from the production sync. | Names containing the mapped preview/development markers; non-production Vercel targets are never fetched as the source. |
| Manual review | Fails closed until a consumer, target, and security classification are documented in the mapping. | Any newly discovered Turnstile, admin, controller, or other service-specific variable not yet represented by an exact rule |

## Runtime safety identity variables

The VPS needs the same explicit production runtime policy as Vercel because the web image validates it at startup and readiness. The reviewed mapping synchronizes these non-secret values only:

```text
NUTSNEWS_RUNTIME_ENV=production
NUTSNEWS_SIDE_EFFECTS_MODE=live
NUTSNEWS_DATA_ENV=production
NUTSNEWS_SUPABASE_CREDENTIALS_ENV=production
NUTSNEWS_SUPABASE_PROJECT_REF=<production project identity>
NUTSNEWS_PRODUCTION_SUPABASE_PROJECT_REF=<production project identity>
NEXT_PUBLIC_NUTSNEWS_RUNTIME_ENV=production
NEXT_PUBLIC_NUTSNEWS_SIDE_EFFECTS_MODE=live
```

The protected workflow fails closed if a Vercel Production variable is unclassified. Add an exact reviewed mapping and regression test before changing the VPS environment; never edit `/etc/nutsnews/nutsnews-app.env` manually.

`SENTRY_AUTH_TOKEN` is classified as a server-side secret but excluded because it
is a Vercel build/source-map credential. `OPENAI_API_KEY` remains excluded
because it belongs to the Worker runtime, while cost-estimation variables remain
excluded because the VPS web runtime does not consume them. Browser-readable
values are not secrets by virtue of their name; only the reviewed public
configuration above is copied.

The current web runtime has two Supabase consumers: browser code uses
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, while server-side
admin dashboards require `SUPABASE_SERVICE_ROLE_KEY` and accept
`SUPABASE_URL` or the public URL fallback. The mapping therefore synchronizes
the reviewed Production URL to both `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_URL`. The service-role key is never exposed through a `NEXT_PUBLIC_*`
name or browser bundle.

## Required credentials and identifiers

Store these in the `production-vps` GitHub Actions Environment for
`ramideltoro/nutsnews-infra`:

- `NUTSNEWS_VERCEL_TOKEN`: a short-lived, least-privilege Vercel access token
  that can read and decrypt the owning team's project environment variables.
  The token owner must have access to the project and its environment secrets.
  Set an expiration and rotate it before expiry. Store it only in the
  `production-vps` GitHub Environment; do not put it in repository variables,
  files, command arguments, or workflow outputs.
- `NUTSNEWS_VERCEL_PROJECT_ID`: the Vercel project identifier.
- `NUTSNEWS_VERCEL_TEAM_ID`: the owning Vercel team identifier.

Do not store Vercel environment values in GitHub variables, workflow outputs,
artifacts, repository files, or logs. Existing VPS-only values remain in the
protected `NUTSNEWS_APP_ENVS_JSON` input. The sync overlays only the selected
Vercel keys in memory; it does not make the VPS secret map a second Vercel
source of truth.

## Dry run / diff

The workflow is serialized and runs behind the existing `production-vps`
Environment approval. From a machine authenticated to the repository, run:

```bash
gh workflow run "Protected Ansible Apply" \
  --repo ramideltoro/nutsnews-infra \
  -f run_mode=check \
  -f confirm_apply= \
  -f sync_vercel_production=true \
  -f enable_cloudflare_ddns=false \
  -f enable_grafana_alloy=false
```

Approve the `production-vps` Environment gate when prompted, then review the
workflow output. The Vercel API response is classified without printing values;
the diff lists only `added`, `changed`, `removed`, and excluded variable names.
The sync first reads Production metadata, then retrieves each selected value by
ID through Vercel's per-variable decrypted-value endpoint. Ansible check mode
must finish with a healthy recap before any apply.

## Approval and apply

After reviewing the dry-run, the exact production-changing command is:

```bash
gh workflow run "Protected Ansible Apply" \
  --repo ramideltoro/nutsnews-infra \
  -f run_mode=apply \
  -f confirm_apply=vps.nutsnews.com \
  -f sync_vercel_production=true \
  -f enable_cloudflare_ddns=false \
  -f enable_grafana_alloy=false
```

This still requires approval at the existing `production-vps` GitHub Environment
boundary. Do not run the apply command until the check run is reviewed. The
workflow fetches Vercel Production again immediately before Ansible runs, so a
stale dry-run cannot silently apply an unrelated later value.

The workflow overlays the classified Vercel map onto the VPS app map before
passing Ansible extra vars. This is intentional: Ansible extra vars have higher
precedence than role facts, so merging only inside the role would not replace a
pre-existing `NUTSNEWS_APP_ENVS_JSON` map.

After an approved apply, perform the required read-only verification: confirm
the env variable names and name-only fingerprints, confirm the app Compose
service configuration, and check the configured health endpoint. Never print the
env file or its values. A successful workflow without live verification is not a
claim of VPS success.

## Rollback and recovery

The source-controlled rollback is Vercel-first:

1. Restore the last known-good value in the Vercel Production environment using
   the dashboard or a secure stdin-based Vercel CLI/API procedure. Do not put a
   secret in shell history or a command argument.
2. Run the dry-run command above and verify that only the expected variable name
   is changed.
3. Run the apply command through the same protected Environment approval.
4. Re-run read-only health and service verification.

If Ansible fails, do not edit the VPS env file or retry apply blindly. Keep the
source unchanged, inspect the failed task and sanitized recap, correct the
mapping or source through review, run check mode again, and then apply. The
Ansible template task is `no_log` and the workflow removes temporary secret
files in an `always` cleanup step.

If the sync reports that a value is undecrypted or semantically invalid, do not
apply. A 403 while retrieving a selected secret means the protected Vercel
token lacks project/team permission to read environment-variable secrets. Fix
the token in the Vercel account/team token settings and update only
`NUTSNEWS_VERCEL_TOKEN` in the `production-vps` GitHub Environment. For an
invalid source value, repair the Vercel Production variable, rerun check mode,
and review the name-only diff. If an unusable value was already applied, restore
the last known-good Vercel Production value, run check mode, apply through the
same approval boundary, and perform read-only VPS health verification.

## Rotate or remove a variable

To rotate a synchronized variable, update its value in Vercel Production, run
the dry-run, review the name-only change, and run the protected apply. To remove
one, remove it from the Vercel Production environment, run the dry-run, and
apply; the workflow reports the synchronized key as `removed` and Ansible
removes it from the rendered file. If the key must remain on the VPS, it is a
VPS-only variable and must be deliberately managed in the protected infra
input, not restored by bypassing the mapping.

To add a new key, first add an exact mapping rule with its category, destination,
reason, and explicit `sync` value in an infra PR. Do not broaden a pattern to
make an unknown variable pass. Update this document when the runtime consumer or
security classification changes.

## Official Vercel behavior used

The workflow uses bearer-token authentication and the owning `teamId` with
Vercel's documented `GET /v10/projects/{idOrName}/env` endpoint to inspect
Production targets and metadata. It then calls
`GET /v1/projects/{idOrName}/env/{id}` for each selected variable. The list
endpoint's older `decrypt=true` query parameter is deprecated; its `value`
field is not treated as plaintext merely because that parameter was supplied.
The per-variable response must report a usable decrypted value before it can
enter the private temporary selection file.

The sync rejects missing values, undecrypted encrypted/secret/sensitive values,
encrypted-envelope-shaped strings, newlines, and invalid Auth.js/admin shapes.
`AUTH_GOOGLE_ID` must be a plausible Google Web client ID,
`AUTH_GOOGLE_SECRET` must be nonempty, `AUTH_SECRET` must be at least 32
characters, and `ADMIN_EMAILS` must be a comma-separated email list. Failure
messages identify variable names only.

- [Vercel REST API overview](https://vercel.com/docs/rest-api)
- [Vercel REST API: retrieve project environment variables](https://vercel.com/docs/rest-api/projects/retrieve-the-environment-variables-of-a-project-by-id-or-name)
- [Vercel environment-variable management](https://vercel.com/docs/environment-variables/manage-across-environments)
- [Vercel CLI: env](https://vercel.com/docs/cli/env)
- [Vercel system environment variables](https://vercel.com/docs/environment-variables/system-environment-variables)
