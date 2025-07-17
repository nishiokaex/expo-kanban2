import { Alert, Platform } from 'react-native'

const alertPolyfill = (title, description, options, extra) => {
    // テスト環境を検出
    const isTestEnv = typeof window !== 'undefined' && (
        window.navigator?.webdriver ||
        window.__playwright ||
        process.env.NODE_ENV === 'test'
    )

    try {
        // ダイアログ情報をテスト用に保存
        if (isTestEnv && window) {
            window.__lastDialog = {
                title,
                description,
                options,
                timestamp: Date.now()
            }
        }

        // 非同期でダイアログを表示（Playwrightが検出できるように）
        setTimeout(() => {
            try {
                const message = [title, description].filter(Boolean).join('\n')
                const result = window.confirm(message)

                if (result) {
                    const confirmOption = options?.find(({ style }) => style !== 'cancel')
                    confirmOption?.onPress?.()
                } else {
                    const cancelOption = options?.find(({ style }) => style === 'cancel')
                    cancelOption?.onPress?.()
                }
            } catch (error) {
                console.error('Alert polyfill error:', error)
                // エラー時はデフォルトの確認ダイアログをフォールバック
                if (window.confirm(`${title}\n${description}`)) {
                    const confirmOption = options?.find(({ style }) => style !== 'cancel')
                    confirmOption?.onPress?.()
                }
            }
        }, 0)

    } catch (error) {
        console.error('Alert polyfill setup error:', error)
        // 完全にフォールバック
        if (window?.confirm) {
            const result = window.confirm([title, description].filter(Boolean).join('\n'))
            if (result) {
                const confirmOption = options?.find(({ style }) => style !== 'cancel')
                confirmOption?.onPress?.()
            }
        }
    }
}

const alert = Platform.OS === 'web' ? alertPolyfill : Alert.alert

export default alert