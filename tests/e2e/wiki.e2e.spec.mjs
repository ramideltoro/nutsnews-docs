import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const inventoryPath = path.join(process.cwd(), 'scripts/wiki/wiki-inventory.generated.json');

async function sampleRoutes() {
  const data = JSON.parse(await fs.readFile(inventoryPath, 'utf8'));
  const entry = data.entries[0];
  return {
    simple: entry.simple.route,
    technical: entry.technical.route,
  };
}

test.describe('Wiki routing and shell', () => {
  test('root defaults to the Simple audience', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/simple\//, { timeout: 8000 });
    expect(page.url()).toContain('/simple/');
  });

  test('audience switch stores preference and preserves query values', async ({ page }) => {
    const { simple: sampleSimple } = await sampleRoutes();
    await page.goto(`${sampleSimple}?check=route`);

    await page.click('a:has-text("View technical")');
    await page.waitForURL(/\/technical\//, { timeout: 8000 });

    const savedAudience = await page.evaluate(() => localStorage.getItem('nutsnews.wiki.audience'));
    expect(savedAudience).toBe('technical');

    const finalUrl = new URL(page.url());
    expect(finalUrl.pathname.startsWith('/technical/')).toBeTruthy();
    expect(finalUrl.search).toBe('?check=route');

    await page.reload();
    expect(new URL(page.url()).pathname).toBe(finalUrl.pathname);
    expect(new URL(page.url()).search).toBe('?check=route');
  });

  test('search dialog opens and exposes technical audience filtering context', async ({ page }) => {
    const { technical: sampleTechnical } = await sampleRoutes();
    await page.goto(sampleTechnical);

    await page.keyboard.press('Control+K');
    const dialog = page.locator('dialog');
    await expect(dialog).toBeVisible({ timeout: 8000 });

    const input = dialog.locator('input');
    await expect(input).toBeVisible({ timeout: 12000 });
    await input.fill('release');
    await page.waitForTimeout(500);

    const containerAudience = await page.evaluate(() => {
      const host = document.querySelector('site-search');
      return host?.getAttribute('data-wiki-audience');
    });
    expect(containerAudience).toBe('technical');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 8000 });
  });

  test('history routes are available in both audiences', async ({ page }) => {
    await page.goto('/simple/updates/');
    await expect(page.getByRole('heading', { name: /updates/i }).first()).toBeVisible({ timeout: 8000 });

    await page.goto('/technical/updates/');
    await expect(page.getByRole('heading', { name: /updates/i }).first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Wiki accessibility and controls', () => {
  test('critical pages have no critical/serious axe violations', async ({ page }) => {
    const { simple: sampleSimple } = await sampleRoutes();
    await page.goto(sampleSimple);

    const { violations } = await new AxeBuilder({ page }).analyze();
    const blocking = violations.filter((issue) => issue.impact === 'serious' || issue.impact === 'critical');
    expect(blocking).toHaveLength(0);

    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, 0));
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('keyboard journey reaches focusable shell controls', async ({ page }) => {
    const { simple: sampleSimple } = await sampleRoutes();
    await page.goto(sampleSimple);

    await page.keyboard.press('Tab');
    const active = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
    expect(['a', 'button', 'input', 'select']).toContain(active);
  });

  test('missing pages render the branded 404 route', async ({ page }) => {
    await page.goto('/simple/this-page-does-not-exist/');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible({ timeout: 8000 });
  });
});
