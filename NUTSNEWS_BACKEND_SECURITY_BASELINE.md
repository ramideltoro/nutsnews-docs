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

## Current Blocker

SSH hardening cannot be considered complete until the `production-backend` Environment and required secrets exist, the protected workflow applies the role, and a privileged read-only audit confirms the effective server state.
