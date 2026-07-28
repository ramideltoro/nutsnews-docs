#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { approveWikiSource } from './docs-approve-core.mjs';

function usage() {
  return [
    'Usage: npm run docs:approve -- <canonical-source.md> --reviewed-by <identity> --confirm-human-review',
    '       [--reviewed-on <ISO-8601 timestamp>]',
    '',
    'Records a separate human approval on the Technical source, Simple mirror, and review manifest.',
  ].join('\n');
}

function parseArguments(argv) {
  const options = {
    sourcePath: null,
    reviewedBy: null,
    reviewedOn: null,
    confirmHumanReview: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--reviewed-by' || argument === '--reviewed-on') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value`);
      if (argument === '--reviewed-by') options.reviewedBy = value;
      else options.reviewedOn = value;
      index += 1;
    } else if (argument === '--confirm-human-review') {
      options.confirmHumanReview = true;
    } else if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else if (argument.startsWith('-')) {
      throw new Error(`unknown option: ${argument}`);
    } else if (options.sourcePath) {
      throw new Error('exactly one canonical Technical Markdown source is required');
    } else {
      options.sourcePath = argument;
    }
  }
  if (!options.help && !options.sourcePath) {
    throw new Error('one canonical Technical Markdown source is required');
  }
  if (!options.help && !options.reviewedBy) {
    throw new Error('--reviewed-by must name the human reviewer');
  }
  return options;
}

export async function runDocsApprove(argv) {
  const options = parseArguments(argv);
  if (options.help) {
    console.log(usage());
    return null;
  }
  const result = await approveWikiSource(options);
  console.log(`Approved ${result.sourcePath} for ${result.approval.reviewed_by}.`);
  console.log(`Normalized Technical source hash: ${result.approval.technical_source_hash}`);
  return result;
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  runDocsApprove(process.argv.slice(2)).catch((error) => {
    console.error(`docs:approve: ${error?.message || error}`);
    process.exitCode = 1;
  });
}
