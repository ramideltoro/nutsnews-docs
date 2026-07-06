# NutsNews VPS Service Foundation

This explains the next layer in the NutsNews VPS platform: Docker Engine, Docker Compose, the `/opt/nutsnews` runtime layout, and a local-only Caddy placeholder. It is not the shiny app deploy yet. It is the floor, outlets, labels, and "does this thing actually turn on?" light switch.

## Easy Summary

The VPS now gets a small container foundation managed by Ansible. The playbook installs Docker Engine and Docker Compose from Ubuntu packages, creates the standard `/opt/nutsnews` directory layout, and starts a tiny Caddy service through Compose.

Caddy is not public yet. It listens only on `127.0.0.1:8080`, serves a static placeholder page, answers `/healthz` with `ok`, and can proxy `/health` to the local infrastructure health service. That lets us verify the service layer before adding real apps, public routing, TLS automation, and the other useful things that become less useful when introduced all at once during a caffeine incident.

## Intermediate Summary

The infra repo adds a new Ansible role:

```text
ansible/roles/vps_service_foundation
```

That role runs after the existing VPS baseline role. It manages:

- Docker Engine from Ubuntu packages
- Docker Compose v2 from Ubuntu packages
- Docker daemon log limits for cheap-VPS disk sanity
- a non-login Caddy runtime user
- `/opt/nutsnews/apps`
- `/opt/nutsnews/config`
- `/opt/nutsnews/data`
- `/opt/nutsnews/logs`
- `/opt/nutsnews/backups`
- `/opt/nutsnews/portal-assets`
- `/opt/nutsnews/health`
- a Compose-managed Caddy placeholder service
- the first read-only operations portal surface and local status collector
- a Better Stack-compatible `/health` endpoint for infrastructure health

The protected Ansible workflow still defaults to check mode. In real apply mode, the service role can start Caddy and verify `http://127.0.0.1:8080/healthz`. In check mode, it skips Docker Compose mutation because pretending to start containers without Docker being installed yet is how automation starts gaslighting everyone.

Fresh-host check mode has one classic trick: it says "sure, Docker would be installed" without actually creating the `docker` service, `docker` group, Caddy user, or `/opt/nutsnews` directories. Very impressive. Very resume-coded. The service foundation role now treats Docker package installation as the check-mode preview and skips runtime-dependent Docker/Caddy tasks until apply mode creates the real host state.

The first real Caddy apply found the next layer of "computers are technically correct, which is the most annoying kind of correct." Compose reported that it started the container, but `/healthz` refused connections. The fix makes the Caddy container more explicit about its runtime: Caddy binds inside the container on `0.0.0.0`, gets writable `/config`, `/data`, `/run`, and `/tmp` locations while keeping the root filesystem read-only, and the Ansible role now prints `docker compose ps` plus Caddy logs if health still fails.

Then the container taught us that hardening can go full gym-bro and become unusable. The official Caddy image carries a file capability on `/usr/bin/caddy`; combining that with `cap_drop: ALL`, `no-new-privileges`, and a non-root UID made Docker refuse to exec the binary at all. The fix keeps the container non-root, read-only, and localhost-only, but grants only `NET_BIND_SERVICE` and removes the specific `no-new-privileges` flag that blocked startup.

## Expert Summary

This layer creates the runtime substrate without exposing a production route. The design is intentionally conservative:

- Caddy binds to host loopback only: `127.0.0.1:8080`.
- Caddy admin API is disabled.
- Caddy automatic HTTPS is disabled until public domain routing is intentionally added.
- The container runs as a dedicated numeric non-root user.
- The container uses `read_only`, dropped capabilities plus only `NET_BIND_SERVICE`, memory limits, PID limits, and small tmpfs mounts.
- Docker JSON log files are capped to avoid slow disk doom.
- No secrets, environment files, app credentials, or production tokens are introduced.
- Compose validation runs in CI before the PR can merge.
- Ansible syntax and lint checks cover the role wiring before apply.

The point is to establish a stable convention now so future services have somewhere predictable to live. The platform should grow in layers, not in one heroic blob of YAML that future operators study like a cursed family recipe.

## Service Foundation Flow

```mermaid
flowchart TD
  pr["Infra PR adds service foundation"] --> ci["CI validates Ansible and Compose"]
  ci --> merge{"Merged?"}
  merge -- "No" --> stop["No VPS change"]
  merge -- "Yes" --> check["Protected Ansible workflow: check mode"]
  check --> review{"Diff looks safe?"}
  review -- "No" --> fix["Fix repo and open PR"]
  fix --> ci
  review -- "Yes" --> apply["Protected Ansible workflow: apply mode"]
  apply --> docker["Install Docker Engine and Compose"]
  docker --> layout["Create /opt/nutsnews layout"]
  layout --> caddy["Start local-only Caddy placeholder"]
  caddy --> health["Verify /healthz returns ok"]
```

## Runtime Layout

```mermaid
flowchart LR
  root["/opt/nutsnews"] --> apps["apps\nCompose projects"]
  root --> config["config\nCaddy and future service config"]
  root --> data["data\ncontainer state"]
  root --> logs["logs\nservice logs and exports"]
  root --> backups["backups\nencrypted backup staging"]
  root --> portal["portal-assets\nOps Portal assets and status JSON"]
  root --> health["health\nstatic placeholder"]
  apps --> caddy["caddy/compose.yml"]
  config --> caddyfile["caddy/Caddyfile"]
```

This layout is boring on purpose. "Where does this service put its files?" should not require a séance with shell history.

## Caddy Exposure Model

```mermaid
flowchart LR
  public["Public internet"] -. "not yet" .-> caddy["Caddy container"]
  maintainer["Maintainer over SSH"] --> loopback["127.0.0.1:8080"]
  loopback --> caddy
  caddy --> health["/healthz -> ok"]
  caddy --> infraHealth["/health -> infra health service"]
  caddy --> portal["Read-only Ops Portal"]
```

Public HTTP and HTTPS routing are future work. The baseline firewall may allow ports `80` and `443`, but this Caddy service does not bind them yet. That means the container layer can be tested without accidentally publishing a half-built front door.

## Better Stack Infrastructure Health

The service foundation includes a small Python stdlib service named `nutsnews-infra-health.service`. Caddy routes `/health` to that local service. The endpoint is designed for Better Stack HTTP status-code monitoring and returns minimal public JSON only:

```json
{"ok":true,"service":"nutsnews-infra"}
```

It returns HTTP `200` only when required checks pass. It returns HTTP `503` when any required check fails. Failure responses stay safe for public monitoring and only include generic failed check groups.

Default required checks:

- CPU usage below `60%`
- memory usage below `60%`
- disk usage below `60%` for `/` and `/opt/nutsnews`
- active systemd units: `ssh.service`, `docker.service`, `unattended-upgrades.service`, `ufw.service`, `fail2ban.service`, `nutsnews-infra-health.service`, `nutsnews-ops-portal-collector.timer`, `nutsnews-ops-alert-check.timer`, and `nutsnews-ops-health-report.timer`
- running and healthy Docker containers: `nutsnews-caddy`, plus `nutsnews-app` when the app layer is enabled

Failure details are intentionally logged server-side instead of returned publicly. Check:

```bash
sudo journalctl -u nutsnews-infra-health.service -n 80 --no-pager
sudo tail -n 40 /opt/nutsnews/logs/health/health-failures.jsonl
```

Each failure log entry includes timestamp, failed check, measured value, threshold, relevant service/container/path, and a short reason. The health service does not log secrets, environment values, tokens, database URLs, or stack traces.

Better Stack monitor settings after public routing is approved and applied:

```text
Monitor type: HTTP status code
URL: https://vps.nutsnews.com/health
Expected status: 2xx
Check frequency: 1 minute
Alert after: 2-3 failed checks
Suggested monitor name: NutsNews Infra Health
Recommended regions: US East, US West, EU West
```

## Validation

Before merge, CI checks:

- Ansible syntax for `playbooks/bootstrap.yml`
- Ansible lint for the roles
- explicit service foundation role wiring
- required Compose service files
- `docker compose config` for the Caddy bundle
- broader workflow, secret, supply-chain, runtime, and config scanners

After apply, verify from the VPS:

```bash
sudo docker compose -f /opt/nutsnews/apps/caddy/compose.yml ps
curl -fsS http://127.0.0.1:8080/healthz
curl -i http://127.0.0.1:8080/health
curl -fsS http://127.0.0.1:8080/
systemctl status nutsnews-infra-health.service
```

Expected health output:

```text
ok
```

After the portal layer is applied, also verify:

```bash
curl -fsS http://127.0.0.1:8080/data/status.json
systemctl status nutsnews-ops-portal-collector.timer
```

## What Can Go Wrong

| Failure | Likely cause | Recovery |
| --- | --- | --- |
| Check mode says Docker would install, then runtime tasks cannot find Docker | Check mode simulated the package install but did not create the service | Runtime-dependent service tasks are skipped in check mode; rerun apply only after reviewing the preview |
| Docker package install fails | Ubuntu package mirror issue or package name change | Rerun check mode later, then update package vars through PR if needed |
| Compose config fails | Invalid YAML, bad bind mount, or unsupported Compose option | Fix `compose/caddy/compose.yml` and let CI prove it |
| Caddy logs `exec /usr/bin/caddy: operation not permitted` | Over-hardening blocked the official image file capability | Keep `NET_BIND_SERVICE`, remove `no-new-privileges`, and rerun through PR |
| Caddy container exits | Bad Caddyfile, missing mount, wrong file permissions, or read-only runtime paths | The role prints Compose status and Caddy logs; fix repo files, rerun check mode, then apply |
| `/healthz` fails | Caddy not started, not listening inside the container, or unable to write runtime state | Check the printed Compose status/logs, verify `0.0.0.0:8080` and runtime mounts, then rerun after a PR fix |
| Disk grows too fast | Container logs or future service data are noisy | Docker log caps are already set; add service-specific retention before adding heavier workloads |
| Someone wants to expose 80/443 immediately | Understandable impatience | Make a follow-up PR with routing, TLS, health checks, and rollback notes instead of freelancing in production |

## What This Does Not Do

This layer does not:

- deploy the NutsNews web app
- expose public Caddy routing
- configure TLS certificates
- install production app secrets
- add databases or queues
- add a self-hosted observability stack
- require the home server
- mutate the VPS from pull request validation

It gives future services a safe landing zone. That is less glamorous than launching everything at once, but it is also less likely to make Friday evening weird.

## Related Docs

- [NutsNews Protected Ansible Apply Workflow](NUTSNEWS_PROTECTED_ANSIBLE_APPLY.md)
- [NutsNews Operations Portal v1](NUTSNEWS_OPERATIONS_PORTAL_V1.md)
- [NutsNews VPS Ansible Bootstrap](NUTSNEWS_VPS_ANSIBLE_BOOTSTRAP.md)
- [NutsNews Infra Operations Platform](NUTSNEWS_INFRA_OPERATIONS_PLATFORM.md)
- [Operations](OPERATIONS.md)
- [Troubleshooting](TROUBLESHOOTING.md)
