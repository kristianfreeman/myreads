import { test, expect } from '@playwright/test';

test.describe('Book Management - Simple Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Unlock the application
    await page.goto('/unlock');
    await page.getByPlaceholder('Enter password').fill('password');
    await page.getByRole('button', { name: 'Unlock' }).click();
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to search page', async ({ page }) => {
    await page.goto('/books/search');
    
    await expect(page.getByRole('heading', { name: 'Search Books' })).toBeVisible();
    await expect(page.getByPlaceholder('Search by title, author, or ISBN...')).toBeVisible();
  });

  test('should navigate to books page', async ({ page }) => {
    await page.goto('/books');
    
    await expect(page.getByRole('heading', { name: 'My Books' })).toBeVisible();
    
    // Check for status filters
    await expect(page.getByText('All Books')).toBeVisible();
    await expect(page.locator('a[href="/books?status=want_to_read"]')).toBeVisible();
    await expect(page.locator('a[href="/books?status=reading"]')).toBeVisible();
    await expect(page.locator('a[href="/books?status=read"]')).toBeVisible();
  });

  test('should show empty state when no books', async ({ page }) => {
    await page.goto('/books');
    
    // Should show empty state message or some books
    const hasBooks = await page.locator('.grid').count() > 0;
    if (!hasBooks) {
      await expect(page.getByText('Your library is empty')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Search for Books' })).toBeVisible();
    }
  });

  test('should navigate between pages using nav links', async ({ page }) => {
    // Start at dashboard
    await expect(page.getByText('My Reading Dashboard')).toBeVisible();
    
    // Navigate to Search Books
    await page.getByRole('link', { name: 'Search Books' }).click();
    await expect(page).toHaveURL('/books/search');
    
    // Navigate to My Books
    await page.getByRole('link', { name: 'My Books' }).click();
    await expect(page).toHaveURL('/books');
    
    // Navigate back to Dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should lock the application', async ({ page }) => {
    // Click the Lock button
    await page.getByRole('button', { name: 'Lock' }).click();
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Welcome to MyReads')).toBeVisible();
  });
});