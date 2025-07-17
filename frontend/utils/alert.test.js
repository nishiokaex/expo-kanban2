/**
 * Test file for alert polyfill
 * This demonstrates how the enhanced alert works with both normal and test modes
 */

import alert from './alert.js'
import { simulateDialogResult, getLastDialogInfo, waitForDialog, cleanupDialog } from './testHelpers.js'

// Mock React Native Platform
jest.mock('react-native', () => ({
    Alert: {
        alert: jest.fn()
    },
    Platform: {
        OS: 'web'
    }
}))

// Mock window.confirm
const mockConfirm = jest.fn()
global.window = {
    confirm: mockConfirm,
    navigator: {
        webdriver: false
    }
}

describe('Alert Polyfill', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        cleanupDialog()
        mockConfirm.mockClear()
    })

    afterEach(() => {
        cleanupDialog()
    })

    test('should handle normal confirm dialog acceptance', async () => {
        mockConfirm.mockReturnValue(true)
        
        const onPressMock = jest.fn()
        const cancelMock = jest.fn()
        
        const options = [
            { text: 'キャンセル', style: 'cancel', onPress: cancelMock },
            { text: '削除', style: 'destructive', onPress: onPressMock }
        ]
        
        const result = await alert('Test Title', 'Test Description', options)
        
        expect(mockConfirm).toHaveBeenCalledWith('Test Title\\nTest Description')
        expect(onPressMock).toHaveBeenCalled()
        expect(cancelMock).not.toHaveBeenCalled()
        expect(result).toBe(true)
    })

    test('should handle normal confirm dialog dismissal', async () => {
        mockConfirm.mockReturnValue(false)
        
        const onPressMock = jest.fn()
        const cancelMock = jest.fn()
        
        const options = [
            { text: 'キャンセル', style: 'cancel', onPress: cancelMock },
            { text: '削除', style: 'destructive', onPress: onPressMock }
        ]
        
        const result = await alert('Test Title', 'Test Description', options)
        
        expect(mockConfirm).toHaveBeenCalledWith('Test Title\\nTest Description')
        expect(onPressMock).not.toHaveBeenCalled()
        expect(cancelMock).toHaveBeenCalled()
        expect(result).toBe(false)
    })

    test('should expose dialog info in test mode', async () => {
        // Simulate test mode
        global.window.navigator.webdriver = true
        mockConfirm.mockReturnValue(true)
        
        const onPressMock = jest.fn()
        const cancelMock = jest.fn()
        
        const options = [
            { text: 'キャンセル', style: 'cancel', onPress: cancelMock },
            { text: '削除', style: 'destructive', onPress: onPressMock }
        ]
        
        const alertPromise = alert('Test Title', 'Test Description', options)
        
        // Wait for dialog to be set up
        await new Promise(resolve => setTimeout(resolve, 20))
        
        const dialogInfo = getLastDialogInfo()
        expect(dialogInfo).toBeDefined()
        expect(dialogInfo.title).toBe('Test Title')
        expect(dialogInfo.description).toBe('Test Description')
        expect(dialogInfo.message).toBe('Test Title\\nTest Description')
        expect(dialogInfo.type).toBe('confirm')
        
        await alertPromise
        
        expect(onPressMock).toHaveBeenCalled()
        expect(cancelMock).not.toHaveBeenCalled()
    })

    test('should handle errors gracefully', async () => {
        mockConfirm.mockImplementation(() => {
            throw new Error('Test error')
        })
        
        const onPressMock = jest.fn()
        const cancelMock = jest.fn()
        
        const options = [
            { text: 'キャンセル', style: 'cancel', onPress: cancelMock },
            { text: '削除', style: 'destructive', onPress: onPressMock }
        ]
        
        const result = await alert('Test Title', 'Test Description', options)
        
        expect(result).toBe(false)
        expect(cancelMock).toHaveBeenCalled()
        expect(onPressMock).not.toHaveBeenCalled()
    })

    test('should work with missing onPress handlers', async () => {
        mockConfirm.mockReturnValue(true)
        
        const options = [
            { text: 'キャンセル', style: 'cancel' },
            { text: '削除', style: 'destructive' }
        ]
        
        const result = await alert('Test Title', 'Test Description', options)
        
        expect(result).toBe(true)
        expect(mockConfirm).toHaveBeenCalledWith('Test Title\\nTest Description')
    })

    test('should handle empty title/description', async () => {
        mockConfirm.mockReturnValue(true)
        
        const options = [
            { text: 'OK', style: 'default', onPress: jest.fn() }
        ]
        
        await alert('', '', options)
        
        expect(mockConfirm).toHaveBeenCalledWith('')
    })

    test('should handle single parameter (title only)', async () => {
        mockConfirm.mockReturnValue(true)
        
        const options = [
            { text: 'OK', style: 'default', onPress: jest.fn() }
        ]
        
        await alert('Only Title', null, options)
        
        expect(mockConfirm).toHaveBeenCalledWith('Only Title')
    })
})