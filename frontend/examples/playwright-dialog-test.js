/**
 * Playwright test example for testing alert dialog functionality
 * This demonstrates how to test the enhanced alert polyfill with Playwright
 */

import { test, expect } from '@playwright/test'

test.describe('Alert Dialog Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('http://localhost:19006')
        
        // Wait for the app to load
        await page.waitForLoadState('networkidle')
    })

    test('should handle board deletion confirmation - Accept', async ({ page }) => {
        // Wait for boards to load
        await page.waitForSelector('text=ボードがありません', { state: 'hidden', timeout: 5000 })
        
        // Create a test board first (if none exists)
        await page.click('[data-testid="fab-create-board"]')
        await page.fill('input[placeholder*="ボード名"]', 'E2Eテスト自動生成ボード')
        await page.click('button:has-text("作成")')
        
        // Wait for board to be created
        await page.waitForSelector('text=E2Eテスト自動生成ボード')
        
        // Set up dialog handler before clicking delete
        const dialogPromise = new Promise(resolve => {
            page.on('dialog', async dialog => {
                expect(dialog.type()).toBe('confirm')
                expect(dialog.message()).toContain('ボードを削除')
                expect(dialog.message()).toContain('E2Eテスト自動生成ボード')
                expect(dialog.message()).toContain('を削除しますか？')
                
                // Accept the dialog
                await dialog.accept()
                resolve(true)
            })
        })
        
        // Click the delete button
        await page.click('button:has-text("削除")')
        
        // Wait for dialog to be handled
        await dialogPromise
        
        // Verify the board was deleted
        await page.waitForSelector('text=ボードがありません', { timeout: 5000 })
        await expect(page.locator('text=E2Eテスト自動生成ボード')).toBeHidden()
    })

    test('should handle board deletion confirmation - Dismiss', async ({ page }) => {
        // Wait for boards to load
        await page.waitForSelector('text=ボードがありません', { state: 'hidden', timeout: 5000 })
        
        // Create a test board first (if none exists)
        await page.click('[data-testid="fab-create-board"]')
        await page.fill('input[placeholder*="ボード名"]', 'E2Eテスト自動生成ボード')
        await page.click('button:has-text("作成")')
        
        // Wait for board to be created
        await page.waitForSelector('text=E2Eテスト自動生成ボード')
        
        // Set up dialog handler before clicking delete
        const dialogPromise = new Promise(resolve => {
            page.on('dialog', async dialog => {
                expect(dialog.type()).toBe('confirm')
                expect(dialog.message()).toContain('ボードを削除')
                expect(dialog.message()).toContain('E2Eテスト自動生成ボード')
                expect(dialog.message()).toContain('を削除しますか？')
                
                // Dismiss the dialog
                await dialog.dismiss()
                resolve(false)
            })
        })
        
        // Click the delete button
        await page.click('button:has-text("削除")')
        
        // Wait for dialog to be handled
        await dialogPromise
        
        // Verify the board was NOT deleted
        await expect(page.locator('text=E2Eテスト自動生成ボード')).toBeVisible()
    })

    test('should handle multiple dialogs in sequence', async ({ page }) => {
        // Create multiple test boards
        const boardNames = ['テストボード1', 'テストボード2', 'テストボード3']
        
        for (const boardName of boardNames) {
            await page.click('[data-testid="fab-create-board"]')
            await page.fill('input[placeholder*="ボード名"]', boardName)
            await page.click('button:has-text("作成")')
            await page.waitForSelector(`text=${boardName}`)
        }
        
        // Delete each board with confirmation
        for (const boardName of boardNames) {
            const dialogPromise = new Promise(resolve => {
                page.on('dialog', async dialog => {
                    expect(dialog.message()).toContain(boardName)
                    await dialog.accept()
                    resolve(true)
                })
            })
            
            // Find and click the delete button for this specific board
            await page.locator(`text=${boardName}`).locator('..').locator('button:has-text("削除")').click()
            await dialogPromise
            
            // Wait for board to be deleted
            await page.waitForSelector(`text=${boardName}`, { state: 'hidden' })
        }
        
        // Verify all boards were deleted
        await page.waitForSelector('text=ボードがありません')
    })

    test('should handle dialog with keyboard shortcuts', async ({ page }) => {
        // Create a test board
        await page.click('[data-testid="fab-create-board"]')
        await page.fill('input[placeholder*="ボード名"]', 'キーボードテストボード')
        await page.click('button:has-text("作成")')
        await page.waitForSelector('text=キーボードテストボード')
        
        // Set up dialog handler
        const dialogPromise = new Promise(resolve => {
            page.on('dialog', async dialog => {
                // Accept with Enter key
                await dialog.accept()
                resolve(true)
            })
        })
        
        // Click delete button
        await page.click('button:has-text("削除")')
        
        // Wait for dialog handling
        await dialogPromise
        
        // Verify deletion
        await page.waitForSelector('text=ボードがありません')
    })

    test('should handle dialog timeout gracefully', async ({ page }) => {
        // Create a test board
        await page.click('[data-testid="fab-create-board"]')
        await page.fill('input[placeholder*="ボード名"]', 'タイムアウトテストボード')
        await page.click('button:has-text("作成")')
        await page.waitForSelector('text=タイムアウトテストボード')
        
        // Set up dialog handler with delay
        const dialogPromise = new Promise(resolve => {
            page.on('dialog', async dialog => {
                // Simulate user thinking time
                await page.waitForTimeout(1000)
                await dialog.accept()
                resolve(true)
            })
        })
        
        // Click delete button
        await page.click('button:has-text("削除")')
        
        // Wait for dialog handling
        await dialogPromise
        
        // Verify deletion
        await page.waitForSelector('text=ボードがありません')
    })
})

// Helper function for dialog handling (can be moved to a separate helper file)
export async function handleConfirmDialog(page, accept = true, expectedMessage = null) {
    return new Promise(resolve => {
        page.on('dialog', async dialog => {
            try {
                expect(dialog.type()).toBe('confirm')
                
                if (expectedMessage) {
                    expect(dialog.message()).toBe(expectedMessage)
                }
                
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