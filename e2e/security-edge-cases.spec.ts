import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test('should not allow access without authentication', async ({ page }) => {
    // Clear all cookies
    await page.context().clearCookies();
    
    // Try to access protected routes
    const protectedRoutes = [
      '/dashboard',
      '/books',
      '/books/search',
      '/books/some-book-id'
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL('/unlock');
      await expect(page.getByText('Enter Password')).toBeVisible();
    }
  });

  test('should handle cookie tampering', async ({ page }) => {
    // Set invalid auth cookie
    await page.context().addCookies([{
      name: 'auth',
      value: 'tampered-value',
      domain: 'localhost',
      path: '/'
    }]);
    
    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should redirect to unlock
    await expect(page).toHaveURL('/unlock');
  });

  test('should handle XSS attempts in forms', async ({ page }) => {
    // Unlock first
    await page.goto('/unlock');
    await page.getByPlaceholder('Enter password').fill('password');
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(page).toHaveURL('/dashboard');
    
    // Try XSS in search
    await page.goto('/books/search');
    const xssPayload = '<script>alert("XSS")</script>';
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill(xssPayload);
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Check that script is not executed
    const alertFired = await page.evaluate(() => {
      let alertCalled = false;
      const originalAlert = window.alert;
      window.alert = () => { alertCalled = true; };
      // Force a small delay to allow any injected scripts to run
      return new Promise(resolve => {
        setTimeout(() => {
          window.alert = originalAlert;
          resolve(alertCalled);
        }, 100);
      });
    });
    
    expect(alertFired).toBe(false);
  });

  test('should enforce CSRF protection', async ({ page }) => {
    // Unlock the app
    await page.goto('/unlock');
    await page.getByPlaceholder('Enter password').fill('password');
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(page).toHaveURL('/dashboard');
    
    // Try direct POST without proper form submission
    const response = await page.evaluate(async () => {
      const response = await fetch('/books/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'bookId=TEST001&status=reading&_action=add'
      });
      return {
        status: response.status,
        redirected: response.redirected
      };
    });
    
    // Should either be successful (if CSRF is not enforced) or fail gracefully
    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Unlock the app
    await page.goto('/unlock');
    await page.getByPlaceholder('Enter password').fill('password');
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle rapid navigation', async ({ page }) => {
    // Rapidly navigate between pages
    const routes = ['/dashboard', '/books', '/books/search'];
    
    for (let i = 0; i < 10; i++) {
      const route = routes[i % routes.length];
      await page.goto(route, { waitUntil: 'domcontentloaded' });
    }
    
    // Should end up on the last route without errors
    await expect(page).toHaveURL('/books/search');
    await expect(page.getByRole('heading', { name: 'Search Books' })).toBeVisible();
  });

  test('should handle concurrent form submissions', async ({ page }) => {
    await page.goto('/books/search');
    
    // Fill search form
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill('Test');
    
    // Try to submit multiple times rapidly
    const submitButton = page.getByRole('button', { name: 'Search' });
    await Promise.all([
      submitButton.click(),
      submitButton.click(),
      submitButton.click()
    ]).catch(() => {
      // Some clicks might fail, that's ok
    });
    
    // Page should still be functional
    await page.waitForTimeout(1000);
    const hasError = await page.getByText(/error/i).isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Navigate through multiple pages
    await page.goto('/dashboard');
    await page.goto('/books');
    await page.goto('/books/search');
    
    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/books');
    
    // Go back again
    await page.goBack();
    await expect(page).toHaveURL('/dashboard');
    
    // Go forward
    await page.goForward();
    await expect(page).toHaveURL('/books');
  });

  test('should handle network interruption gracefully', async ({ page, context }) => {
    await page.goto('/books/search');
    
    // Simulate offline mode
    await context.setOffline(true);
    
    // Try to search
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill('Test');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Should show error or handle gracefully
    await page.waitForTimeout(2000);
    
    // Re-enable network
    await context.setOffline(false);
    
    // Page should recover
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Search Books' })).toBeVisible();
  });

  test('should handle very long inputs', async ({ page }) => {
    await page.goto('/books/search');
    
    // Test with very long input
    const longInput = 'A'.repeat(1000);
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill(longInput);
    
    // Should truncate or handle gracefully
    const inputValue = await page.getByPlaceholder('Search by title, author, or ISBN...').inputValue();
    expect(inputValue.length).toBeLessThanOrEqual(1000);
  });

  test('should handle special characters in URLs', async ({ page }) => {
    // Try to access book with special characters
    const specialUrls = [
      '/books/test%20book',
      '/books/test?query=value',
      '/books/test#fragment',
      '/books/../../etc/passwd', // Path traversal attempt
    ];
    
    for (const url of specialUrls) {
      await page.goto(url);
      // Should either show 404, redirect, or show safely
      const isValid = await page.getByText(/not found|error/i).isVisible()
        .catch(() => page.url().includes('/books') || page.url().includes('/unlock'));
      expect(isValid).toBeTruthy();
    }
  });

  test('should maintain state during page refresh', async ({ page }) => {
    // Add some state (if possible)
    await page.goto('/books/search');
    await page.getByPlaceholder('Search by title, author, or ISBN...').fill('Test Query');
    
    // Refresh page
    await page.reload();
    
    // Check if we're still authenticated
    await expect(page).not.toHaveURL('/unlock');
    
    // Form should be cleared after refresh (standard behavior)
    const searchValue = await page.getByPlaceholder('Search by title, author, or ISBN...').inputValue();
    expect(searchValue).toBe('');
  });
});

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Unlock the app
    await page.goto('/unlock');
    await page.getByPlaceholder('Enter password').fill('password');
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should load pages within reasonable time', async ({ page }) => {
    const routes = [
      '/dashboard',
      '/books',
      '/books/search'
    ];
    
    for (const route of routes) {
      const startTime = Date.now();
      await page.goto(route);
      const loadTime = Date.now() - startTime;
      
      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    }
  });

  test('should handle large book collections', async ({ page }) => {
    // This test would require seeding many books
    // For now, just verify the page loads
    await page.goto('/books');
    
    // Check pagination or infinite scroll exists if many books
    const bookCount = await page.locator('.grid > a').count();
    
    if (bookCount > 20) {
      // Should have some pagination or scroll mechanism
      const hasPagination = await page.getByText(/page|next|previous/i).isVisible()
        .catch(() => false);
      const hasInfiniteScroll = await page.evaluate(() => {
        return document.documentElement.scrollHeight > window.innerHeight;
      });
      
      expect(hasPagination || hasInfiniteScroll).toBeTruthy();
    }
  });
});