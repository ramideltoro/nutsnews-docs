import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workflowPath = path.join(process.cwd(), '.github/workflows/wiki-pages.yml');

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
  'npm run test:wiki-approvals',
  'npm run test:docs-new',
  'npm run test:content-contract',
  'npm run test:workflow',
  'npm run test:pages-artifact',
  'npm run validate:contracts',
  'node scripts/wiki/validate-doc-paths.mjs',
  'npm run wiki:prepare',
  'node scripts/wiki/validate-wiki-approvals.mjs',
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
  'npm run test:browser',
  'npm run wiki:release:stamp',
  'npm run validate:pages-artifact',
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
  if (!/WIKI_SITE_URL: https:\/\/ramideltoro\.github\.io/.test(buildJob)
      || !/WIKI_BASE_PATH: \/nutsnews-docs/.test(buildJob)) {
    errors.push('the pre-cutover artifact must target the default project Pages URL');
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
