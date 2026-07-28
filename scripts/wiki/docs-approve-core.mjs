import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { parseMarkdownFrontmatter } from './parse-markdown.mjs';
import {
  classifySourcePath,
  normalizeSourcePath,
  simplePathFromSource,
  technicalMirrorPathFromSource,
} from './wiki-contract.mjs';
import {
  approvalErrors,
  approvedRecord,
  expertSourceHash,
} from './wiki-approval.mjs';

function approvalLines(approval) {
  return [
    '  approval:',
    `    state: ${approval.state}`,
    `    publishing: ${approval.publishing}`,
    `    reviewed_by: ${JSON.stringify(approval.reviewed_by)}`,
    `    reviewed_on: ${JSON.stringify(approval.reviewed_on)}`,
    `    technical_source_hash: ${approval.technical_source_hash}`,
  ];
}

export function upsertWikiApproval(rawMarkdown, approval) {
  const lineEnding = rawMarkdown.includes('\r\n') ? '\r\n' : '\n';
  const trailingNewline = /\r?\n$/.test(rawMarkdown);
  const lines = rawMarkdown.replace(/\r\n?/g, '\n').split('\n');
  if (lines[0]?.trim() !== '---') {
    return [
      '---',
      'wiki:',
      ...approvalLines(approval),
      '---',
      rawMarkdown,
    ].join(lineEnding);
  }
  const frontmatterEnd = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (frontmatterEnd < 0) throw new Error('wiki approval frontmatter is not closed');
  let wikiStart = lines.findIndex(
    (line, index) => index > 0 && index < frontmatterEnd && /^wiki:\s*$/.test(line),
  );
  if (wikiStart < 0) {
    lines.splice(frontmatterEnd, 0, 'wiki:', ...approvalLines(approval));
    let output = lines.join(lineEnding);
    if (!trailingNewline) output = output.replace(new RegExp(`${lineEnding}$`), '');
    return output;
  }

  let wikiEnd = frontmatterEnd;
  for (let index = wikiStart + 1; index < frontmatterEnd; index += 1) {
    if (lines[index].trim() && !/^\s/.test(lines[index])) {
      wikiEnd = index;
      break;
    }
  }

  let approvalStart = -1;
  for (let index = wikiStart + 1; index < wikiEnd; index += 1) {
    if (/^ {2}approval\s*:/.test(lines[index])) {
      approvalStart = index;
      break;
    }
  }

  const replacement = approvalLines(approval);
  if (approvalStart < 0) {
    lines.splice(wikiEnd, 0, ...replacement);
  } else {
    let approvalEnd = approvalStart + 1;
    while (approvalEnd < wikiEnd) {
      const line = lines[approvalEnd];
      if (line.trim() && /^ {0,2}\S/.test(line)) break;
      approvalEnd += 1;
    }
    lines.splice(approvalStart, approvalEnd - approvalStart, ...replacement);
  }

  let output = lines.join(lineEnding);
  if (!trailingNewline) output = output.replace(new RegExp(`${lineEnding}$`), '');
  return output;
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function replaceFilesAtomically(entries) {
  const transactionId = `${process.pid}-${randomUUID()}`;
  const staged = [];
  const backups = [];
  try {
    for (const entry of entries) {
      const temporary = `${entry.target}.tmp-${transactionId}`;
      await fs.writeFile(temporary, entry.content, { flag: 'wx', mode: 0o644 });
      staged.push({ ...entry, temporary });
    }
    for (const entry of staged) {
      const backup = `${entry.target}.backup-${transactionId}`;
      await fs.link(entry.target, backup);
      backups.push({ target: entry.target, backup });
    }
    for (const entry of staged) {
      await fs.rename(entry.temporary, entry.target);
    }
    await Promise.all(backups.map(({ backup }) => fs.unlink(backup)));
  } catch (error) {
    await Promise.allSettled(staged.map(({ temporary }) => fs.unlink(temporary)));
    for (const { target, backup } of backups.reverse()) {
      if (await pathExists(backup)) {
        await fs.rename(backup, target).catch(() => {});
      }
    }
    throw error;
  }
}

export async function approveWikiSource({
  repoRoot = process.cwd(),
  sourcePath: rawSourcePath,
  reviewedBy,
  reviewedOn,
  confirmHumanReview = false,
  now = () => new Date(),
}) {
  if (!confirmHumanReview) {
    throw new Error('approval requires --confirm-human-review');
  }
  const sourcePath = normalizeSourcePath(rawSourcePath);
  if (sourcePath.startsWith('audiences/') || sourcePath.startsWith('diagrams/')) {
    throw new Error(`docs:approve requires a canonical Technical source: ${sourcePath}`);
  }
  classifySourcePath(sourcePath);
  const simplePath = simplePathFromSource(sourcePath);
  const technicalMirrorPath = technicalMirrorPathFromSource(sourcePath);
  const reviewPath = simplePath.replace(/\.md$/i, '.review.json');
  const sourceTarget = path.join(repoRoot, sourcePath);
  const simpleTarget = path.join(repoRoot, simplePath);
  const [rawSource, rawSimple] = await Promise.all([
    fs.readFile(sourceTarget, 'utf8').catch(() => null),
    fs.readFile(simpleTarget, 'utf8').catch(() => null),
  ]);
  if (rawSource === null) throw new Error(`canonical Technical source not found: ${sourcePath}`);
  if (rawSimple === null) throw new Error(`Simple mirror not found: ${simplePath}`);

  const sourceHash = expertSourceHash(rawSource);
  const approval = approvedRecord({
    reviewedBy,
    reviewedOn: reviewedOn || now().toISOString(),
    sourceHash,
  });
  const nextSource = upsertWikiApproval(rawSource, approval);
  const nextSimple = upsertWikiApproval(rawSimple, approval);
  const sourceApproval = parseMarkdownFrontmatter(nextSource).data?.wiki?.approval;
  const simpleApproval = parseMarkdownFrontmatter(nextSimple).data?.wiki?.approval;
  const approvalProblems = [
    ...approvalErrors(sourceApproval, sourceHash),
    ...approvalErrors(simpleApproval, sourceHash),
  ];
  if (approvalProblems.length) {
    throw new Error(`approval update is invalid: ${approvalProblems.join('; ')}`);
  }

  const entries = [
    { target: sourceTarget, content: nextSource },
    { target: simpleTarget, content: nextSimple },
  ];
  const technicalMirrorTarget = path.join(repoRoot, technicalMirrorPath);
  if (await pathExists(technicalMirrorTarget)) {
    const rawTechnicalMirror = await fs.readFile(technicalMirrorTarget, 'utf8');
    const nextTechnicalMirror = upsertWikiApproval(rawTechnicalMirror, approval);
    const technicalMirrorDocument = parseMarkdownFrontmatter(nextTechnicalMirror);
    const technicalMirrorApproval = technicalMirrorDocument.data?.wiki?.approval;
    const technicalMirrorProblems = approvalErrors(technicalMirrorApproval, sourceHash);
    if (technicalMirrorProblems.length) {
      throw new Error(
        `${technicalMirrorPath}: Technical mirror approval update is invalid: `
          + `${technicalMirrorProblems.join('; ')}; `
          + `frontmatter keys=${Object.keys(technicalMirrorDocument.data || {}).join(',')}`,
      );
    }
    entries.push({ target: technicalMirrorTarget, content: nextTechnicalMirror });
  }
  const reviewTarget = path.join(repoRoot, reviewPath);
  if (await pathExists(reviewTarget)) {
    const manifest = JSON.parse(await fs.readFile(reviewTarget, 'utf8'));
    manifest.state = approval.state;
    manifest.publishing = approval.publishing;
    manifest.approval = approval;
    entries.push({
      target: reviewTarget,
      content: `${JSON.stringify(manifest, null, 2)}\n`,
    });
  }
  await replaceFilesAtomically(entries);

  return {
    sourcePath,
    simplePath,
    technicalMirrorPath: await pathExists(technicalMirrorTarget) ? technicalMirrorPath : null,
    reviewPath: await pathExists(reviewTarget) ? reviewPath : null,
    approval,
  };
}
