import { expect, test } from '@playwright/test'

test('the home page renders and says the lid is coming', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText(/lid/i)
})
