#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createWikiScaffold } from './docs-new-core.mjs';

function usage() {
  return [
    'Usage: npm run docs:new -- <canonical-source.md> --collection <collection> --section <section>',
    '       [--title <title>] [--order <non-negative integer>]',
    '',
    'Creates a blocked expert, Simple, Technical-mirror, Mermaid, and review scaffold.',
  ].join('\n');
}

function parseArguments(argv) {
  const options = {
    sourcePath: null,
    collection: null,
    section: null,
    title: null,
    order: 0,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (['--collection', '--section', '--title', '--order'].includes(argument)) {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value`);
      options[argument.slice(2)] = value;
      index += 1;
    } else if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else if (argument.startsWith('-')) {
      throw new Error(`unknown option: ${argument}`);
    } else if (options.sourcePath) {
      throw new Error('exactly one canonical Markdown source path is required');
    } else {
      options.sourcePath = argument;
    }
  }
  if (!options.help && !options.sourcePath) {
    throw new Error('one canonical Markdown source path is required');
  }
  if (!options.help && !options.collection) throw new Error('--collection is required');
  if (!options.help && !options.section) throw new Error('--section is required');
  return options;
}

export async function runDocsNew(
  argv,
  { repoRoot = process.cwd(), log = console.log } = {},
) {
  const options = parseArguments(argv);
  if (options.help) {
    log(usage());
    return null;
  }
  const result = await createWikiScaffold({ repoRoot, ...options });
  log('Created 5 wiki draft artifacts: unreviewed; publishing blocked.');
  for (const [label, artifactPath] of Object.entries(result.paths)) {
    log(`${label}: ${artifactPath}`);
  }
  log('Next commands:');
  result.nextCommands.forEach((command, index) => log(`${index + 1}. ${command}`));
  return result;
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  runDocsNew(process.argv.slice(2)).catch((error) => {
    console.error(`docs:new: ${error?.message || error}`);
    process.exitCode = 1;
  });
}
