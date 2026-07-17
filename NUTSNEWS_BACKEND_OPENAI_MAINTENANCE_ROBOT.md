# NutsNews Backend OpenAI Maintenance Robot

This page documents the daily maintenance robot owned by
`ramideltoro/nutsnews-backend`.

## Summary

The robot scans NutsNews repositories and backend host evidence, redacts the
evidence, asks OpenAI to convert it into structured issue candidates, and then
creates one GitHub issue per finding.

The backend workflow is:

```text
.github/workflows/backend-openai-maintenance.yml
```

The backend runner is:

```text
scripts/openai_maintenance_robot.py
```

## Repositories Scanned

- `ramideltoro/nutsnews`
- `ramideltoro/nutsnews-backend`
- `ramideltoro/nutsnews-infra`
- `ramideltoro/nutsnews-docs`

Routing rules:

| Finding type | Target repo |
| --- | --- |
| App, frontend, public API, Supabase-facing app work | `ramideltoro/nutsnews` |
| Backend server/platform work | `ramideltoro/nutsnews-backend` |
| GitOps, Ansible, VPS implementation | `ramideltoro/nutsnews-infra` |
| Docs, runbooks, process | `ramideltoro/nutsnews-docs` |

## Modes

| Mode | Behavior |
| --- | --- |
| `dry-run` | Plans issues and uploads an artifact without creating issues. |
| `test` | Creates issues in `ramideltoro/nutsnews-backend` with `maintenance-robot-test`. |
| `create` | Creates issues in the routed production target repos. |

Scheduled runs use `create`. Manual runs default to `dry-run`.

Every run creates or plans a label in this shape:

```text
scan+YYYY-MM-DDTHH-MM-SSZ
```

Every issue created from one run gets the same `scan+...` label.

## OpenAI Configuration

Implementation guidance was checked on 2026-07-17. OpenAI guidance pointed to
the Responses API and the GPT-5.6 model family. The workflow defaults to:

- `OPENAI_MODEL=gpt-5.6`
- `OPENAI_REASONING_EFFORT=low`

Those are repository variables so they can be updated without code changes.

Required backend secrets:

- `OPENAI_API_KEY`
- `NUTSNEWS_MAINTENANCE_GITHUB_TOKEN`
- `NUTSNEWS_BACKEND_SSH_PRIVATE_KEY`
- `NUTSNEWS_BACKEND_KNOWN_HOSTS`

Optional backend secrets:

- `OPENAI_ORG_ID`
- `OPENAI_PROJECT`
- `NUTSNEWS_BACKEND_ANSIBLE_USER`

## Issue Contract

Generated issue bodies include:

- `Scan run label`
- `Finding fingerprint`
- `Detected repo`
- `Suggested target repo`
- `Category`
- `Severity`
- `Confidence`
- `Possible noise or false-positive reason`
- `Evidence`
- `Why this matters`
- `Suggested fix or investigation path`
- `Acceptance criteria`
- `Validation ideas`
- `Related files/log queries/checks`
- `Secret-redaction status`

Low-confidence and duplicate-looking findings are still filed. The body records
uncertainty and possible duplicate context.

## Safety

The robot does not mutate servers, auto-fix code, merge PRs, close issues, run
arbitrary SSH commands, or persist secrets. Server evidence is collected through
fixed read-only checks.

## Artifacts

Each workflow run uploads `backend-openai-maintenance-report`. The JSON includes
redacted evidence, OpenAI status, normalized findings, and issue-creation
results. If OpenAI or GitHub issue creation fails, the robot records that in the
artifact and attempts to create a backend follow-up issue when possible.
