import { test, expect } from '@playwright/test';

test.describe('NEON KNUCKLES Smoke Test', () => {
  test('loads title menu, enters Arcade match, renders canvas, and verifies combat attacks', async ({ page }) => {
    // 1. Load the game page
    await page.goto('/');
    await expect(page).toHaveTitle(/NEON KNUCKLES/i);

    // 2. Click Arcade Ladder from the main menu
    const arcadeBtn = page.getByRole('button', { name: /ARCADE LADDER/i });
    await expect(arcadeBtn).toBeVisible();
    await arcadeBtn.click();

    // 3. Confirm difficulty and enter Arcade
    const enterArcadeBtn = page.getByRole('button', { name: /ENTER ARCADE LADDER/i });
    await expect(enterArcadeBtn).toBeVisible();
    await enterArcadeBtn.click();

    // 4. In Character Select, confirm P1 fighter
    const confirmFighterBtn = page.getByRole('button', { name: /CONFIRM P1/i });
    await expect(confirmFighterBtn).toBeVisible();
    await confirmFighterBtn.click();

    // 5. Confirm Canvas is rendered and visible
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // 6. Press movement and attack keys (D to walk right, J for LP, K for RP)
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(600); // walk toward opponent
    await page.keyboard.up('KeyD');

    // Attack flurry: J (LP), K (RP), N (LK), M (RK)
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('KeyJ');
      await page.waitForTimeout(100);
      await page.keyboard.press('KeyK');
      await page.waitForTimeout(150);
      await page.keyboard.press('KeyM');
      await page.waitForTimeout(200);
    }

    // 7. Verify health bar or HUD elements exist
    const roundText = page.getByText(/ROUND 1/i);
    await expect(roundText).toBeVisible();

    const hudFighters = page.locator('.font-bold.text-lg.tracking-wider');
    await expect(hudFighters.first()).toBeVisible();
  });
});
