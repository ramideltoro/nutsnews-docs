import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = process.cwd();
const validatorPath = fileURLToPath(
  new URL('./validate-wiki-secrets.mjs', import.meta.url),
);
const syntheticSecret = `sk-${'A1'.repeat(24)}`;

function run(command, args, cwd = repoRoot) {
  return spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, OPENAI_API_KEY: '' },
  });
}

async function fixtureRepo(t) {
  const directory = await fs.mkdtemp(path.join(tmpdir(), 'wiki-secret-safety-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  assert.equal(run('git', ['init', '--quiet'], directory).status, 0);
  assert.equal(run('git', ['config', 'user.email', 'wiki-tests@example.invalid'], directory).status, 0);
  assert.equal(run('git', ['config', 'user.name', 'Wiki Tests'], directory).status, 0);
  await fs.writeFile(path.join(directory, 'tracked.txt'), 'safe tracked content\n', 'utf8');
  assert.equal(run('git', ['add', 'tracked.txt'], directory).status, 0);
  assert.equal(run('git', ['commit', '--quiet', '-m', 'fixture'], directory).status, 0);
  return directory;
}

function runValidator(cwd, args = []) {
  return run(process.execPath, [validatorPath, ...args], cwd);
}

function assertRedactedFailure(result, source) {
  const output = `${result.stdout}\n${result.stderr}`;
  assert.equal(result.status, 1);
  assert.match(output, /Potential non-redacted secret-like values detected/);
  assert.match(output, new RegExp(source));
  assert.match(output, /OpenAI API key/);
  assert.doesNotMatch(output, new RegExp(syntheticSecret));
}

test('tracked working-tree secrets fail with redacted diagnostics', async (t) => {
  const directory = await fixtureRepo(t);
  await fs.writeFile(
    path.join(directory, 'tracked.txt'),
    `OPENAI_API_KEY=${syntheticSecret}\n`,
    'utf8',
  );
  assertRedactedFailure(runValidator(directory), 'working tree');
});

test('staged index secrets fail even after the working tree is redacted', async (t) => {
  const directory = await fixtureRepo(t);
  const target = path.join(directory, 'tracked.txt');
  await fs.writeFile(target, `OPENAI_API_KEY=${syntheticSecret}\n`, 'utf8');
  assert.equal(run('git', ['add', 'tracked.txt'], directory).status, 0);
  await fs.writeFile(target, 'safe working-tree replacement\n', 'utf8');
  assertRedactedFailure(runValidator(directory), 'staged index');
});

test('clean tracked and staged content passes', async (t) => {
  const directory = await fixtureRepo(t);
  await fs.writeFile(path.join(directory, 'new.txt'), 'safe staged content\n', 'utf8');
  assert.equal(run('git', ['add', 'new.txt'], directory).status, 0);
  const result = runValidator(directory, ['--smoke-test']);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /synthetic fixture was detected and blocked/);
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, new RegExp(syntheticSecret));
});

test('ignore rules cover local outputs but preserve reviewed wiki bundles', () => {
  const ignored = [
    '.env',
    'config/credentials.env',
    'nested/.env.local',
    '.direnv/cache',
    '_site/index.html',
    'playwright-report/index.html',
    'test-results/wiki/result.json',
    '.astro/cache.json',
    '.turbo/cache.json',
    'notes/topic.ai-draft.md',
    'notes/topic.draft.md',
    'scripts/wiki/wiki-inventory.generated.json',
  ];
  for (const candidate of ignored) {
    assert.equal(
      run('git', ['check-ignore', '--quiet', '--no-index', candidate]).status,
      0,
      `${candidate} must be ignored`,
    );
  }

  for (const candidate of [
    '.env.example',
    'audiences/simple/REVIEWED_EXAMPLE.md',
    'diagrams/REVIEWED_EXAMPLE.mmd',
  ]) {
    assert.notEqual(
      run('git', ['check-ignore', '--quiet', '--no-index', candidate]).status,
      0,
      `${candidate} must remain trackable`,
    );
  }
});

test('the authoring CLI reads the key from process environment only', async () => {
  const source = await fs.readFile(
    path.join(repoRoot, 'scripts/wiki/docs-prepare.mjs'),
    'utf8',
  );
  assert.match(source, /runDocsPrepare\(argv, env = process\.env\)/);
  assert.match(source, /new OpenAI\(\{ apiKey: env\.OPENAI_API_KEY \}\)/);
  assert.doesNotMatch(source, /dotenv|readFileSync?\([^)]*\.env/i);
});
