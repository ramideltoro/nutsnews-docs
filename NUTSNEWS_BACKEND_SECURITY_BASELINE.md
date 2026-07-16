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

## Current Blocker

SSH hardening, OS package maintenance, and UFW firewall baseline cannot be considered complete until the `production-backend` Environment and required secrets exist, the protected workflow applies the role, and read-only audits confirm the effective server state.
