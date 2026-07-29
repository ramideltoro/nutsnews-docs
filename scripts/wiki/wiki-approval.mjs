import { createHash } from 'node:crypto';

import { parseMarkdownFrontmatter } from './parse-markdown.mjs';

export const approvalContract = {
  requiredForPublishing: false,
  approvedState: 'approved',
  automatedState: 'automated',
  allowedPublishing: 'allowed',
  pendingReviewer: 'pending',
  unreviewedState: 'unreviewed',
  blockedPublishing: 'blocked',
  automatedReviewer: 'codex-merge-docs',
};

function stableValue(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function normalizeBody(content) {
  return `${content ?? ''}`
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n*$/, '\n');
}

export function normalizeExpertSource(rawMarkdown) {
  const parsed = parseMarkdownFrontmatter(`${rawMarkdown ?? ''}`.replace(/\r\n?/g, '\n'));
  const frontmatter = structuredClone(parsed.data || {});
  if (frontmatter.wiki && typeof frontmatter.wiki === 'object') {
    delete frontmatter.wiki.approval;
    if (Object.keys(frontmatter.wiki).length === 0) {
      delete frontmatter.wiki;
    }
  }
  delete frontmatter.approval;
  return `${JSON.stringify(stableValue(frontmatter))}\n---\n${normalizeBody(parsed.content)}`;
}

export function expertSourceHash(rawMarkdown) {
  return createHash('sha256')
    .update(normalizeExpertSource(rawMarkdown))
    .digest('hex');
}

export function humanReviewerError(reviewedBy) {
  const reviewer = `${reviewedBy ?? ''}`.trim();
  if (!reviewer) return 'review identity is required';
  if (reviewer.length > 120) return 'review identity must be 120 characters or fewer';
  if (
    reviewer.toLowerCase() === approvalContract.pendingReviewer
    || /\b(?:openai|codex|gpt(?:-\S*)?|docs:prepare|generator|automation|bot)\b/i.test(reviewer)
  ) {
    return 'review identity must name the human reviewer, not a generator or pending value';
  }
  return null;
}

export function normalizedReviewTime(reviewedOn) {
  const value = `${reviewedOn ?? ''}`.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new Error('review time must be a complete ISO 8601 timestamp with timezone');
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error('review time must be a valid ISO 8601 timestamp');
  }
  return parsed.toISOString();
}

export function approvedRecord({ reviewedBy, reviewedOn, sourceHash }) {
  const reviewer = `${reviewedBy ?? ''}`.trim();
  const reviewerError = humanReviewerError(reviewer);
  if (reviewerError) throw new Error(reviewerError);
  if (!/^[a-f0-9]{64}$/.test(`${sourceHash ?? ''}`)) {
    throw new Error('normalized Technical source hash must be a lowercase SHA-256 value');
  }
  return {
    state: approvalContract.approvedState,
    publishing: approvalContract.allowedPublishing,
    reviewed_by: reviewer,
    reviewed_on: normalizedReviewTime(reviewedOn),
    technical_source_hash: sourceHash,
  };
}

export function automatedRecord({
  reviewedOn,
  sourceHash,
  sourceRepository,
  pullRequests,
  mergeCommit,
  workflowRun,
}) {
  if (!/^[a-f0-9]{64}$/.test(`${sourceHash ?? ''}`)) {
    throw new Error('normalized Technical source hash must be a lowercase SHA-256 value');
  }
  const repository = `${sourceRepository ?? ''}`.trim();
  if (
    !/^ramideltoro\/nutsnews(?:-[a-z0-9-]+)?$/.test(repository)
    || repository === 'ramideltoro/nutsnews-docs'
  ) {
    throw new Error('automated approval requires a supported NutsNews source repository');
  }
  const pulls = `${pullRequests ?? ''}`.trim();
  if (!/^\d+(?:,\d+)*$/.test(pulls)) {
    throw new Error('automated approval requires comma-separated pull request numbers');
  }
  const commit = `${mergeCommit ?? ''}`.trim();
  if (!/^[a-f0-9]{40}$/.test(commit)) {
    throw new Error('automated approval requires a 40-character merge commit SHA');
  }
  const run = `${workflowRun ?? ''}`.trim();
  if (!/^\d+$/.test(run)) {
    throw new Error('automated approval requires a numeric workflow run id');
  }
  return {
    state: approvalContract.automatedState,
    publishing: approvalContract.allowedPublishing,
    reviewed_by: approvalContract.automatedReviewer,
    reviewed_on: normalizedReviewTime(reviewedOn),
    technical_source_hash: sourceHash,
    automation: {
      source_repository: repository,
      pull_requests: pulls,
      merge_commit: commit,
      workflow_run: run,
    },
  };
}

function automatedApprovalErrors(approval) {
  const errors = [];
  if (approval.reviewed_by !== approvalContract.automatedReviewer) {
    errors.push(`automated review identity must be ${approvalContract.automatedReviewer}`);
  }
  const automation = approval.automation;
  if (!automation || typeof automation !== 'object') {
    return [...errors, 'automated approval provenance is missing'];
  }
  if (
    !/^ramideltoro\/nutsnews(?:-[a-z0-9-]+)?$/.test(`${automation.source_repository ?? ''}`)
    || automation.source_repository === 'ramideltoro/nutsnews-docs'
  ) {
    errors.push('automated approval source repository is invalid');
  }
  if (!/^\d+(?:,\d+)*$/.test(`${automation.pull_requests ?? ''}`)) {
    errors.push('automated approval pull request provenance is invalid');
  }
  if (!/^[a-f0-9]{40}$/.test(`${automation.merge_commit ?? ''}`)) {
    errors.push('automated approval merge commit provenance is invalid');
  }
  if (!/^\d+$/.test(`${automation.workflow_run ?? ''}`)) {
    errors.push('automated approval workflow run provenance is invalid');
  }
  return errors;
}

export function approvalErrors(approval, expectedSourceHash) {
  const errors = [];
  if (!approval || typeof approval !== 'object') {
    return ['approval metadata is missing'];
  }
  if (
    approval.state !== approvalContract.approvedState
    && approval.state !== approvalContract.automatedState
  ) {
    errors.push(
      `approval state must be ${approvalContract.approvedState} or ${approvalContract.automatedState}`,
    );
  }
  if (approval.publishing !== approvalContract.allowedPublishing) {
    errors.push(`publishing must be ${approvalContract.allowedPublishing}`);
  }
  if (approval.state === approvalContract.automatedState) {
    errors.push(...automatedApprovalErrors(approval));
  } else {
    const reviewerError = humanReviewerError(approval.reviewed_by);
    if (reviewerError) errors.push(reviewerError);
  }
  try {
    normalizedReviewTime(approval.reviewed_on);
  } catch (error) {
    errors.push(error.message);
  }
  if (approval.technical_source_hash !== expectedSourceHash) {
    errors.push('approval is stale for the normalized Technical source');
  }
  return errors;
}
