import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display home page with unlock button', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText('Welcome to MyReads')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible();
  });

  test('should navigate to unlock page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Get Started' }).click();
    
    await expect(page).toHaveURL('/unlock');
    await expect(page.getByText('Enter Password')).toBeVisible();
  });

  test('should unlock with correct password', async ({ page }) => {
    await page.goto('/unlock');
    
    await page.getByPlaceholder('Enter password').fill('password');
    await page.getByRole('button', { name: 'Unlock' }).click();
    
    // Should redirect to dashboard after successful unlock
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('My Reading Dashboard')).toBeVisible();
  });

  test('should show error for incorrect password', async ({ page }) => {
    await page.goto('/unlock');
    
    await page.getByPlaceholder('Enter password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Unlock' }).click();
    
    await expect(page.getByText('Invalid password')).toBeVisible();
  });

  test('should lock the application', async ({ page }) => {
    // First unlock
    await page.goto('/unlock');
    await page.getByPlaceholder('Enter password').fill('password');
    await page.getByRole('button', { name: 'Unlock' }).click();
    
    await expect(page).toHaveURL('/dashboard');
    
    // Then lock
    await page.getByRole('button', { name: 'Lock' }).click();
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Welcome to MyReads')).toBeVisible();
  });

  test('should redirect to unlock when accessing protected page', async ({ page }) => {
    // Clear cookies to ensure we're not authenticated
    await page.context().clearCookies();
    
    // Try to access dashboard directly
    await page.goto('/dashboard');
    
    // Should redirect to unlock page
    await expect(page).toHaveURL('/unlock');
    await expect(page.getByText('Enter Password')).toBeVisible();
  });
});