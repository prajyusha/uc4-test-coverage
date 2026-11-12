const { test, expect } = require('./fixtures.cjs')

test('browse, search, sign in, and add an everyday tote to the bag', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Everyday tote' })).toBeVisible()
  await expect(page.locator('article.product')).toHaveCount(6)

  await page.getByRole('textbox', { name: 'Search products' }).fill('tote')
  await expect(page.locator('article.product')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Everyday tote' })).toBeVisible()

  await page.getByRole('button', { name: 'Log in ↗' }).click()
  await page.getByRole('textbox', { name: 'Email' }).fill('shopper@example.com')
  await page.getByLabel('Password', { exact: true }).fill('Shopper123!')
  await page.getByRole('button', { name: 'Log in →' }).click()
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()

  await page.getByRole('button', { name: 'Add to bag' }).click()
  await expect(page.getByRole('status')).toHaveText('Everyday tote added to your bag.')
  await page.getByRole('button', { name: 'Bag 1' }).click()
  await expect(page.getByRole('heading', { name: 'Your bag.' })).toBeVisible()
  await expect(page.locator('.cart-item')).toHaveCount(1)
  await expect(page.locator('.cart-item')).toContainText('Everyday tote')
  await expect(page.locator('.grand-total')).toContainText('$28.00')
})
