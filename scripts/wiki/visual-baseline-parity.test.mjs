import assert from 'node:assert/strict';
import test from 'node:test';
import { validateVisualBaselineParity } from './validate-visual-baseline-parity.mjs';

const completeInventory = [
  'article-shell-desktop-1440x1024-darwin.png',
  'article-shell-desktop-1440x1024-linux.png',
  'article-shell-mobile-390x844-darwin.png',
  'article-shell-mobile-390x844-linux.png',
];

test('complete cross-platform baseline pairs pass', () => {
  assert.deepEqual(
    validateVisualBaselineParity({
      files: completeInventory,
      changedFiles: completeInventory.slice(0, 2),
    }),
    [],
  );
});

test('a missing platform companion fails', () => {
  const errors = validateVisualBaselineParity({
    files: completeInventory.slice(0, -1),
  });
  assert.ok(errors.some((error) => error.includes('missing reviewed baseline companion')));
});

test('a one-platform baseline update fails', () => {
  const errors = validateVisualBaselineParity({
    files: completeInventory,
    changedFiles: ['article-shell-mobile-390x844-darwin.png'],
  });
  assert.ok(errors.some((error) => error.includes('changed for darwin only')));
  assert.ok(errors.some((error) => error.includes('linux companion')));
});

test('a hash-bound platform-only review passes', () => {
  assert.deepEqual(
    validateVisualBaselineParity({
      files: completeInventory,
      changedFiles: ['article-shell-mobile-390x844-linux.png'],
      platformReviews: {
        'article-shell-mobile-390x844': {
          platforms: ['linux'],
          reason: 'Linux font metrics changed this baseline without changing macOS.',
          sha256: { linux: 'a'.repeat(64) },
        },
      },
      currentHashes: {
        'article-shell-mobile-390x844': { linux: 'a'.repeat(64) },
      },
    }),
    [],
  );
});

test('a platform-only review cannot authorize a later image change', () => {
  const errors = validateVisualBaselineParity({
    files: completeInventory,
    platformReviews: {
      'article-shell-mobile-390x844': {
        platforms: ['linux'],
        reason: 'Linux font metrics changed this baseline without changing macOS.',
        sha256: { linux: 'a'.repeat(64) },
      },
    },
    currentHashes: {
      'article-shell-mobile-390x844': { linux: 'b'.repeat(64) },
    },
  });
  assert.ok(errors.some((error) => error.includes('changed after its platform-only review')));
});

test('unrelated changed files do not trigger visual parity errors', () => {
  assert.deepEqual(
    validateVisualBaselineParity({
      files: completeInventory,
      changedFiles: ['src/components/Header.astro'],
    }),
    [],
  );
});
