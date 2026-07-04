# AGENTS.md

## Project

This is the canonical NutsNews documentation repository.

- Repository: https://github.com/ramideltoro/nutsnews-docs
- Primary branch: main
- Owns product, operations, deployment, cache, automation, environment, architecture, runbook, and cross-repo documentation for NutsNews.

## Working Rules

- MUST read this AGENTS.md before editing.
- MUST run `git status --short` before editing.
- MUST preserve user changes.
- MUST keep documentation-only changes in this repository.
- MUST NOT edit application, Worker, iOS, CI, infrastructure, or runtime files from this repository.
- MUST inspect the existing docs structure and place updates in the most appropriate existing location.
- MUST keep documentation updates specific and actionable.

## Documentation-Only Workflow

- Documentation-only changes in this repository MUST be committed and pushed directly to `main`.
- Documentation-only changes in this repository MUST NOT use a pull request.
- Before a docs-only direct push, MUST checkout `main`, pull latest `origin/main` when network access and permissions allow, make the documentation change, run lightweight validation, commit, and push directly to `main`.
- If direct push to `main` is blocked by branch protection, STOP and report the blocker. MUST NOT silently create a PR.
- Final responses for docs-only changes MUST include the pushed commit SHA.

## Pull Request Workflow

- Any non-documentation change in any NutsNews repository MUST go through a pull request unless Rami explicitly says otherwise.
- Any change to `ramideltoro/nutsnews`, `ramideltoro/nutsnews-worker`, or `ramideltoro/nutsnews-ios` MUST go through a pull request unless Rami explicitly says otherwise.
- Pull requests MUST be normal ready-to-merge PRs, not draft PRs.
- If using `gh pr create`, MUST NOT pass `--draft`.
- If using a GitHub connector/API, MUST set `draft: false`.
- If a PR is accidentally created as draft, MUST mark it ready before reporting completion.
- MUST NOT merge PRs unless Rami explicitly says to merge.

## Validation

- For docs-only changes, MUST run lightweight validation that already exists.
- If no docs validation tooling exists, MUST run `git diff --check` and review the diff for internal consistency.
- MUST report exact validation commands and pass/fail results in the final response.
