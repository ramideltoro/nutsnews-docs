# NutsNews Backend Security Baseline

This tracks backend host security desired state for `ramideltoro/nutsnews-backend` and `65.75.201.18`.

## SSH Hardening

Backend issue #1 adds repo-managed SSH hardening through the backend Ansible baseline role.

Desired effective SSH values:

```text
permitrootlogin no
passwordauthentication no
kbdinteractiveauthentication no
pubkeyauthentication yes
```

Implementation shape:

- Comment managed auth directives in `/etc/ssh/sshd_config` so main-file provider defaults cannot win.
- Install `/etc/ssh/sshd_config.d/00-nutsnews-hardening.conf`.
- Validate sshd config with `sshd -t` before reload.
- Apply only through the protected backend workflow.

Verification after approved apply:

```bash
sudo sshd -T | grep -E '^(permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication) '
ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no -o BatchMode=yes rami@65.75.201.18 true
ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no -o BatchMode=yes root@65.75.201.18 true
ssh -i ~/.ssh/servercheap_65_75_201_18 rami@65.75.201.18 'hostname && whoami'
```

## OS Package Maintenance And Reboot

Backend issue #2 adds repo-managed OS package maintenance through the backend Ansible baseline role.

Implementation shape:

- Refresh apt metadata.
- Apply available package upgrades with `upgrade: dist`.
- Remove unused packages and clean apt cache.
- Reboot during real apply mode when `/var/run/reboot-required` exists.
- Capture package, kernel, reboot-required, and failed-unit evidence in workflow logs.

Verification after approved apply:

```bash
ssh -i ~/.ssh/servercheap_65_75_201_18 rami@65.75.201.18 'uname -r'
ssh -i ~/.ssh/servercheap_65_75_201_18 rami@65.75.201.18 'test ! -e /var/run/reboot-required && echo no-reboot-required'
ssh -i ~/.ssh/servercheap_65_75_201_18 rami@65.75.201.18 'apt list --upgradable 2>/dev/null'
ssh -i ~/.ssh/servercheap_65_75_201_18 rami@65.75.201.18 'systemctl --failed --no-pager'
ssh -i ~/.ssh/servercheap_65_75_201_18 rami@65.75.201.18 'hostname && whoami'
```

## UFW Firewall Baseline

Backend issue #3 adds repo-managed UFW policy through the backend Ansible baseline role.

Current public port policy:

| Port | Protocol | Purpose |
| --- | --- | --- |
| `22` | TCP | SSH |

Implementation shape:

- Install UFW.
- Set `IPV6=yes` in `/etc/default/ufw`.
- Reset UFW rules during approved apply.
- Set default incoming policy to deny.
- Set default outgoing policy to allow.
- Allow only TCP `22` in the current phase.
- Keep `80/tcp` and `443/tcp` disabled until a reviewed reverse-proxy/routing PR enables them.
- Capture `ufw status verbose` in workflow logs.

Verification after approved apply:

```bash
sudo ufw status verbose
ssh -i ~/.ssh/servercheap_65_75_201_18 rami@65.75.201.18 'ss -tulpen 2>/dev/null || ss -tulpn'
ssh -i ~/.ssh/servercheap_65_75_201_18 rami@65.75.201.18 'hostname && whoami'
```

## SSH Brute-Force Protection

Backend issue #4 adds repo-managed fail2ban protection for SSH through the backend Ansible baseline role.

Implementation shape:

- Install `fail2ban`.
- Write `/etc/fail2ban/jail.d/nutsnews-sshd.local`.
- Enable the `sshd` jail with the systemd backend.
- Use `maxretry = 5`, `findtime = 10m`, and `bantime = 1h`.
- Ignore localhost addresses.
- Enable and start the fail2ban service.
- Capture `fail2ban-client status sshd` in workflow logs.

Verification after approved apply:

```bash
sudo fail2ban-client status sshd
ssh -i ~/.ssh/servercheap_65_75_201_18 rami@65.75.201.18 'hostname && whoami'
sudo fail2ban-client set sshd unbanip <ip-address>
```

Controlled ban testing should use a disposable test source IP and immediately unban that IP afterward.

## Abuse Protection Decision

Backend issue #24 records the broader abuse-protection decision for the current
SSH-only backend phase. Backend issue #40 adds detection/report-only
maintenance automation for abuse signals.

Decision:

- Keep fail2ban as the selected tool for SSH protection.
- Surface SSH authentication failure spikes and fail2ban SSH ban events through
  Grafana/Loki detection alerts.
- Defer CrowdSec, Cloudflare blocking rules, and HTTP/Caddy enforcement until
  backend app routes, app/admin probes, and real route logs exist.
- Start any future HTTP abuse controls in detection/report-only mode before blocking.
- Do not run a protected apply, restart, firewall mutation, or production enforcement change without separate explicit approval.

Detection alert UIDs:

- `nn-backend-ssh-auth-spike`
- `nn-backend-fail2ban-ban-events`

These alerts use low-cardinality Loki queries scoped to
`host="backend.nutsnews.com"` and `service="security"`. They do not group or
route on IP address, path, user, request ID, or raw message text.

Current allowlist policy:

- SSH jail allowlist is localhost-only: `127.0.0.1/8` and `::1`.
- Cloudflare edge ranges, GitHub Actions callbacks, uptime probes, and operator ranges must be documented before any future HTTP enforcement.
- Operator IPs must not be committed unless there is a reviewed operational reason.

False-positive-sensitive probes required before future HTTP blocking:

- `/health`
- `/healthz`
- `/readyz`
- auth provider redirects/callbacks
- admin redirects and dashboard access boundaries

Backend validation:

```bash
python3 scripts/validate_abuse_protection_decision.py
python3 scripts/provision_grafana_metrics.py --check
```

## Swap Safety Buffer

Backend issue #5 adds a small persistent swapfile through the backend Ansible baseline role.

Decision:

- Use a 2 GiB disk swapfile at `/swapfile`.
- Use `vm.swappiness = 10`.
- Prefer swapfile over zram for now because it is simple to inspect, persist, disable, and recover on this fresh host with ample disk.

Implementation shape:

- Create `/swapfile`.
- Set root ownership and `0600` permissions.
- Format with `mkswap` when newly created.
- Add `/swapfile none swap sw 0 0` to `/etc/fstab`.
- Enable swap during real apply mode.
- Write `/etc/sysctl.d/99-nutsnews-backend-swap.conf`.
- Capture `swapon --show` and `free -h` in workflow logs.

Verification after approved apply:

```bash
ssh -i ~/.ssh/servercheap_65_75_201_18 rami@65.75.201.18 'swapon --show'
ssh -i ~/.ssh/servercheap_65_75_201_18 rami@65.75.201.18 'free -h'
ssh -i ~/.ssh/servercheap_65_75_201_18 rami@65.75.201.18 'grep -E "^/swapfile\\s+none\\s+swap\\s+" /etc/fstab'
ssh -i ~/.ssh/servercheap_65_75_201_18 rami@65.75.201.18 'cat /proc/sys/vm/swappiness'
```

## Current Blocker

SSH hardening, OS package maintenance, UFW firewall baseline, fail2ban SSH protection, and swap baseline cannot be considered complete until the `production-backend` Environment and required secrets exist, the protected workflow applies the role, and read-only audits confirm the effective server state.
