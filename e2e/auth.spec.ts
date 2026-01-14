import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 *
 * Tests cover:
 * - AC-AUTH-001: Email/password login
 * - AC-AUTH-002: Admin access to dashboard
 * - AC-AUTH-003: Viewer cannot access admin pages
 * - Validation errors
 * - Login failure handling
 */
test.describe('Authentication', () => {
  test('AC-AUTH-001: Can login with email and password', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // After successful login, redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('Validation errors are displayed', async ({ page }) => {
    await page.goto('/login');

    // Submit with empty form
    await page.click('button[type="submit"]');

    // Error message should be visible
    await expect(
      page.locator('text=Please enter your email address')
    ).toBeVisible();
  });

  test('Login failure displays error message', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Error message should be visible
    await expect(page.locator('text=Incorrect credentials')).toBeVisible();
  });

  test('AC-AUTH-002: Admin can access dashboard', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/dashboard');

    // Dashboard should be accessible
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('AC-AUTH-003: Viewer cannot access admin pages', async ({ page }) => {
    // Login as viewer
    await page.goto('/login');
    await page.fill('input[type="email"]', 'viewer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Attempt to access admin dashboard
    await page.goto('/dashboard');

    // Should redirect to unauthorized page
    await expect(page).toHaveURL('/unauthorized');
  });
});
