import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';

const repoRoot = process.cwd();

const SENSITIVE_PATTERNS = [
  { name: 'GitHub token', regex: /\bgh[pous]_[A-Za-z0-9_]{36,100}\b/g },
  { name: 'OpenAI API key', regex: /\bsk-[A-Za-z0-9]{20,}/g },
  { name: 'OpenAI project key', regex: /\bsk-proj-[A-Za-z0-9]{20,}/g },
  { name: 'Google API key', regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { name: 'AWS key ID', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'Private key header', regex: /BEGIN [A-Z ]*PRIVATE KEY/g },
  { name: 'Slack token', regex: /\bxox[baprs]-[0-9]{10,}[-][A-Za-z0-9-]{10,}\b/g },
  { name: 'JWT-like secret', regex: /\b[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{27,}\b/g },
];

const ASSIGNMENT_PATTERNS = [
  { name: 'Potential token assignment', regex: /\b(?:api|access|session|private|secret|password)\s*(?:[-_]\w+){0,3}\s*[:=]\s*['"]?([A-Za-z0-9._+=/-]{20,})/i },
  { name: 'Generic token assignment', regex: /\b\w+_(?:TOKEN|KEY|SECRET|PASSWORD)\s*[:=]\s*['"]?([A-Za-z0-9._+=-]{20,})/i },
];

const PLACEHOLDER_MARKERS = [
  'YOUR_',
  '<',
  'REPLACE',
  'PLACEHOLDER',
  '***',
  'CHANGEME',
  'TODO',
  '${',
  '***REDACTED***',
  'your_',
  'example',
  'placeholder',
  'to_be_set',
];

const DEFAULT_IGNORE = new Set([
  '.git',
  '.github',
  '.idea',
  '.vscode',
  '.DS_Store',
  'node_modules',
  '.cache',
  '_site',
  'scripts/wiki/validate-wiki-secrets.mjs',
]);

function hasPlaceholder(value) {
  const lower = value.toLowerCase();
  return PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker.toLowerCase()));
}

function appearsLikeSecret(value) {
  if (!/[A-Za-z0-9]/.test(value)) {
    return false;
  }

  if (value.length < 20) {
    return false;
  }

  if (hasPlaceholder(value)) {
    return false;
  }

  if (/^[a-z-]+$/.test(value.toLowerCase()) && value.length >= 20) {
    return false;
  }

  if (/[A-Z]/.test(value) || /[0-9]/.test(value) || /[+/_]/.test(value)) {
    return true;
  }

  return value.length > 48 && /[a-z0-9]{3,}/i.test(value);
}

function shouldIgnore(file) {
  return file.startsWith('node_modules/') || file.startsWith('.git/');
}

async function getTargets(pathArg) {
  if (pathArg) {
    return [pathArg];
  }

  const tracked = (await exec('git', ['ls-files'])).split(/\r?\n/).filter(Boolean);
  const staged = (await exec('git', ['diff', '--cached', '--name-only'])).split(/\r?\n/).filter(Boolean);
  const combined = new Set([...tracked, ...staged]);
  return [...combined].filter((file) => !shouldIgnore(file));
}

async function exec(command, args) {
  const { spawn } = await import('node:child_process');
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const out = [];
    const err = [];
    proc.stdout.on('data', (chunk) => out.push(chunk));
    proc.stderr.on('data', (chunk) => err.push(chunk));
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error((Buffer.concat(err) || Buffer.from('')).toString() || `Command failed: ${command}`));
        return;
      }
      resolve(Buffer.concat(out).toString());
    });
  });
}

function scanLinesForSecrets(file, data) {
  const findings = [];
  let lineNumber = 0;

  for (const rawLine of data.split(/\r?\n/)) {
    lineNumber += 1;
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    for (const candidate of SENSITIVE_PATTERNS) {
      const re = new RegExp(candidate.regex);
      if (re.test(line)) {
        findings.push({
          file,
          lineNumber,
          reason: candidate.name,
        });
      }
      candidate.regex.lastIndex = 0;
    }

    for (const candidate of ASSIGNMENT_PATTERNS) {
      const match = line.match(candidate.regex);
      if (match && match[1] && appearsLikeSecret(match[1]) && !hasPlaceholder(line)) {
        findings.push({
          file,
          lineNumber,
          reason: candidate.name,
        });
      }
      candidate.regex.lastIndex = 0;
    }
  }

  return findings;
}

async function scanFile(file) {
  try {
    const data = await fs.readFile(path.join(repoRoot, file), 'utf8');
    return scanLinesForSecrets(file, data);
  } catch {
    // skip binaries/non-text files
    return [];
  }
}

async function runValidation(targets) {
  const allFindings = [];
  for (const file of targets) {
    const ext = path.extname(file);
    if (DEFAULT_IGNORE.has(path.basename(file)) || DEFAULT_IGNORE.has(ext)) {
      continue;
    }
    try {
      const stats = await fs.stat(path.join(repoRoot, file));
      if (!stats.isFile()) {
        continue;
      }
    } catch {
      continue;
    }

    const hits = await scanFile(file);
    allFindings.push(...hits);
  }

  if (allFindings.length > 0) {
    console.error('Potential non-redacted secret-like values detected:');
    for (const finding of allFindings) {
      console.error(`- ${finding.file}:${finding.lineNumber}: ${finding.reason}`);
    }
    return { success: false, count: allFindings.length };
  }

  return { success: true, count: 0 };
}

async function runSmokeTest() {
  const file = path.join(tmpdir(), `wiki-secret-fixture-${randomUUID()}`);
  const syntheticSecret = `OPENAI_API_KEY=sk-${randomBytes(32).toString('hex')}`;
  await fs.writeFile(file, syntheticSecret, 'utf8');
  const findings = scanLinesForSecrets(file, syntheticSecret);
  await fs.unlink(file);
  return findings.length > 0 ? 0 : 1;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (const arg of args) {
    if (arg.startsWith('--path=')) {
      opts.path = arg.split('=', 2)[1];
    }
    if (arg === '--smoke-test') {
      opts.smokeTest = true;
    }
  }
  return opts;
}

(async () => {
  const args = parseArgs();
  try {
    const targets = await getTargets(args.path);
    const result = await runValidation(targets);
    if (!result.success) {
      process.exitCode = 1;
      return;
    }

    if (args.smokeTest) {
      const smokeResult = await runSmokeTest();
      if (smokeResult !== 0) {
        console.error('Secret smoke test failed: synthetic fixture was not detected.');
        process.exitCode = 1;
        return;
      }
      console.log('Secret smoke test passed: synthetic fixture was detected and blocked.');
    }

    console.log('Secret safety check passed.');
  } catch (error) {
    console.error(`Secret safety check failed: ${error.message}`);
    process.exitCode = 1;
  }
})();
