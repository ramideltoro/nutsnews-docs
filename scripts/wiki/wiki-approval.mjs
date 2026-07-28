import { createHash } from 'node:crypto';

import { parseMarkdownFrontmatter } from './parse-markdown.mjs';

export const approvalContract = {
  approvedState: 'approved',
  allowedPublishing: 'allowed',
  pendingReviewer: 'pending',
  unreviewedState: 'unreviewed',
  blockedPublishing: 'blocked',
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

export function approvalErrors(approval, expectedSourceHash) {
  const errors = [];
  if (!approval || typeof approval !== 'object') {
    return ['approval metadata is missing'];
  }
  if (approval.state !== approvalContract.approvedState) {
    errors.push(`approval state must be ${approvalContract.approvedState}`);
  }
  if (approval.publishing !== approvalContract.allowedPublishing) {
    errors.push(`publishing must be ${approvalContract.allowedPublishing}`);
  }
  const reviewerError = humanReviewerError(approval.reviewed_by);
  if (reviewerError) errors.push(reviewerError);
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
