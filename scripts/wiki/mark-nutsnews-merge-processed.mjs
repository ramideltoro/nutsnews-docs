#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';

function compareCursor(event, cursor) {
  const time = `${event.merged_at || ''}`.localeCompare(`${cursor?.lastMergedAt || ''}`);
  if (time !== 0) return time;
  return Number(event.pull_numbers.at(-1)) - Number(cursor?.lastPullNumber || 0);
}

async function run() {
  const [stateArg, eventArg] = process.argv.slice(2);
  if (!stateArg || !eventArg) {
    throw new Error('usage: mark-nutsnews-merge-processed.mjs <state.json> <event.json>');
  }
  const statePath = path.resolve(stateArg);
  const eventPath = path.resolve(eventArg);
  const [state, event] = await Promise.all([
    fs.readFile(statePath, 'utf8').then(JSON.parse),
    fs.readFile(eventPath, 'utf8').then(JSON.parse),
  ]);
  const cursor = state.repositories?.[event.repository];
  if (!cursor) throw new Error(`state does not include ${event.repository}`);
  if (compareCursor(event, cursor) <= 0) {
    console.log(`${event.repository} was already marked through PR #${event.pull_numbers.at(-1)}.`);
    return;
  }
  state.repositories[event.repository] = {
    lastMergedAt: event.merged_at,
    lastPullNumber: event.pull_numbers.at(-1),
    lastMergeCommit: event.head_sha,
  };
  if (state.failures && typeof state.failures === 'object') {
    delete state.failures[event.repository];
  }
  await fs.writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  console.log(`Marked ${event.repository} through PR #${event.pull_numbers.at(-1)}.`);
}

if (import.meta.url === `file://${path.resolve(process.argv[1] || '')}`) {
  run().catch((error) => {
    console.error(`mark-nutsnews-merge-processed: ${error?.message || error}`);
    process.exitCode = 1;
  });
}
