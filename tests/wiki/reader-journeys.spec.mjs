import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { wikiContract } from '../../scripts/wiki/wiki-contract.mjs';

const articlePath = '/simple/project/';
const nestedArticlePath = '/simple/archive/nutsnews-app-store-privacy-policy-update-readme/';
const screenshotStyle = new URL('./visual-stability.css', import.meta.url).pathname;

function seriousOrCritical(violations) {
  return violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
}

async function assertNoSeriousAxeIssues(page, include) {
  let builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  if (include) builder = builder.include(include);
  const results = await builder.analyze();
  expect(seriousOrCritical(results.violations)).toEqual([]);
}

async function assertNoViewportOverflow(page) {
  const result = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const overflow = document.documentElement.scrollWidth - viewportWidth;
    const offenders = overflow <= 1 ? [] : [...document.querySelectorAll('body *')]
      .filter((element) => {
        const style = getComputedStyle(element);
        if (style.position === 'fixed' || style.position === 'absolute') return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > viewportWidth + 1);
      })
      .slice(0, 8)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: `${element.className || ''}`.slice(0, 80),
      }));
    return { overflow, offenders };
  });
  expect(result, JSON.stringify(result)).toEqual({ overflow: 0, offenders: [] });
}

async function openMobileDrawer(page) {
  const menu = page.getByRole('button', { name: 'Menu' });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('body')).toHaveAttribute('data-mobile-menu-expanded', '');
  return menu;
}

test.beforeEach(async ({ page }) => {
  await page.goto(articlePath);
  await expect(page.locator('main')).toBeVisible();
});

test('navigation, drawer, History, audience toggle, and edit link journey', async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name.startsWith('mobile');
  if (mobile) {
    const menu = await openMobileDrawer(page);
    await page.keyboard.press('Escape');
    await expect(menu).toBeFocused();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await openMobileDrawer(page);
  }

  const overview = page.locator('[data-collection="overview"]');
  await expect(overview).toBeVisible();
  await expect(overview).toHaveAttribute('href', /\/simple\/collections\/overview\/$/);

  const historyGroup = page.locator('[data-history-group]').first();
  await expect(historyGroup).toBeVisible();
  await historyGroup.locator('summary').click();
  await expect(historyGroup).toHaveAttribute('open', '');

  if (mobile) {
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused();
  }

  const technical = page.getByRole('link', { name: 'Technical audience' });
  await expect(technical).toHaveAttribute('href', /\/technical\/project\/?$/);
  await technical.click();
  await expect(page).toHaveURL(/\/technical\/project\/?$/);
  await expect(page.getByRole('link', { name: 'Technical audience' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect.poll(() => page.evaluate(
    (key) => localStorage.getItem(key),
    wikiContract.route.resolver.preferenceKey,
  )).toBe('technical');

  const edit = page.locator('[data-edit-source]');
  await edit.scrollIntoViewIfNeeded();
  await expect(edit).toHaveAttribute(
    'href',
    'https://github.com/ramideltoro/nutsnews-docs/edit/main/PROJECT.md',
  );
  await assertNoViewportOverflow(page);
});

test('search keyboard journey filters current audience and restores focus', async ({ page }) => {
  const open = page.locator('button[data-open-modal]');
  await expect(open).toBeEnabled();
  await open.focus();
  await page.keyboard.press('Control+K');
  const dialog = page.locator('audience-search dialog');
  await expect(dialog).toBeVisible();
  const input = dialog.locator('.pagefind-ui__search-input');
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();
  await input.fill('deployment');
  await expect(dialog.locator('.pagefind-ui__result').first()).toBeVisible();
  await expect(dialog.locator('[data-include-history]')).not.toBeChecked();
  await dialog.locator('[data-include-history]').check();
  await expect(dialog.locator('[data-search-status]')).toContainText('includes History');
  await assertNoSeriousAxeIssues(page, 'audience-search dialog');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(open).toBeFocused();
});

test('diagram render, zoom, fullscreen, and focus restoration journey', async ({ page }) => {
  const render = page.locator('[data-render-diagram]');
  await render.scrollIntoViewIfNeeded();
  await expect(render).toBeEnabled();
  await render.click();
  await expect(page.locator('[data-wiki-diagram-stage] svg')).toBeVisible();
  const controls = page.locator('[data-diagram-controls]');
  await expect(controls).toBeVisible();
  await controls.getByRole('button', { name: 'Zoom diagram in' }).click();
  await expect(page.locator('[data-diagram-status]')).toContainText('125%');

  const fullscreen = controls.getByRole('button', { name: 'View fullscreen' });
  await fullscreen.click();
  const dialog = page.locator('[data-diagram-dialog]');
  await expect(dialog).toBeVisible();
  const close = dialog.getByRole('button', { name: 'Close fullscreen diagram' });
  await expect(close).toBeFocused();
  await close.click();
  await expect(dialog).not.toBeVisible();
  await expect(fullscreen).toBeFocused();
  await assertNoViewportOverflow(page);
});

test('axe, overflow, nested route, and 404 recovery remain clean', async ({ page }) => {
  await assertNoSeriousAxeIssues(page);
  await assertNoViewportOverflow(page);

  await page.goto(nestedArticlePath);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Technical audience' })).toHaveAttribute(
    'href',
    /\/technical\/archive\/nutsnews-app-store-privacy-policy-update-readme\/?$/,
  );
  await assertNoViewportOverflow(page);

  const response = await page.goto('/definitely-not-a-wiki-page/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('[data-not-found-page]')).toBeVisible();
  await expect(page.locator('[data-recovery-audience="simple"]')).toHaveAttribute(
    'href',
    '/simple/',
  );
  await expect(page.locator('[data-recovery-audience="technical"]')).toHaveAttribute(
    'href',
    '/technical/',
  );
  await assertNoSeriousAxeIssues(page);
  await assertNoViewportOverflow(page);
});

test('selected article and search designs match responsive baselines', async ({
  page,
}) => {
  await page.addStyleTag({ path: screenshotStyle });
  await expect(page).toHaveScreenshot('article-shell.png', {
    fullPage: false,
  });

  await page.locator('button[data-open-modal]').click();
  const dialog = page.locator('audience-search dialog');
  await expect(dialog.locator('.pagefind-ui__search-input')).toBeVisible();
  await expect(page).toHaveScreenshot('search-dialog.png', {
    fullPage: false,
  });
});
