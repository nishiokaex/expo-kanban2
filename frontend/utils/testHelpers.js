/**
 * Test utilities for Playwright dialog handling
 * This file provides helpers for testing alert dialogs in React Native Web
 */

/**
 * Playwright dialog handler helper
 * Use this in your Playwright tests to handle confirm dialogs
 * 
 * @param {Page} page - Playwright page object
 * @param {boolean} accept - Whether to accept (true) or dismiss (false) the dialog
 * @param {string} expectedMessage - Optional expected message to verify
 * @returns {Promise} Promise that resolves when dialog is handled
 */
export const handleConfirmDialog = async (page, accept = true, expectedMessage = null) => {
    return new Promise((resolve) => {
        page.on('dialog', async (dialog) => {
            try {
                // Verify dialog type
                if (dialog.type() !== 'confirm') {
                    throw new Error(`Expected confirm dialog, got ${dialog.type()}`)
                }

                // Verify message if provided
                if (expectedMessage && dialog.message() !== expectedMessage) {
                    throw new Error(`Expected message "${expectedMessage}", got "${dialog.message()}"`)
                }

                // Handle the dialog
                if (accept) {
                    await dialog.accept()
                } else {
                    await dialog.dismiss()
                }

                resolve({
                    type: dialog.type(),
                    message: dialog.message(),
                    accepted: accept
                })
            } catch (error) {
                console.error('Dialog handling error:', error)
                resolve({
                    error: error.message,
                    type: dialog.type(),
                    message: dialog.message(),
                    accepted: accept
                })
            }
        })
    })
}

/**
 * Test helper to simulate dialog interaction
 * This can be used in unit tests or when testing without Playwright
 * 
 * @param {boolean} result - The result to simulate (true for accept, false for dismiss)
 */
export const simulateDialogResult = (result) => {
    if (typeof window !== 'undefined' && window.__lastDialog) {
        const dialog = window.__lastDialog
        if (dialog.resolve) {
            dialog.resolve(result)
        }
        window.__lastDialog = null
    }
}

/**
 * Test helper to get the last dialog info
 * Useful for verifying dialog content in tests
 * 
 * @returns {Object|null} Last dialog info or null if no dialog
 */
export const getLastDialogInfo = () => {
    if (typeof window !== 'undefined' && window.__lastDialog) {
        return {
            type: window.__lastDialog.type,
            title: window.__lastDialog.title,
            description: window.__lastDialog.description,
            message: window.__lastDialog.message,
            options: window.__lastDialog.options
        }
    }
    return null
}

/**
 * Test helper to wait for dialog to appear
 * 
 * @param {number} timeout - Timeout in milliseconds (default: 1000)
 * @returns {Promise} Promise that resolves when dialog appears
 */
export const waitForDialog = (timeout = 1000) => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now()
        
        const checkDialog = () => {
            if (typeof window !== 'undefined' && window.__lastDialog) {
                resolve(window.__lastDialog)
            } else if (Date.now() - startTime > timeout) {
                reject(new Error('Dialog did not appear within timeout'))
            } else {
                setTimeout(checkDialog, 10)
            }
        }
        
        checkDialog()
    })
}

/**
 * Clean up dialog state (useful for test cleanup)
 */
export const cleanupDialog = () => {
    if (typeof window !== 'undefined') {
        window.__lastDialog = null
    }
}

// Example Playwright test patterns
export const playwrightExamples = {
    // Basic dialog handling
    basicExample: `
// In your Playwright test file
import { handleConfirmDialog } from './utils/testHelpers.js';

test('should handle delete confirmation', async ({ page }) => {
    // Navigate to the page
    await page.goto('http://localhost:19006');

    // Set up dialog handler before triggering the action
    const dialogPromise = handleConfirmDialog(page, true, 'ボードを削除\\n「E2Eテスト自動生成ボード」を削除しますか？');

    // Trigger the action that shows the dialog
    await page.locator('button:has-text("削除")').click();

    // Wait for dialog to be handled
    const dialogResult = await dialogPromise;
    
    // Verify the result
    expect(dialogResult.accepted).toBe(true);
    expect(dialogResult.type).toBe('confirm');
});
    `,

    // Testing both accept and dismiss
    comprehensiveExample: `
test('should handle both accept and dismiss scenarios', async ({ page }) => {
    await page.goto('http://localhost:19006');

    // Test dismiss scenario
    let dialogPromise = handleConfirmDialog(page, false);
    await page.locator('button:has-text("削除")').first().click();
    let result = await dialogPromise;
    expect(result.accepted).toBe(false);

    // Test accept scenario
    dialogPromise = handleConfirmDialog(page, true);
    await page.locator('button:has-text("削除")').first().click();
    result = await dialogPromise;
    expect(result.accepted).toBe(true);
});
    `
}