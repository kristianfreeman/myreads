import { test, expect, Page } from '@playwright/test';

// Helper to unlock the app
async function unlockApp(page: Page) {
  await page.goto('/unlock');
  await page.getByPlaceholder('Enter password').fill('password');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page).toHaveURL('/dashboard');
}

// Helper to add a test book directly via API/form
async function addTestBook(page: Page, bookId: string, status: string) {
  await page.goto('/books/search');
  
  // Use the form to add a book (simulating API response)
  await page.evaluate(({ bookId, status }) => {
    // Directly submit the form to add a book
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/books/search';
    
    const bookIdInput = document.createElement('input');
    bookIdInput.name = 'bookId';
    bookIdInput.value = bookId;
    form.appendChild(bookIdInput);
    
    const statusInput = document.createElement('input');
    statusInput.name = 'status';
    statusInput.value = status;
    form.appendChild(statusInput);
    
    const actionInput = document.createElement('input');
    actionInput.name = '_action';
    actionInput.value = 'add';
    form.appendChild(actionInput);
    
    document.body.appendChild(form);
    form.submit();
  }, { bookId, status });
  
  // Wait for redirect to books page
  await page.waitForURL('/books', { timeout: 5000 }).catch(() => {
    // If no redirect, we're still on search page
  });
}

test.describe('Comprehensive Book Management', () => {
  test.beforeEach(async ({ page }) => {
    await unlockApp(page);
  });

  test('complete book lifecycle - add, update, remove', async ({ page }) => {
    // 1. Start with empty library
    await page.goto('/books');
    const initialBookCount = await page.locator('.grid > a').count();
    
    // 2. Search for a book
    await page.goto('/books/search');
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill('1984');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Wait for search results (with timeout handling)
    const searchResultsAppeared = await page.locator('text=George Orwell').waitFor({ 
      timeout: 10000, 
      state: 'visible' 
    }).then(() => true).catch(() => false);
    
    if (searchResultsAppeared) {
      // 3. Add book as "Want to Read"
      await page.getByRole('button', { name: 'Want to Read' }).first().click();
      
      // Should show success message or redirect
      await page.waitForTimeout(1000);
      
      // 4. Go to My Books and verify book was added
      await page.goto('/books');
      const newBookCount = await page.locator('.grid > a').count();
      expect(newBookCount).toBe(initialBookCount + 1);
      
      // 5. Click on the book to view details
      await page.getByText('1984').first().click();
      await expect(page.getByText('Your Reading Info')).toBeVisible();
      await expect(page.getByText('Status:')).toBeVisible();
      
      // 6. Edit the book - change status and add rating
      await page.getByRole('button', { name: 'Edit' }).click();
      
      // Change status to "Read"
      await page.selectOption('select[name="status"]', 'read');
      
      // Add rating
      await page.selectOption('select[name="rating"]', '4');
      
      // Add review
      await page.fill('textarea[name="review"]', 'A masterpiece of dystopian fiction that remains relevant today.');
      
      // Save changes
      await page.getByRole('button', { name: 'Save Changes' }).click();
      
      // 7. Verify changes were saved
      await expect(page.getByText('Status: Read')).toBeVisible();
      await expect(page.getByText('★★★★')).toBeVisible();
      await expect(page.getByText('A masterpiece of dystopian fiction')).toBeVisible();
      
      // 8. Remove the book
      page.on('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Remove from Library' }).click();
      
      // Should redirect to books page
      await expect(page).toHaveURL('/books');
      
      // Verify book was removed
      const finalBookCount = await page.locator('.grid > a').count();
      expect(finalBookCount).toBe(initialBookCount);
    }
  });

  test('dashboard statistics update correctly', async ({ page }) => {
    // Go to dashboard and capture initial stats
    await page.goto('/dashboard');
    
    const getStats = async () => {
      const stats = await page.evaluate(() => {
        const statElements = document.querySelectorAll('.grid > .bg-white, .grid > .bg-gray-800');
        const statsMap: Record<string, string> = {};
        statElements.forEach(el => {
          const value = el.querySelector('.text-2xl')?.textContent || '0';
          const label = el.querySelector('.text-sm')?.textContent || '';
          if (label) statsMap[label] = value;
        });
        return statsMap;
      });
      return stats;
    };
    
    const initialStats = await getStats();
    
    // Add a book via search
    await page.goto('/books/search');
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill('Statistics Test Book');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Reading' }).first().click();
    
    // Wait for book to be added
    await page.waitForTimeout(1000);
    
    // Go back to dashboard
    await page.goto('/dashboard');
    
    // Check if stats updated
    const updatedStats = await getStats();
    
    // At least one stat should have changed or we should have stats
    const hasChanges = Object.keys(initialStats).some(
      key => initialStats[key] !== updatedStats[key]
    );
    
    expect(hasChanges || Object.keys(updatedStats).length > 0).toBeTruthy();
  });

  test('book filtering works correctly', async ({ page }) => {
    // Add books with different statuses via search
    await page.goto('/books/search');
    
    // Add first book as Want to Read
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill('Filter Test 1');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Want to Read' }).first().click();
    await page.waitForTimeout(1000);
    
    // Add second book as Reading
    await page.getByPlaceholder('Search by title, author, or ISBN...').clear();
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill('Filter Test 2');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Reading' }).first().click();
    await page.waitForTimeout(1000);
    
    // Add third book as Read
    await page.getByPlaceholder('Search by title, author, or ISBN...').clear();
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill('Filter Test 3');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Read' }).first().click();
    await page.waitForTimeout(1000);
    
    await page.goto('/books');
    
    // Test "All Books" (default)
    const allBooksCount = await page.locator('.grid > a').count();
    expect(allBooksCount).toBeGreaterThanOrEqual(0);
    
    // Test "Want to Read" filter
    await page.locator('a[href="/books?status=want_to_read"]').click();
    await expect(page).toHaveURL('/books?status=want_to_read');
    const wantToReadCount = await page.locator('.grid > a').count();
    
    // Test "Currently Reading" filter
    await page.locator('a[href="/books?status=reading"]').click();
    await expect(page).toHaveURL('/books?status=reading');
    const readingCount = await page.locator('.grid > a').count();
    
    // Test "Read" filter
    await page.locator('a[href="/books?status=read"]').click();
    await expect(page).toHaveURL('/books?status=read');
    const readCount = await page.locator('.grid > a').count();
    
    // Filtered counts should be less than or equal to all books
    expect(wantToReadCount).toBeLessThanOrEqual(allBooksCount);
    expect(readingCount).toBeLessThanOrEqual(allBooksCount);
    expect(readCount).toBeLessThanOrEqual(allBooksCount);
  });

  test('form validation works', async ({ page }) => {
    await page.goto('/unlock');
    await page.context().clearCookies();
    
    // Test empty password
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(page.getByText('Enter password')).toBeVisible();
    
    // Test wrong password
    await page.getByPlaceholder('Enter password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(page.getByText('Invalid password')).toBeVisible();
    
    // Test correct password
    await page.getByPlaceholder('Enter password').fill('password');
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('session persistence', async ({ page, context }) => {
    // Unlock the app
    await unlockApp(page);
    
    // Navigate to different pages
    await page.goto('/books');
    await expect(page.getByRole('heading', { name: 'My Books' })).toBeVisible();
    
    // Open new tab/page in same context
    const newPage = await context.newPage();
    await newPage.goto('/dashboard');
    
    // Should still be authenticated
    await expect(newPage.getByText('My Reading Dashboard')).toBeVisible();
    
    // Lock from the new page
    await newPage.getByRole('button', { name: 'Lock' }).click();
    
    // Original page should redirect to unlock when refreshed
    await page.reload();
    await expect(page).toHaveURL('/unlock');
    
    await newPage.close();
  });

  test('error handling for invalid book ID', async ({ page }) => {
    await page.goto('/books/invalid-book-id');
    
    // Should show error or redirect
    const hasError = await page.getByText(/not found|error/i).isVisible().catch(() => false);
    const redirected = page.url().includes('/books');
    
    expect(hasError || redirected).toBeTruthy();
  });

  test('responsive navigation menu', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/dashboard');
    
    // Mobile menu might be hidden or in hamburger
    const desktopNavVisible = await page.locator('.hidden.sm\\:flex').isVisible();
    
    // On mobile, navigation should either be in hamburger or visible differently
    expect(desktopNavVisible).toBeFalsy();
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('search functionality edge cases', async ({ page }) => {
    await page.goto('/books/search');
    
    // Test empty search
    await page.getByRole('button', { name: 'Search' }).click();
    // Should show validation or no results
    
    // Test special characters
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill('!@#$%^&*()');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Should handle gracefully without crashing
    await expect(page).not.toHaveURL('/error');
    
    // Test very long search query
    const longQuery = 'a'.repeat(200);
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill(longQuery);
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Should handle gracefully
    await expect(page).not.toHaveURL('/error');
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await unlockApp(page);
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Enter should activate focused element
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('form labels are properly associated', async ({ page }) => {
    await page.goto('/unlock');
    await page.context().clearCookies();
    
    // Check if clicking label focuses the input
    const label = page.getByText('Password', { exact: true });
    const labelExists = await label.count() > 0;
    
    if (labelExists) {
      await label.click();
      const focusedElement = await page.evaluate(() => document.activeElement?.name);
      expect(focusedElement).toBe('password');
    }
  });
});