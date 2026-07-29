#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MAX_AUTOMATION_ATTEMPTS } from './discover-nutsnews-merges.mjs';

function validateEvent(event) {
  if (
    !/^ramideltoro\/nutsnews(?:-[a-z0-9-]+)?$/.test(`${event.repository ?? ''}`)
    || event.repository === 'ramideltoro/nutsnews-docs'
  ) {
    throw new Error('event repository is invalid');
  }
  if (!/^[a-f0-9]{40}$/.test(`${event.head_sha ?? ''}`)) {
    throw new Error('event merge SHA is invalid');
  }
  if (
    !Array.isArray(event.pull_numbers)
    || event.pull_numbers.length === 0
    || event.pull_numbers.some((number) => !Number.isInteger(number) || number < 1)
  ) {
    throw new Error('event pull request list is invalid');
  }
}

export async function recordMergeFailure({
  statePath,
  eventPath,
  workflowRun,
  runUrl,
  failedAt = new Date().toISOString(),
}) {
  if (!/^\d+$/.test(`${workflowRun ?? ''}`)) {
    throw new Error('workflow run must be numeric');
  }
  const [state, event] = await Promise.all([
    fs.readFile(statePath, 'utf8').then(JSON.parse),
    fs.readFile(eventPath, 'utf8').then(JSON.parse),
  ]);
  validateEvent(event);
  if (state.version !== 1 || state.owner !== 'ramideltoro') {
    throw new Error('merge documentation state has an unsupported contract');
  }
  state.failures ||= {};
  const previous = state.failures[event.repository];
  const attempts = previous?.headSha === event.head_sha
    ? Number(previous.attempts || 0) + 1
    : 1;
  const failure = {
    headSha: event.head_sha,
    pullNumbers: event.pull_numbers,
    attempts,
    blocked: attempts >= MAX_AUTOMATION_ATTEMPTS,
    lastFailedAt: new Date(failedAt).toISOString(),
    workflowRun: `${workflowRun}`,
    runUrl: `${runUrl ?? ''}`,
  };
  state.failures[event.repository] = failure;
  await fs.writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  console.log(
    `Recorded failed attempt ${attempts}/${MAX_AUTOMATION_ATTEMPTS} for ${event.repository}.`,
  );
  return failure;
}

async function run() {
  const [stateArg, eventArg, workflowRun, runUrl] = process.argv.slice(2);
  if (!stateArg || !eventArg || !workflowRun || !runUrl) {
    throw new Error(
      'usage: record-nutsnews-merge-failure.mjs <state.json> <event.json> <workflow-run> <run-url>',
    );
  }
  await recordMergeFailure({
    statePath: path.resolve(stateArg),
    eventPath: path.resolve(eventArg),
    workflowRun,
    runUrl,
  });
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  run().catch((error) => {
    console.error(`record-nutsnews-merge-failure: ${error?.message || error}`);
    process.exitCode = 1;
  });
}
