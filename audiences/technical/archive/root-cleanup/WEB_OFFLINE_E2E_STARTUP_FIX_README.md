---
title: NutsNews Web Offline E2E Startup Fix
wiki:
  source_route: /technical/archive/root-cleanup/web-offline-e2e-startup-fix-readme/
  simple_route: /simple/archive/root-cleanup/web-offline-e2e-startup-fix-readme/
  primary_diagram:
    file: diagrams/archive/root-cleanup/WEB_OFFLINE_E2E_STARTUP_FIX_README.md
    accTitle: "NutsNews Web Offline E2E Startup Fix diagram"
    accDescr: "Document flow and operational checkpoints for this topic."
  status: active
  collection: start-here
  section: overview
  approval:
    state: approved
    publishing: allowed
    reviewed_by: "ramideltoro"
    reviewed_on: "2026-07-28T20:10:06.000Z"
    technical_source_hash: 430a39729180f154352f29e426350e372e000abfaacfb0b60e6e29bb16545eca
---

# NutsNews Web Offline E2E Startup Fix

This fixes `Error: spawn npm ENOENT` in `scripts/web_offline_e2e_regression.mjs`.

Cause: the test script started Next.js with `cwd: "web"`. When the script is launched from `web/package.json`, the current directory is already `web/`, so the child process attempted to start from `web/web`. The new version resolves the web app directory from the script location and uses that absolute path.

It also adds a child-process `error` handler so startup failures fail fast with a clear message instead of crashing with an unhandled event.
