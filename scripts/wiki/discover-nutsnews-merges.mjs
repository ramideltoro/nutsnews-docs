#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const OWNER = 'ramideltoro';
const DOCS_REPOSITORY = `${OWNER}/nutsnews-docs`;
const REPOSITORY_PATTERN = /^nutsnews(?:-[a-z0-9-]+)?$/;
export const MAX_AUTOMATION_ATTEMPTS = 3;

async function ghJson(endpoint, { paginate = false } = {}) {
  const args = ['api'];
  if (paginate) args.push('--paginate', '--slurp');
  args.push(endpoint);
  const { stdout } = await execFileAsync('gh', args, { maxBuffer: 50 * 1024 * 1024 });
  const parsed = JSON.parse(stdout);
  return paginate ? parsed.flat() : parsed;
}

function compareCursor(pull, cursor) {
  if (!cursor) return 1;
  const time = `${pull.merged_at || ''}`.localeCompare(`${cursor.lastMergedAt || ''}`);
  if (time !== 0) return time;
  return Number(pull.number) - Number(cursor.lastPullNumber || 0);
}

function comparePulls(left, right) {
  const time = `${left.merged_at || ''}`.localeCompare(`${right.merged_at || ''}`);
  if (time !== 0) return time;
  return Number(left.number) - Number(right.number);
}

function latestMergedPull(pulls) {
  return pulls
    .filter((pull) => pull.merged_at && pull.merge_commit_sha)
    .sort(comparePulls)
    .at(-1) || null;
}

function cursorFromPull(pull, initializedAt = new Date().toISOString()) {
  if (!pull) {
    return {
      lastMergedAt: initializedAt,
      lastPullNumber: 0,
      lastMergeCommit: null,
    };
  }
  return {
    lastMergedAt: pull.merged_at,
    lastPullNumber: pull.number,
    lastMergeCommit: pull.merge_commit_sha,
  };
}

export function buildMergeEvent(repository, cursor, pulls) {
  const pending = pulls
    .filter((pull) => pull.merged_at && pull.merge_commit_sha && compareCursor(pull, cursor) > 0)
    .sort(comparePulls);
  if (pending.length === 0) return null;
  const latest = pending.at(-1);
  return {
    repository: repository.full_name,
    default_branch: repository.default_branch,
    previous_merge_commit: cursor.lastMergeCommit,
    head_sha: latest.merge_commit_sha,
    merged_at: latest.merged_at,
    pull_numbers: pending.map((pull) => pull.number),
    pulls: pending.map((pull) => ({
      number: pull.number,
      merged_at: pull.merged_at,
      merge_commit_sha: pull.merge_commit_sha,
      html_url: pull.html_url,
    })),
  };
}

export function retryIsBlocked(event, failure) {
  return Boolean(
    event
    && failure
    && failure.headSha === event.head_sha
    && Number(failure.attempts) >= MAX_AUTOMATION_ATTEMPTS,
  );
}

function parseArguments(argv) {
  const options = {
    state: 'automation/merge-docs-state.json',
    eventsOutput: null,
    githubOutput: process.env.GITHUB_OUTPUT || null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const key = {
      '--state': 'state',
      '--events-output': 'eventsOutput',
      '--github-output': 'githubOutput',
    }[argument];
    if (!key) throw new Error(`unknown option: ${argument}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value`);
    options[key] = value;
    index += 1;
  }
  return options;
}

async function readState(target) {
  const raw = await fs.readFile(target, 'utf8').catch(() => null);
  if (!raw) {
    return {
      version: 1,
      owner: OWNER,
      repositories: {},
      failures: {},
    };
  }
  const state = JSON.parse(raw);
  if (state.version !== 1 || state.owner !== OWNER || typeof state.repositories !== 'object') {
    throw new Error('merge documentation state has an unsupported contract');
  }
  if (!state.failures || typeof state.failures !== 'object') state.failures = {};
  return state;
}

async function writeGithubOutput(target, values) {
  if (!target) return;
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`);
  await fs.appendFile(target, `${lines.join('\n')}\n`, 'utf8');
}

export async function discoverNutsNewsMerges(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const stateTarget = path.resolve(options.state);
  const state = await readState(stateTarget);
  const repositories = (await ghJson(`/users/${OWNER}/repos?type=owner&sort=full_name&per_page=100`, {
    paginate: true,
  }))
    .filter((repo) => (
      !repo.archived
      && !repo.disabled
      && repo.owner?.login === OWNER
      && REPOSITORY_PATTERN.test(repo.name)
      && repo.full_name !== DOCS_REPOSITORY
    ))
    .sort((left, right) => left.full_name.localeCompare(right.full_name));

  const events = [];
  let stateChanged = false;
  for (const repository of repositories) {
    const pulls = await ghJson(
      `/repos/${repository.full_name}/pulls?state=closed&base=${encodeURIComponent(repository.default_branch)}&sort=updated&direction=desc&per_page=100`,
      { paginate: true },
    );
    const cursor = state.repositories[repository.full_name];
    if (!cursor) {
      state.repositories[repository.full_name] = cursorFromPull(latestMergedPull(pulls));
      stateChanged = true;
      continue;
    }
    const event = buildMergeEvent(repository, cursor, pulls);
    if (retryIsBlocked(event, state.failures[repository.full_name])) {
      console.warn(
        `${repository.full_name} is paused after ${MAX_AUTOMATION_ATTEMPTS} failed attempts for ${event.head_sha}; a newer merge will resume automation.`,
      );
    } else if (event) {
      events.push(event);
    }
  }

  await fs.mkdir(path.dirname(stateTarget), { recursive: true });
  if (stateChanged) {
    await fs.writeFile(stateTarget, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  }
  if (options.eventsOutput) {
    await fs.writeFile(path.resolve(options.eventsOutput), `${JSON.stringify(events, null, 2)}\n`, 'utf8');
  }
  const encodedEvents = events.map((event) => Buffer.from(JSON.stringify(event)).toString('base64'));
  await writeGithubOutput(options.githubOutput, {
    event_count: events.length,
    events: JSON.stringify(encodedEvents),
    state_changed: stateChanged ? 'true' : 'false',
  });
  console.log(
    `Merge discovery checked ${repositories.length} source repositories and found ${events.length} pending repository update(s).`,
  );
  return { repositories, events, state, stateChanged };
}

if (import.meta.url === `file://${path.resolve(process.argv[1] || '')}`) {
  discoverNutsNewsMerges().catch((error) => {
    console.error(`discover-nutsnews-merges: ${error?.message || error}`);
    process.exitCode = 1;
  });
}
