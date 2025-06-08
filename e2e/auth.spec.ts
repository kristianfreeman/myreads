import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display home page with sign up and sign in buttons', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText('Welcome to MyReads')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Get Started' }).click();
    
    await expect(page).toHaveURL('/auth/signup');
    await expect(page.getByText('Create your account')).toBeVisible();
  });

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Sign In' }).click();
    
    await expect(page).toHaveURL('/auth/signin');
    await expect(page.getByText('Sign in to your account')).toBeVisible();
  });

  test('should sign up a new user', async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      email: `test${timestamp}@example.com`,
      username: `testuser${timestamp}`,
      password: 'testpassword123',
    };

    await page.goto('/auth/signup');
    
    await page.getByPlaceholder('Email address').fill(testUser.email);
    await page.getByPlaceholder('Username').fill(testUser.username);
    await page.getByPlaceholder('Password').fill(testUser.password);
    
    await page.getByRole('button', { name: 'Sign up' }).click();
    
    // Should redirect to dashboard after successful signup
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(`Hi, ${testUser.username}!`)).toBeVisible();
  });

  test('should sign in an existing user', async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      email: `test${timestamp}@example.com`,
      username: `testuser${timestamp}`,
      password: 'testpassword123',
    };

    // First sign up
    await page.goto('/auth/signup');
    await page.getByPlaceholder('Email address').fill(testUser.email);
    await page.getByPlaceholder('Username').fill(testUser.username);
    await page.getByPlaceholder('Password').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign up' }).click();
    
    // Sign out
    await page.getByRole('button', { name: 'Sign out' }).click();
    
    // Sign in
    await page.goto('/auth/signin');
    await page.getByPlaceholder('Username').fill(testUser.username);
    await page.getByPlaceholder('Password').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(`Hi, ${testUser.username}!`)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');
    
    await page.getByPlaceholder('Username').fill('nonexistentuser');
    await page.getByPlaceholder('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    await expect(page.getByText('Invalid username or password')).toBeVisible();
  });

  test('should sign out user', async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      email: `test${timestamp}@example.com`,
      username: `testuser${timestamp}`,
      password: 'testpassword123',
    };

    // Sign up and sign in
    await page.goto('/auth/signup');
    await page.getByPlaceholder('Email address').fill(testUser.email);
    await page.getByPlaceholder('Username').fill(testUser.username);
    await page.getByPlaceholder('Password').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign up' }).click();
    
    await expect(page).toHaveURL('/dashboard');
    
    // Sign out
    await page.getByRole('button', { name: 'Sign out' }).click();
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Welcome to MyReads')).toBeVisible();
  });
});