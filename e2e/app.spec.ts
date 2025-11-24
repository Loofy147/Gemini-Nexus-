
import { test, expect } from '@playwright/test';

test('Swarm execution flow displays results correctly', async ({ page }) => {
  try {
    // 1. Mock the /api/swarm endpoint
    // This prevents the test from hitting the real server and failing on network errors
    await page.route('**/api/swarm', async route => {
      console.log('Intercepted /api/swarm request');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          output: "Mocked Swarm Result: Optimization Complete.",
          orchestratorStats: { capabilityPerformance: [] },
          cortexStats: { totalExperiences: 0, successRate: 0, avgQuality: 0 }
        }),
      });
    });

    // 2. Mock the /api/chat endpoint (Pre-emptive fix)
    await page.route('**/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ response: "Mocked AI response" })
      });
    });

    // 3. Execute Test Steps
    await page.goto('http://localhost:3000');

    // Use a more specific locator for the textarea
    await page.getByPlaceholder("Enter mission directive...").fill("Test Mission");

    // Use the correct button text
    await page.click('button:has-text("IGNITE")');

    // 4. Assertions
    // Wait for the mocked result to appear in the UI
    await expect(page.locator('text=Mocked Swarm Result: Optimization Complete.')).toBeVisible();
  } catch (error) {
    await page.screenshot({ path: '/home/jules/verification/error.png' });
    throw error;
  }
});
