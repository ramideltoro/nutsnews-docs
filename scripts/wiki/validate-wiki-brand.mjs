import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const cssPath = path.join(repoRoot, 'src', 'styles', 'wiki.css');
const logoPath = path.join(repoRoot, 'src', 'assets', 'nutsnews-logo.png');
const astroConfigPath = path.join(repoRoot, 'astro.config.mjs');
const approvedLogoSha256 = 'ca9e0164b281cc8d00a5ad97357f6e53c8bfcacfce633dd6edfe44bcc0f11fcd';

const requiredTokens = [
  'wiki-espresso-950',
  'wiki-amber-300',
  'wiki-cream-50',
  'wiki-color-focus',
  'wiki-diagram-background',
  'wiki-diagram-surface',
  'wiki-diagram-border',
  'wiki-diagram-edge',
  'wiki-diagram-text',
  'wiki-space-1',
  'wiki-space-8',
  'wiki-font-sans',
  'wiki-font-display',
  'wiki-font-code',
  'wiki-rail-width',
  'wiki-content-width',
  'wiki-content-gutter',
  'wiki-breakpoint-sm',
  'wiki-breakpoint-md',
  'wiki-breakpoint-lg',
  'wiki-touch-target',
];

function hexToRgb(hex) {
  return hex
    .slice(1)
    .match(/../g)
    .map((channel) => Number.parseInt(channel, 16) / 255);
}

function relativeLuminance(hex) {
  const channels = hexToRgb(hex).map(
    (channel) => channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrastRatio(foreground, background) {
  const luminances = [relativeLuminance(foreground), relativeLuminance(background)]
    .sort((left, right) => right - left);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}

function hexToken(css, token) {
  const match = css.match(new RegExp(`--${token}:\\s*(#[0-9a-f]{6})`, 'i'));
  assert.ok(match, `missing hex color token --${token}`);
  return match[1];
}

async function run() {
  const [css, logo, astroConfig] = await Promise.all([
    fs.readFile(cssPath, 'utf8'),
    fs.readFile(logoPath),
    fs.readFile(astroConfigPath, 'utf8'),
  ]);

  const logoHash = createHash('sha256').update(logo).digest('hex');
  assert.equal(logoHash, approvedLogoSha256, 'wiki logo must match the approved NutsNews asset');
  assert.match(astroConfig, /src:\s*['"]\.\/src\/assets\/nutsnews-logo\.png['"]/);
  assert.match(astroConfig, /alt:\s*['"]NutsNews chestnut logo['"]/);
  assert.match(astroConfig, /customCss:\s*\[['"]\.\/src\/styles\/wiki\.css['"]\]/);

  for (const token of requiredTokens) {
    assert.match(css, new RegExp(`--${token}:`), `missing design token --${token}`);
  }

  assert.match(css, /--sl-sidebar-width:\s*var\(--wiki-rail-width\)/);
  assert.match(css, /--sl-content-width:\s*var\(--wiki-content-width\)/);
  assert.match(css, /--sl-font:\s*var\(--wiki-font-sans\)/);
  assert.match(css, /outline:\s*var\(--wiki-focus-ring-width\).*var\(--wiki-color-focus\)/);
  assert.ok(
    (css.match(/var\(--wiki-/g) || []).length >= 50,
    'shared tokens must be consumed throughout the Starlight theme',
  );

  assert.doesNotMatch(css, /@import|url\(\s*['"]?https?:|fonts\.(?:googleapis|gstatic)|use\.typekit/i);
  assert.doesNotMatch(astroConfig, /adapter:|analytics:|fonts\.(?:googleapis|gstatic)|use\.typekit/i);

  const pairs = [
    {
      label: 'dark interactive text',
      foreground: hexToken(css, 'wiki-amber-200'),
      background: hexToken(css, 'wiki-espresso-950'),
      minimum: 4.5,
    },
    {
      label: 'dark control text',
      foreground: hexToken(css, 'wiki-espresso-900'),
      background: hexToken(css, 'wiki-amber-300'),
      minimum: 4.5,
    },
    {
      label: 'light interactive text',
      foreground: hexToken(css, 'wiki-amber-800'),
      background: hexToken(css, 'wiki-cream-50'),
      minimum: 4.5,
    },
    {
      label: 'light control text',
      foreground: hexToken(css, 'wiki-cream-50'),
      background: hexToken(css, 'wiki-amber-700'),
      minimum: 4.5,
    },
    {
      label: 'dark focus indicator',
      foreground: hexToken(css, 'wiki-focus-on-dark'),
      background: hexToken(css, 'wiki-espresso-950'),
      minimum: 3,
    },
    {
      label: 'light focus indicator',
      foreground: hexToken(css, 'wiki-focus-on-light'),
      background: hexToken(css, 'wiki-cream-50'),
      minimum: 3,
    },
  ];

  const results = pairs.map((pair) => {
    const ratio = contrastRatio(pair.foreground, pair.background);
    assert.ok(
      ratio >= pair.minimum,
      `${pair.label} contrast ${ratio.toFixed(2)} is below ${pair.minimum}:1`,
    );
    return `${pair.label}=${ratio.toFixed(2)}:1`;
  });

  console.log(
    `Wiki brand validation passed: approved logo ${logoHash.slice(0, 12)}, `
      + `${requiredTokens.length} required token families, ${results.join(', ')}; `
      + 'system/local fonts only.',
  );
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
