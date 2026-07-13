# NutsNews VPS Same-Host Staging Capacity Budget

The production VPS can host a tightly bounded staging application, but this
does not authorize a staging deployment. Staging remains disabled until the
later data-isolation, credential, route, deployment, and qualification work is
reviewed and applied.

## Decision

**Go for same-host staging with the fixed budget below.** The decision is based
on a read-only SSH audit at `2026-07-13T15:24:06Z`, not on inventory values
alone. The host had four vCPUs, 9.36 GB available memory, no zram use, 74.2 GB
free root disk, and 9.66 million free inodes. No OOM event was found in the
preceding seven days.

This decision is deliberately conservative because the host retains only short
current samples and swap history; it does not retain CPU or memory peak series.
Do not treat the current low use as a measured peak.

## Fixed Capacity Contract

| Resource | Observed production/platform use | Production safety reserve | Staging budget | Remaining after staging budget |
| --- | --- | --- | --- | --- |
| CPU | 0.20 one-minute load; 1.7% host sample; app 0.01%, Caddy 4.01%, Ops auth 0.02% | 3 vCPUs | 1 vCPU maximum; CPU shares 256 | At least 3 vCPUs remain outside the staging cap |
| Memory | 1.06 GB host used / 9.36 GB available; app 161 MiB, Caddy 14 MiB, Ops auth 16 MiB; Alloy process RSS 402 MiB | 4 GiB | 512 MiB limit; 256 MiB reservation | 5.2 GiB after reserve and staging ceiling, before normal reclaimable cache |
| PIDs | app 12 / 256, Caddy 9 / 128, Ops auth 1 / 128 | Production app stays at 256 | 128 maximum | Separate staging process cap; production allowance unchanged |
| Root disk | 7.88 GB used / 74.2 GB free; Docker images 3.57 GB, build cache 1.98 GB, volumes 0 B | 20 GiB free | 1 GiB image/cache preflight budget plus 30 MiB logs | At least 53 GiB after reserve and preflight budget |
| Inodes | 251,014 used / 9,658,746 free | 1,000,000 free | No portable per-volume inode quota; check before deploy | More than 8.6 million outside reserve at audit time |
| Swap/zram | 0 B / 1.5 GiB | zram is transient-spike protection, not planned capacity | Do not plan to consume it | 1.5 GiB unused at audit time |

The Docker Engine runs Compose on cgroup v2. `cpus`, `mem_limit`,
`mem_reservation`, `pids_limit`, and per-service `json-file` log options are
enforced by Docker. `cpu_shares` is a lower scheduling weight, not an absolute
CPU reservation; the one-vCPU staging cap preserves the three-vCPU reserve by
construction.

## Required Staging Safeguards

The reviewed infrastructure configuration fixes the staging service at:

- 1 vCPU maximum and CPU shares 256.
- 512 MiB memory maximum and 256 MiB memory reservation.
- 128 PIDs.
- `json-file` logs at 10 MiB per file with three retained files: 30 MiB maximum
  per staging container.
- Two qualification workers, at most five requests per second, 300 requests
  total, and five minutes maximum duration.
- A 24-hour qualification TTL. The later staging deployment workflow must
  scale the staging service down and remove its cache volume at expiry.

Never run destructive load tests, chaos tests, full ZAP scans, unbounded
crawlers, or other unbounded traffic against this shared host.

## Disk and Write Limitation

Docker's local volume driver on this ext4/overlayfs host does not offer a
portable hard per-volume quota. Do not claim that the 1 GiB image/cache budget
is a cgroup-enforced quota. The enforceable write guard is the service's 30 MiB
log cap; the deploy workflow must additionally preflight Docker/root disk and
inode headroom, and expiry cleanup must remove the staging cache volume.

No on-host image builds are allowed for staging. Pull only the reviewed digest.
At the audit, Docker held eleven reclaimable prior app images (1.63 GB) and
1.85 GB of reclaimable build cache; those remain an operational cleanup item,
not capacity assigned to staging.

## Source Configuration Versus Runtime

The source configuration defaults Grafana Alloy to disabled. The audited host
had `alloy.service` active, with systemd memory current about 127 MiB and
process RSS about 402 MiB. This is a source/runtime divergence, not evidence
of a manual change. Count the larger observed value in capacity planning and
reconcile the service only through a later protected apply.

Production containers were healthy and had no restarts. The app used 161 MiB
of its existing 768 MiB cap; Caddy and Ops auth used 14 MiB and 16 MiB of their
128 MiB caps. Backups were configured, successful, and fresh; their units have
CPU/IO weight 50 but no memory ceiling, so the 4 GiB reserve includes backup
burst room.

## Apply and Verify Later

Do not enable staging or run a protected apply merely because this document or
a CI check is green. After the relevant staging deployment PR is approved and
applied, use read-only SSH during one bounded qualification run:

```bash
uptime; free -h; swapon --show; df -h; df -i
sudo docker stats --no-stream
sudo docker inspect nutsnews-app nutsnews-app-staging
sudo docker system df
sudo journalctl -k --since '15 minutes ago' --no-pager
sudo journalctl -u docker.service --since '15 minutes ago' --no-pager
```

Verify production remains healthy, production memory and PID use stay below
their current limits, root disk/inodes remain above reserve, staging stays at
its hard limits, and there are no new OOM, ENOSPC, Docker, or application error
signals attributable to the qualification run. Inspect Caddy request logs only
for the bounded test window and confirm the traffic stays within the test
budget.

## Related Docs

- [VPS Runtime Environment Isolation](NUTSNEWS_VPS_RUNTIME_ENVIRONMENT_ISOLATION.md)
- [VPS Service Foundation](NUTSNEWS_VPS_SERVICE_FOUNDATION.md)
- [Protected Ansible Apply](NUTSNEWS_PROTECTED_ANSIBLE_APPLY.md)
