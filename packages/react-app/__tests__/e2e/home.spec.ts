import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads
    await expect(page).toHaveTitle(/FX-Remit/);
    
    // Check for main elements
    await expect(page.getByRole('heading', { name: /FX-Remit/i })).toBeVisible();
    await expect(page.getByText(/Cross-border remittances/i)).toBeVisible();
  });

  test('should display supported currencies', async ({ page }) => {
    await page.goto('/');
    
    // Check for currency information
    await expect(page.getByText(/USD/i)).toBeVisible();
    await expect(page.getByText(/EUR/i)).toBeVisible();
    await expect(page.getByText(/KES/i)).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check navigation links
    const sendLink = page.getByRole('link', { name: /Send/i });
    const historyLink = page.getByRole('link', { name: /History/i });
    const profileLink = page.getByRole('link', { name: /Profile/i });
    
    await expect(sendLink).toBeVisible();
    await expect(historyLink).toBeVisible();
    await expect(profileLink).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if mobile navigation works
    await expect(page.getByRole('heading', { name: /FX-Remit/i })).toBeVisible();
  });
}); 