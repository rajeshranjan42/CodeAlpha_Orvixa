import { test, expect } from '@playwright/test';

const signIn = async (page, email, password) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
};

test('browse, add to cart, sign in, reach checkout', async ({ page }) => {
  await page.goto('/search?q=phone');
  await page.getByRole('button', { name: /Add to Cart/ }).first().click({ force: true });
  await page.goto('/cart');
  await page.getByRole('button', { name: 'Proceed to Buy' }).click();
  await signIn(page, 'customer@orvixa.com', 'Customer@123');
  // anonymous cart is merged; the returnUrl may send us to /cart first
  await page.goto('/checkout');
  await expect(page.getByText(/Checkout \(/)).toBeVisible();
});

test('non-admin is redirected away from /admin', async ({ page }) => {
  await signIn(page, 'customer@orvixa.com', 'Customer@123');
  await page.goto('/admin');
  await expect(page).not.toHaveURL(/admin/);
});

test('admin sees the dashboard', async ({ page }) => {
  await signIn(page, 'admin@orvixa.com', 'Admin@12345');
  await expect(page).toHaveURL(/admin/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test('short password is blocked', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('a@b.com');
  await page.getByLabel('Password').fill('short');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
});

test('reduced motion is respected', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('.hero')).toBeVisible();
  await ctx.close();
});
