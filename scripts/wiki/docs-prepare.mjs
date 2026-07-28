#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';

import { prepareWikiDraft } from './docs-prepare-core.mjs';

function usage() {
  return [
    'Usage: npm run docs:prepare -- <canonical-source.md> [--force]',
    '',
    'Creates an unreviewed Simple mirror, accessible primary diagram, and blocked review manifest.',
    'Existing artifacts are never overwritten unless --force is explicit.',
  ].join('\n');
}

function parseArguments(argv) {
  const positional = [];
  let force = false;
  for (const argument of argv) {
    if (argument === '--force') {
      force = true;
    } else if (argument === '--help' || argument === '-h') {
      return { help: true, force: false };
    } else if (argument.startsWith('-')) {
      throw new Error(`unknown option: ${argument}`);
    } else {
      positional.push(argument);
    }
  }
  if (positional.length !== 1) {
    throw new Error('exactly one canonical Technical Markdown source is required');
  }
  return { help: false, force, sourcePath: positional[0] };
}

export function safeErrorMessage(error, apiKey = process.env.OPENAI_API_KEY) {
  const raw = `${error?.message || error || 'docs:prepare failed'}`;
  const redacted = apiKey ? raw.replaceAll(apiKey, '[redacted]') : raw;
  return redacted.replace(/\bsk-[A-Za-z0-9_-]+\b/g, '[redacted]');
}

export async function runDocsPrepare(argv, env = process.env) {
  const options = parseArguments(argv);
  if (options.help) {
    console.log(usage());
    return null;
  }
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required in the process environment');
  }
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const result = await prepareWikiDraft({
    sourcePath: options.sourcePath,
    force: options.force,
    client,
  });
  console.log('Draft prepared: unreviewed; publishing blocked.');
  console.log(`Simple Markdown: ${result.paths.simple}`);
  console.log(`Primary diagram: ${result.paths.diagram}`);
  console.log(`Review manifest: ${result.paths.review}`);
  return result;
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  runDocsPrepare(process.argv.slice(2)).catch((error) => {
    console.error(`docs:prepare: ${safeErrorMessage(error)}`);
    process.exitCode = 1;
  });
}
