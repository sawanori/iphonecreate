import { test, expect } from '@playwright/test';

/**
 * Admin Screen E2E Tests
 *
 * Tests cover:
 * - AC-A-001: Node drag and drop
 * - AC-A-002: Node connection with edges
 * - AC-A-005: Preview flow in watch mode
 * - AC-ANALYTICS-001: Completion rate display
 * - AC-ANALYTICS-003: Viewer cannot access analytics API
 */
test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('AC-A-001: Can drag and drop nodes', async ({ page }) => {
    await page.goto('/editor/new');

    // Drag video node from toolbar
    const videoNodeButton = page.locator('text=Video Node');
    const canvas = page.locator('.react-flow');

    await videoNodeButton.dragTo(canvas);

    // Node should be added
    const nodes = page.locator('.react-flow__node');
    await expect(nodes).toHaveCount(1);
  });

  test('AC-A-002: Can connect nodes with edges', async ({ page }) => {
    await page.goto('/editor/new');

    // Add two nodes
    const videoNodeButton = page.locator('text=Video Node');
    const canvas = page.locator('.react-flow');

    await videoNodeButton.dragTo(canvas, {
      targetPosition: { x: 100, y: 100 },
    });
    await videoNodeButton.dragTo(canvas, {
      targetPosition: { x: 300, y: 100 },
    });

    // Connect nodes
    const sourceHandle = page
      .locator('.react-flow__node')
      .first()
      .locator('.react-flow__handle-bottom');
    const targetHandle = page
      .locator('.react-flow__node')
      .last()
      .locator('.react-flow__handle-top');

    await sourceHandle.dragTo(targetHandle);

    // Edge should be created
    const edges = page.locator('.react-flow__edge');
    await expect(edges).toHaveCount(1);
  });

  test('AC-A-005: Can preview video flow', async ({ page }) => {
    // Open existing project (requires test project)
    await page.goto('/editor/test-project');

    // Click preview button
    const previewButton = page.locator('text=Preview');

    // New tab opens with preview
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      previewButton.click(),
    ]);

    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('/watch/');
  });
});

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('AC-ANALYTICS-001: Overall completion rate is displayed', async ({
    page,
  }) => {
    // Completion rate card should be visible
    const completionCard = page.locator('text=Completion Rate').first();
    await expect(completionCard).toBeVisible();
  });

  test('AC-ANALYTICS-003: Viewer cannot access analytics data', async ({
    page,
  }) => {
    // Logout
    await page.click('text=Logout');

    // Login as viewer
    await page.goto('/login');
    await page.fill('input[type="email"]', 'viewer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Direct access to analytics API
    const response = await page.request.get('/api/analytics');
    expect(response.status()).toBe(403);
  });
});

test.describe('Progress Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('AC-P-001: User progress is saved', async ({ page }) => {
    // Navigate to progress page
    await page.goto('/progress');

    // Progress card should be visible
    const progressCard = page.locator('[data-testid="progress-card"]');
    await expect(progressCard).toBeVisible();
  });

  test('AC-P-002: Progress API returns correct data', async ({ page }) => {
    // Access progress API
    const response = await page.request.get('/api/progress');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('progress');
  });
});
