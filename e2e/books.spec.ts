import { test, expect } from '@playwright/test';

test.describe('Book Management', () => {
  test.beforeEach(async ({ page }) => {
    // Unlock the application
    await page.goto('/unlock');
    await page.getByPlaceholder('Enter password').fill('password');
    await page.getByRole('button', { name: 'Unlock' }).click();
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('should search for books', async ({ page }) => {
    await page.goto('/books/search');
    
    await expect(page.getByRole('heading', { name: 'Search Books' })).toBeVisible();
    
    // Search for a popular book
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill('Harry Potter');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Should display search results
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Harry Potter/ }).first()).toBeVisible();
  });

  test('should add a book to reading list', async ({ page }) => {
    await page.goto('/books/search');
    
    // Search for a book
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill('Lord of the Rings');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Wait for results and add first book to "Want to Read"
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Want to Read' }).first().click();
    
    // Navigate to My Books
    await page.goto('/books');
    
    // Should see the book in the library
    await expect(page.getByRole('heading', { name: /Lord of the Rings/ }).first()).toBeVisible();
    await expect(page.locator('text=Want to Read').first()).toBeVisible();
  });

  test('should view book details', async ({ page }) => {
    // First add a book
    await page.goto('/books/search');
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill('1984');
    await page.getByRole('button', { name: 'Search' }).click();
    
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Reading' }).first().click();
    
    // Wait for book to be added
    await page.waitForTimeout(1000);
    
    // Go to My Books and click on the book
    await page.goto('/books');
    await expect(page.getByRole('heading', { name: /1984/ }).first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('heading', { name: /1984/ }).first().click();
    
    // Wait for navigation to book detail page
    await page.waitForURL(/\/books\/[^/]+$/, { timeout: 10000 });
    
    // Should be on book detail page
    await expect(page.getByText('Your Reading Info')).toBeVisible();
    await expect(page.getByText('Status:')).toBeVisible();
    await expect(page.getByText('Currently Reading')).toBeVisible();
  });

  test('should update book status and rating', async ({ page }) => {
    // Add a book first
    await page.goto('/books/search');
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill('The Great Gatsby');
    await page.getByRole('button', { name: 'Search' }).click();
    
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Reading' }).first().click();
    
    // Wait for book to be added
    await page.waitForTimeout(1000);
    
    // Go to book details
    await page.goto('/books');
    await expect(page.getByRole('heading', { name: /The Great Gatsby/ }).first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('heading', { name: /The Great Gatsby/ }).first().click();
    
    // Wait for navigation to book detail page
    await page.waitForURL(/\/books\/[^/]+$/, { timeout: 10000 });
    
    // Edit the book
    await page.getByRole('button', { name: 'Edit' }).click();
    
    // Update status to "Read"
    await page.selectOption('select[name="status"]', 'read');
    
    // Add a rating
    await page.selectOption('select[name="rating"]', '5');
    
    // Add a review
    await page.fill('textarea[name="review"]', 'An amazing classic that explores the American Dream!');
    
    // Save changes
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    // Wait for save to complete
    await page.waitForTimeout(1000);
    
    // Verify updates
    await expect(page.getByText('Status: Read')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('★★★★★')).toBeVisible();
    await expect(page.getByText('An amazing classic that explores the American Dream!')).toBeVisible();
  });

  test('should filter books by status', async ({ page }) => {
    // Add books with different statuses
    await page.goto('/books/search');
    
    // Add first book as "Want to Read"
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill('Python');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Want to Read' }).first().click();
    
    // Wait for first book to be added
    await page.waitForTimeout(1000);
    
    // Add second book as "Reading"
    await page.getByPlaceholder('Search by title, author, or ISBN...').clear();
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill('JavaScript');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Reading' }).first().click();
    
    // Wait for second book to be added
    await page.waitForTimeout(1000);
    
    // Go to My Books
    await page.goto('/books');
    
    // Wait for books to be loaded
    await expect(page.getByRole('heading', { name: /Python|JavaScript/ }).first()).toBeVisible({ timeout: 10000 });
    
    // Filter by "Currently Reading"
    await page.locator('a[href="/books?status=reading"]').first().click();
    await expect(page).toHaveURL('/books?status=reading');
    
    // Should only see JavaScript book
    await expect(page.getByRole('heading', { name: /JavaScript/ }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Python/ })).not.toBeVisible();
    
    // Filter by "Want to Read"
    await page.locator('a[href="/books?status=want_to_read"]').first().click();
    await expect(page).toHaveURL('/books?status=want_to_read');
    
    // Should only see Python book
    await expect(page.getByRole('heading', { name: /Python/ }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /JavaScript/ })).not.toBeVisible();
  });

  test('should remove book from library', async ({ page }) => {
    // Add a book
    await page.goto('/books/search');
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill('Test Book');
    await page.getByRole('button', { name: 'Search' }).click();
    
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Want to Read' }).first().click();
    
    // Wait for book to be added
    await page.waitForTimeout(1000);
    
    // Go to book details
    await page.goto('/books');
    await expect(page.getByRole('heading', { name: /Test Book/ }).first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('heading', { name: /Test Book/ }).first().click();
    
    // Wait for navigation to book detail page
    await page.waitForURL(/\/books\/[^/]+$/, { timeout: 10000 });
    
    // Remove from library
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Remove from Library' }).click();
    
    // Should redirect to My Books
    await expect(page).toHaveURL('/books');
    
    // Book should no longer be visible
    await expect(page.getByRole('heading', { name: /Test Book/ })).not.toBeVisible();
  });
});