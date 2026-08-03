import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workflowPath = path.join(process.cwd(), '.github/workflows/wiki-pages.yml');
const mergeWorkflowPath = path.join(
  process.cwd(),
  '.github/workflows/automated-merge-docs.yml',
);
const CODEX_ACTION_SHA = '52fe01ec70a42f454c9d2ebd47598f9fd6893d56';

const requiredActions = new Set([
  'actions/checkout',
  'actions/setup-node',
  'actions/upload-artifact',
  'actions/configure-pages',
  'actions/upload-pages-artifact',
  'actions/deploy-pages',
]);

const requiredCommands = [
  'npm ci',
  'npm run test:docs-prepare',
  'npm run test:secret-safety',
  'npm run test:docs-new',
  'npm run test:content-contract',
  'npm run test:workflow',
  'npm run test:visual-baselines',
  'npm run test:pages-artifact',
  'npm run validate:contracts',
  'node scripts/wiki/validate-doc-paths.mjs',
  'npm run wiki:prepare',
  'npm run validate:content',
  'npm run test:content-routes',
  'npm run validate:links',
  'npm run validate:secrets',
  'npm run validate:mermaid',
  'npm run build',
  'node scripts/wiki/validate-wiki-budgets.mjs',
  'npm run validate:inventory',
  'npm run validate:brand',
  'npm run validate:resolver',
  'npm run validate:source-metadata',
  'npm run validate:routing',
  'node scripts/wiki/validate-audience-routes.mjs',
  'npm run validate:search',
  'npm run validate:audience-switch',
  'npm run validate:article',
  'npm run validate:shell',
  'npm run validate:visual-baselines',
  'npm run test:browser',
  'npm run wiki:release:stamp',
  'npm run validate:pages-artifact',
];

const forbiddenCommands = [
  'npm run test:wiki-approvals',
  'node scripts/wiki/validate-wiki-approvals.mjs',
];

export function validateWorkflow(source) {
  const errors = [];
  const actionRefs = [...source.matchAll(/^\s*uses:\s*([^@\s]+)@([^\s#]+)(?:\s+#\s*(\S+))?\s*$/gm)];
  const seenActions = new Set();

  for (const [, action, ref, release] of actionRefs) {
    seenActions.add(action);
    if (!/^[0-9a-f]{40}$/.test(ref)) {
      errors.push(`${action} must use a full 40-character commit SHA`);
    }
    if (!/^v\d+\.\d+\.\d+$/.test(release || '')) {
      errors.push(`${action} must retain its release tag in a comment`);
    }
  }

  for (const action of requiredActions) {
    if (!seenActions.has(action)) {
      errors.push(`required action is missing: ${action}`);
    }
  }

  const globalPermissions = source.match(/^permissions:\n((?: {2}.+\n)+)\nconcurrency:/m)?.[1] || '';
  if (globalPermissions.trim() !== 'contents: read') {
    errors.push('global permissions must be limited to contents: read');
  }

  if (!/concurrency:\n\s{2}group: wiki-pages-\$\{\{ github\.ref \}\}\n\s{2}cancel-in-progress: true/.test(source)) {
    errors.push('superseded runs must be cancelled within the same ref');
  }

  const validateJob = source.match(/^  validate:\n([\s\S]*?)(?=^  build:)/m)?.[1] || '';
  if (
    !/- name: Checkout[\s\S]*?actions\/checkout@[0-9a-f]{40}[\s\S]*?fetch-depth: 0/.test(
      validateJob,
    )
  ) {
    errors.push('validation checkout must fetch the PR base for visual baseline parity');
  }
  if (
    !/- name: Validate cross-platform visual baseline parity[\s\S]*?WIKI_VISUAL_BASE_SHA: \$\{\{ github\.event\.pull_request\.base\.sha \}\}[\s\S]*?npm run validate:visual-baselines/.test(
      validateJob,
    )
  ) {
    errors.push('cross-platform visual baseline parity must compare against the PR base');
  }
  if (!/outputs:\n\s{6}validated_sha: \$\{\{ steps\.v1_ready\.outputs\.sha \}\}/.test(validateJob)) {
    errors.push('validation must expose the v1-ready commit SHA');
  }
  if (!/name: Mark v1-ready commit\n\s+id: v1_ready\n\s+run: echo "sha=\$GITHUB_SHA"/.test(validateJob)) {
    errors.push('the v1-ready marker must be emitted only after validation');
  }

  const buildJob = source.match(/^  build:\n([\s\S]*?)(?=^  deploy:)/m)?.[1] || '';
  if (!/needs: \[validate\]/.test(buildJob)) {
    errors.push('the Pages build must depend on complete validation');
  }
  if (!/ref: \$\{\{ needs\.validate\.outputs\.validated_sha \}\}/.test(buildJob)) {
    errors.push('the Pages build must check out the exact validated SHA');
  }
  if (!/WIKI_SITE_URL: https:\/\/wiki\.nutsnews\.com/.test(buildJob)
      || !/WIKI_BASE_PATH: \/$/m.test(buildJob)) {
    errors.push('the production artifact must target the root custom domain');
  }
  const artifactValidation = buildJob.indexOf('npm run validate:pages-artifact');
  const artifactUpload = buildJob.indexOf('actions/upload-pages-artifact@');
  if (artifactValidation < 0 || artifactUpload < 0 || artifactValidation > artifactUpload) {
    errors.push('the final Pages artifact must be validated before upload');
  }

  const deployJob = source.match(/^  deploy:\n([\s\S]+)$/m)?.[1] || '';
  if (!/^\s{4}permissions:\n\s{6}pages: write\n\s{6}id-token: write$/m.test(deployJob)) {
    errors.push('deploy must have only pages: write and id-token: write permissions');
  }

  if (/\$\{\{\s*secrets\./.test(source)) {
    errors.push('the wiki workflow must not consume repository secrets');
  }
  if (!/OPENAI_API_KEY:\s*""/.test(source)) {
    errors.push('the mocked drafting test must explicitly receive an empty OpenAI key');
  }

  for (const command of requiredCommands) {
    if (!source.includes(command)) {
      errors.push(`publish-blocking command is missing: ${command}`);
    }
  }
  for (const command of forbiddenCommands) {
    if (source.includes(command)) {
      errors.push(`human approval must not block publication: ${command}`);
    }
  }

  const failureArtifact = source.match(
    /- name: Upload browser failure artifacts\n([\s\S]*?)(?=\n  build:)/,
  )?.[1] || '';
  if (!/if: failure\(\)/.test(failureArtifact)) {
    errors.push('browser diagnostics must upload only on failure');
  }
  if (!/retention-days:\s*7/.test(failureArtifact)) {
    errors.push('browser diagnostics must expire after seven days');
  }
  if (!/include-hidden-files:\s*false/.test(failureArtifact)) {
    errors.push('browser diagnostics must exclude hidden files');
  }
  if (!/path:\s*\|\n\s+playwright-report\/\n\s+test-results\/wiki\//.test(failureArtifact)) {
    errors.push('browser diagnostics must be limited to the two approved output directories');
  }

  return errors;
}

export function validateMergeWorkflow(source) {
  const errors = [];
  if (!/cron: "\*\/30 \* \* \* \*"/.test(source) || !/workflow_dispatch:/.test(source)) {
    errors.push('merge documentation must run every thirty minutes and support manual dispatch');
  }
  if (/pull_request_target:|pull_request:/.test(source)) {
    errors.push('untrusted pull request events must not trigger merge documentation');
  }
  if (!source.includes(`openai/codex-action@${CODEX_ACTION_SHA} # v1`)) {
    errors.push('Codex Action must use the reviewed immutable v1 commit');
  }
  const codexStep = source.match(
    /- name: Generate complete wiki documentation\n([\s\S]*?)(?=\n      - name:)/,
  )?.[1] || '';
  if (!/openai-api-key: \$\{\{ secrets\.WIKI_AI_API_KEY \}\}/.test(codexStep)) {
    errors.push('Codex must receive the dedicated local-Qwen repository secret');
  }
  if (!/responses-api-endpoint: https:\/\/backend\.nutsnews\.com\/wiki-ai\/v1\/responses/.test(codexStep)) {
    errors.push('Codex must use the authenticated backend Wiki AI Responses endpoint');
  }
  if (/GH_TOKEN|github\.token/.test(codexStep)) {
    errors.push('Codex must not receive a GitHub write token');
  }
  for (const setting of [
    'working-directory: _automation-work/agent',
    'sandbox: workspace-write',
    'model: nutsnews-wiki-qwen',
    'effort: none',
    'safety-strategy: drop-sudo',
    'allow-users: ramideltoro',
    'allow-bots: true',
  ]) {
    if (!codexStep.includes(setting)) errors.push(`Codex safety setting is missing: ${setting}`);
  }
  if ((source.match(/persist-credentials: false/g) || []).length !== 2) {
    errors.push('both documentation checkouts must drop persisted credentials');
  }
  if (/repository: \$\{\{ steps\.event\.outputs\.repository \}\}/.test(source)) {
    errors.push('the merged source repository must not be checked out for Codex');
  }
  const documentJob = source.match(
    /\n  document:\n([\s\S]*?)(?=\n  [a-z][a-z0-9_-]+:\n|\s*$)/,
  )?.[1] || '';
  if (!/timeout-minutes: 180/.test(documentJob)) {
    errors.push('merge documentation must have a bounded job timeout');
  }
  if (!/max-parallel: 1/.test(source) || !/cancel-in-progress: false/.test(source)) {
    errors.push('merge documentation must serialize repositories and workflow runs');
  }
  const orderedSteps = [
    'Prepare bounded merge evidence',
    'Prepare isolated documentation bundle',
    'Verify local Qwen readiness',
    'Generate complete wiki documentation',
    'Import isolated documentation bundle',
    'Enforce automated documentation change boundary',
    'Record immutable automated provenance',
    'Validate generated documentation',
    'Advance merge cursor',
    'Commit validated documentation directly to main',
    'Dispatch validated Pages deployment',
  ];
  let previous = -1;
  for (const step of orderedSteps) {
    const current = source.indexOf(`- name: ${step}`);
    if (current < 0 || current <= previous) {
      errors.push(`merge documentation ordering is unsafe at: ${step}`);
    }
    previous = current;
  }
  for (const command of [
    'npm run validate:contracts',
    'npm run validate:content',
    'npm run validate:approvals',
    'npm run validate:links',
    'npm run validate:mermaid',
    'npm run validate:secrets',
    'npm run build',
  ]) {
    if (!source.includes(command)) errors.push(`merge validation is missing: ${command}`);
  }
  if (
    !source.includes('record-nutsnews-merge-failure.mjs')
    || !source.includes('Identical merge batches retry at most three times')
  ) {
    errors.push('merge failures must persist and report the bounded retry state');
  }
  return errors;
}

test('clean workflow satisfies the pinned quality and security contract', async () => {
  const source = await fs.readFile(workflowPath, 'utf8');
  assert.deepEqual(validateWorkflow(source), []);
});

test('mutable action reference fixture is rejected', async () => {
  const source = await fs.readFile(workflowPath, 'utf8');
  const broken = source.replace(
    /actions\/checkout@[0-9a-f]{40}/,
    'actions/checkout@v7',
  );
  assert.ok(
    validateWorkflow(broken).some((error) => error.includes('full 40-character commit SHA')),
  );
});

test('secret-consuming workflow fixture is rejected', async () => {
  const source = await fs.readFile(workflowPath, 'utf8');
  const broken = source.replace(
    'OPENAI_API_KEY: ""',
    'OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}',
  );
  assert.ok(
    validateWorkflow(broken).some((error) => error.includes('must not consume repository secrets')),
  );
});

test('broad failure-artifact fixture is rejected', async () => {
  const source = await fs.readFile(workflowPath, 'utf8');
  const broken = source.replace(
    '            playwright-report/\n            test-results/wiki/',
    '            ./',
  );
  assert.ok(
    validateWorkflow(broken).some((error) => error.includes('two approved output directories')),
  );
});

test('shallow validation checkout fixture is rejected', async () => {
  const source = await fs.readFile(workflowPath, 'utf8');
  const broken = source.replace('          fetch-depth: 0\n', '');
  assert.ok(
    validateWorkflow(broken).some((error) => error.includes('must fetch the PR base')),
  );
});

test('validation-bypass fixture cannot publish', async () => {
  const source = await fs.readFile(workflowPath, 'utf8');
  const broken = source.replace('    needs: [validate]', '    needs: []');
  assert.ok(
    validateWorkflow(broken).some((error) => error.includes('must depend on complete validation')),
  );
});

test('superseded-run fixture is rejected', async () => {
  const source = await fs.readFile(workflowPath, 'utf8');
  const broken = source.replace('  cancel-in-progress: true', '  cancel-in-progress: false');
  assert.ok(
    validateWorkflow(broken).some((error) => error.includes('superseded runs must be cancelled')),
  );
});

test('merge documentation workflow satisfies its security and ordering contract', async () => {
  const source = await fs.readFile(mergeWorkflowPath, 'utf8');
  assert.deepEqual(validateMergeWorkflow(source), []);
});

test('mutable Codex Action fixture is rejected', async () => {
  const source = await fs.readFile(mergeWorkflowPath, 'utf8');
  const broken = source.replace(`openai/codex-action@${CODEX_ACTION_SHA}`, 'openai/codex-action@v1');
  assert.ok(
    validateMergeWorkflow(broken).some((error) => error.includes('immutable v1 commit')),
  );
});

test('cursor-before-validation fixture is rejected', async () => {
  const source = await fs.readFile(mergeWorkflowPath, 'utf8');
  const cursor = source.match(
    /\n      - name: Advance merge cursor\n[\s\S]*?(?=\n      - name:)/,
  )?.[0] || '';
  const broken = source
    .replace(cursor, '')
    .replace('\n      - name: Validate generated documentation', `${cursor}\n      - name: Validate generated documentation`);
  assert.ok(
    validateMergeWorkflow(broken).some((error) => error.includes('ordering is unsafe')),
  );
});
