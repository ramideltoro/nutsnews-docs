# NutsNews VPS Runtime Environment Isolation

NutsNews has separate production and staging runtime identities. Production
retains its existing route and reviewed image; staging remains deliberately
disabled even though the VPS capacity decision is now recorded.

## When To Use This

Use this guide when reviewing or changing the NutsNews Compose/Ansible app
layer for [nutsnews-infra #119](https://github.com/ramideltoro/nutsnews-infra/issues/119).
It does not authorize a staging deployment.

## Simple Explanation

Production and staging use different Docker projects, files, networks,
containers, and writable cache volumes. Production keeps its current identity,
so this safety refactor does not move the live route or swap its image digest.

Staging is a prepared-but-disabled slot. It cannot start or receive a Caddy
route in this phase. [The #118 capacity contract](NUTSNEWS_VPS_STAGING_CAPACITY.md)
now defines its hard CPU, memory, PID, log, disk-preflight, and test-traffic
budget, but does not authorize activation.

Any configured application image must be a reviewed immutable reference:

```text
ghcr.io/ramideltoro/nutsnews@sha256:<64 lowercase hexadecimal characters>
```

Mutable tags, including `latest`, fail before Compose materializes a runtime.

## Intermediate Explanation

| Runtime item | Production | Staging |
| --- | --- | --- |
| Compose project | `nutsnews-app` | `nutsnews-staging` |
| Container | `nutsnews-app` | `nutsnews-app-staging` |
| Docker network | `nutsnews-edge` | `nutsnews-edge-staging` |
| Caddy access | Attached only to this network | Not attached; no route in #119 |
| App directory | `/opt/nutsnews/apps/nutsnews` | `/opt/nutsnews/apps/nutsnews-staging` |
| Env file | `/etc/nutsnews/nutsnews-app.env` | `/etc/nutsnews/nutsnews-staging-app.env` |
| Release manifest | `/opt/nutsnews/ops/apps/production/release.json` | `/opt/nutsnews/ops/apps/staging/release.json` |
| Apply marker | `/opt/nutsnews/ops/last-app-apply.json` | `/opt/nutsnews/ops/apps/staging/last-apply.json` |
| Last-known-good record | `/opt/nutsnews/ops/apps/production/last-known-good.json` | `/opt/nutsnews/ops/apps/staging/last-known-good.json` |
| Writable cache volume | `nutsnews-app-cache` | `nutsnews-app-staging-cache` |
| State in #119 | Existing protected production behavior | Disabled by policy |

The protected workflow continues to consume reviewed production release state
from the infra repository and production runtime secrets from
`NUTSNEWS_APP_ENVS_JSON`. It does not configure staging credentials, a staging
route, TLS, access boundaries, or a staging deploy trigger.

## Expert Explanation

Ansible allows exactly two environment keys: `production` and `staging`. The
default selected environment is production. Each selected environment gets its
own Compose file, root-only env file, release manifest, apply marker,
last-known-good record, project name, Docker network name and alias, and named
writable cache volume.

The per-environment Compose command passes `--project-name` explicitly. Its
`--remove-orphans` scope is therefore that project only; the task has no
`down`, `stop`, or remove command against another environment. Regression
coverage renders both Compose configurations, proves a staging-only Ansible
check does not target production application paths or containers, and verifies
that a staging-only input change leaves production runtime renders byte-for-byte
unchanged.

Caddy has a narrower trust boundary than the runtime model: it joins only
`nutsnews-edge`, the production network. Its app route templates read only the
production configuration. The staging network is not attached to Caddy, so a
staging service-name collision cannot become the production upstream.

On a successful enabled deployment, the environment release manifest becomes
that environment's last-known-good record. Release manifests and markers record
the environment, project, image/review metadata, container, network, cache
volume, and route state—never application secret values.

## Runtime Topology

```mermaid
flowchart LR
  caddy["Caddy\nproduction network only"] --> prodNet["nutsnews-edge"]
  prodNet --> prodApp["nutsnews-app\nproject: nutsnews-app"]

  stageNet["nutsnews-edge-staging\nnot attached to Caddy"] --> stageApp["nutsnews-app-staging\nproject: nutsnews-staging\ndisabled"]

  prodApp --> prodState["production env, manifest, marker,\nlast-known-good, cache volume"]
  stageApp --> stageState["staging env, manifest, marker,\nlast-known-good, cache volume"]

  budget["#118 fixed resource budget\nactivation still requires later work"] -. constrains .-> stageApp
```

## Operational Rules

1. Keep staging disabled. Do not add a staging deploy workflow, credentials,
   hostname, TLS, access boundary, data access, or Caddy route in this phase.
2. Never use a mutable image tag. Review the exact GHCR digest through normal
   GitOps review before the environment can materialize.
3. Use protected check mode before any approved production apply. Do not SSH to
   mutate runtime files or invoke Compose directly on the VPS.
4. Treat manifests and last-known-good records as deployment evidence, not as a
   substitute for the later qualification and promotion gates.

## Local Verification

From `ramideltoro/nutsnews-infra`:

```bash
python3 ansible/tests/validate_nutsnews_environment_isolation.py
cd ansible && ansible-playbook playbooks/bootstrap.yml --syntax-check
cd ansible && ansible-lint .
```

The isolation regression renders both Compose configurations, checks all
identity/path separation, rejects mutable inputs for both environment names,
and checks that staging-only rendering cannot change production artifacts.

## Current Blocker And Follow-Up Work

Issue #118 records a same-host go decision with enforceable application CPU,
memory, PID, and log ceilings. It does not make staging deployable: #119 and
the later data isolation, credentials/TLS/access control, deployment,
qualification, and promotion work must consume the fixed contract before an
approved staging apply.

The later staging data isolation, credentials/TLS/access control, deployment
workflow, qualification gate, and protected production promotion/rollback work
remain intentionally out of scope.

## Related Docs

- [NutsNews Protected Ansible Apply Workflow](NUTSNEWS_PROTECTED_ANSIBLE_APPLY.md)
- [NutsNews VPS Service Foundation](NUTSNEWS_VPS_SERVICE_FOUNDATION.md)
- [NutsNews VPS Same-Host Staging Capacity Budget](NUTSNEWS_VPS_STAGING_CAPACITY.md)
- [NutsNews Dual-Target Web Deployment](NUTSNEWS_DUAL_TARGET_WEB_DEPLOYMENT.md)
