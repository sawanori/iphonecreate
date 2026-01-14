import { test, expect } from '@playwright/test';

/**
 * Viewer Screen E2E Tests
 *
 * Tests cover:
 * - AC-V-001: MP4 video playback in browser
 * - AC-V-002: Choice overlay displays at specified timing
 * - AC-V-003: Countdown timer is displayed
 * - AC-V-004: Choice selection transitions to next video
 * - AC-V-006: Responsive layout at 320px width
 * - AC-V-007: Performance test (2 seconds transition)
 */
test.describe('Viewer Screen', () => {
  test.beforeEach(async ({ page }) => {
    // Login as viewer
    await page.goto('/login');
    await page.fill('input[type="email"]', 'viewer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('AC-V-001: MP4 video is played in browser', async ({ page }) => {
    await page.goto('/watch/test-project');

    // Video player should be visible
    const videoPlayer = page.locator('.video-container');
    await expect(videoPlayer).toBeVisible();

    // Video element should be attached
    await page.waitForSelector('video', { state: 'attached' });
  });

  test('AC-V-002: Choices are displayed at specified timing', async ({
    page,
  }) => {
    await page.goto('/watch/test-project');

    // Wait for choice overlay to appear
    const choiceOverlay = page.locator('.choice-overlay');
    await expect(choiceOverlay).toBeVisible({ timeout: 30000 });

    // Two choice buttons should be displayed
    const buttons = choiceOverlay.locator('button');
    await expect(buttons).toHaveCount(2);
  });

  test('AC-V-003: Countdown timer is displayed', async ({ page }) => {
    await page.goto('/watch/test-project');

    // Wait for choice overlay to appear
    await page.waitForSelector('.choice-overlay', {
      state: 'visible',
      timeout: 30000,
    });

    // Timer should be visible
    const timer = page.locator('text=/Remaining.*seconds/');
    await expect(timer).toBeVisible();
  });

  test('AC-V-004: Selecting a choice transitions the video', async ({
    page,
  }) => {
    await page.goto('/watch/test-project');

    // Wait for choice overlay to appear
    await page.waitForSelector('.choice-overlay', {
      state: 'visible',
      timeout: 30000,
    });

    // Click the first choice
    await page.click('.choice-overlay button:first-child');

    // After transition animation, choice overlay should disappear
    await page.waitForTimeout(1000);
    await expect(page.locator('.choice-overlay')).not.toBeVisible();
  });

  test('AC-V-006: Choices are stacked vertically at 320px width', async ({
    page,
  }) => {
    // Set viewport to 320px
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/watch/test-project');

    // Wait for choice overlay to appear
    await page.waitForSelector('.choice-overlay', {
      state: 'visible',
      timeout: 30000,
    });

    // Check button layout
    const buttons = page.locator('.choice-overlay button');
    const firstButton = buttons.first();
    const secondButton = buttons.last();

    const firstBox = await firstButton.boundingBox();
    const secondBox = await secondButton.boundingBox();

    // Vertically stacked (Y coordinate differs)
    expect(firstBox!.y).toBeLessThan(secondBox!.y);
  });
});

test.describe('Performance', () => {
  test('AC-V-007: Transition to next video within 2 seconds after selection', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'viewer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    await page.goto('/watch/test-project');

    // Wait for choice overlay to appear
    await page.waitForSelector('.choice-overlay', {
      state: 'visible',
      timeout: 30000,
    });

    const startTime = Date.now();

    // Click choice
    await page.click('.choice-overlay button:first-child');

    // Wait for transition to complete
    await page.waitForSelector('.choice-overlay', { state: 'hidden' });

    const duration = Date.now() - startTime;

    // Should complete within 2 seconds
    expect(duration).toBeLessThan(2000);
  });
});
