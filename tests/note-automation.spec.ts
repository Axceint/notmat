import { test, expect } from '@playwright/test';

test.describe('Note Automation E2E', () => {
  test('should sign in, create note, and view result', async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/auth/signin');

    // Sign in with test credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Note Automation System');

    // Navigate to create note page
    await page.click('text=Create New Note');
    await expect(page).toHaveURL('/note/new');

    // Fill in note
    const sampleNote = `Project meeting notes:
- Need to implement user authentication
- Database migration should be done by Friday
- Frontend redesign is priority for next sprint
- Backend API optimization can wait
Budget concerns were mentioned but team size is adequate`;

    await page.fill('textarea', sampleNote);

    // Set options
    await page.selectOption('select[id="tone"]', 'professional');
    await page.selectOption('select[id="formatting"]', 'moderate');

    // Submit note
    await page.click('button[type="submit"]');

    // Wait for processing (should redirect to note view page)
    await page.waitForURL(/\/note\/[a-f0-9-]+/, { timeout: 30000 });

    // Wait for processing to complete
    await page.waitForSelector('h1', { timeout: 30000 });

    // Verify structure is displayed
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('user authentication');

    // Test export functionality
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Markdown');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/note-.*\.markdown/);

    // Return to dashboard
    await page.click('text=Back to Dashboard');
    await expect(page).toHaveURL('/');

    // Verify note appears in list
    await expect(page.locator('text=Project meeting notes')).toBeVisible();
  });

  test('should display settings and update preferences', async ({ page }) => {
    // Sign in
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Navigate to settings
    await page.click('[title="Settings"]');
    await expect(page).toHaveURL('/settings');

    // Update settings
    await page.selectOption('text=Default Tone', 'formal');
    await page.click('text=Save Settings');

    // Verify redirect back to dashboard
    await expect(page).toHaveURL('/');
  });
});
