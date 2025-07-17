# Alert Polyfill Solution for React Native Web + Playwright

## 問題の概要

React Native WebアプリケーションでPlaywrightを使用したE2Eテスト実行時に、削除確認ダイアログが表示されるものの、Playwrightがモーダル状態でスタックし、適切にダイアログを処理できない問題が発生していました。

具体的には：
- 削除ボタンクリック時に「ボードを削除「E2Eテスト自動生成ボード」を削除しますか？」ダイアログが表示される
- Playwrightがダイアログを検出するが、処理する前にダイアログが閉じられてしまう
- テストが期待通りに動作しない

## 根本原因分析

### 1. 同期処理の問題
```javascript
// 元のコード（問題のあるバージョン）
const alertPolyfill = (title, description, options, extra) => {
    const result = window.confirm([title, description].filter(Boolean).join('\\n'))
    
    if (result) {
        const confirmOption = options.find(({ style }) => style !== 'cancel')
        confirmOption && confirmOption.onPress()
    } else {
        const cancelOption = options.find(({ style }) => style === 'cancel')
        cancelOption && cancelOption.onPress()
    }
}
```

**問題点：**
- `window.confirm()`は同期的に実行され、即座にコールバックが実行される
- Playwrightがダイアログを検出する前に処理が完了してしまう
- React Nativeの`Alert.alert`は非同期なのに、polyfillが同期的に動作する

### 2. テスト環境での状態管理不足
- ダイアログの状態を追跡する仕組みがない
- テスト環境でのダイアログ処理に対応していない

## 解決策

### 1. 非同期処理の導入
```javascript
const alertPolyfill = (title, description, options, extra) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // ダイアログ処理
        }, 10) // 小さな遅延でイベントループの処理を許可
    })
}
```

### 2. テスト環境の検出と対応
```javascript
const isTestMode = typeof window !== 'undefined' && (
    window.navigator.webdriver || 
    window.playwright || 
    window.__playwright ||
    process.env.NODE_ENV === 'test'
)

if (isTestMode) {
    // テスト環境用の処理
    window.__lastDialog = {
        type: 'confirm',
        title,
        description,
        message,
        options,
        resolve: (result) => {
            handleDialogResult(result, options, resolve)
        }
    }
}
```

### 3. エラーハンドリングの強化
```javascript
try {
    const result = window.confirm(message)
    handleDialogResult(result, options, resolve)
} catch (error) {
    console.error('Alert polyfill error:', error)
    // フォールバック処理
    const cancelOption = options.find(({ style }) => style === 'cancel')
    if (cancelOption && cancelOption.onPress) {
        cancelOption.onPress()
    }
    resolve(false)
}
```

## 実装されたソリューション

### 主な改善点

1. **Promise基盤の非同期処理**
   - `setTimeout`を使用してPlaywrightがダイアログを検出できるように遅延を追加
   - Promise-basedでasync/awaitに対応

2. **テスト環境の自動検出**
   - webdriver、playwright、__playwright、NODE_ENV等を検出
   - テスト環境では`window.__lastDialog`でダイアログ情報を公開

3. **後方互換性の維持**
   - 既存のコードを変更することなく使用可能
   - Promise不要のレガシーコードもそのまま動作

4. **強固なエラーハンドリング**
   - 例外発生時のフォールバック処理
   - 安全なオプション解析

### 使用方法

#### 通常のアプリケーション使用
```javascript
import alert from '../utils/alert'

const handleDeleteBoard = (boardId, boardName) => {
    alert(
        'ボードを削除',
        `「${boardName}」を削除しますか？`,
        [
            { text: 'キャンセル', style: 'cancel' },
            { 
                text: '削除', 
                style: 'destructive',
                onPress: () => deleteBoard(boardId)
            }
        ]
    )
}
```

#### Playwrightテスト
```javascript
import { handleConfirmDialog } from './utils/testHelpers.js'

test('should handle delete confirmation', async ({ page }) => {
    await page.goto('http://localhost:19006')

    // ダイアログハンドラーを設定
    const dialogPromise = handleConfirmDialog(page, true, 'ボードを削除\\n「E2Eテスト自動生成ボード」を削除しますか？')

    // 削除ボタンをクリック
    await page.locator('button:has-text("削除")').click()

    // ダイアログ処理の完了を待機
    const dialogResult = await dialogPromise
    
    expect(dialogResult.accepted).toBe(true)
    expect(dialogResult.type).toBe('confirm')
})
```

## テストヘルパー関数

### handleConfirmDialog
Playwrightでconfirmダイアログを処理するヘルパー関数

```javascript
const dialogPromise = handleConfirmDialog(page, true, expectedMessage)
```

### simulateDialogResult
ユニットテストでダイアログ結果をシミュレート

```javascript
simulateDialogResult(true) // accept
simulateDialogResult(false) // dismiss
```

### getLastDialogInfo
テスト環境でダイアログ情報を取得

```javascript
const dialogInfo = getLastDialogInfo()
console.log(dialogInfo.title, dialogInfo.message)
```

## 動作検証

### 1. ユニットテスト
`utils/alert.test.js`で基本的な機能をテスト：
- 通常のconfirmダイアログの受諾/拒否
- テスト環境でのダイアログ情報公開
- エラーハンドリング
- 後方互換性

### 2. Playwrightテスト
```javascript
// 削除確認ダイアログのテスト
test('delete board with confirmation', async ({ page }) => {
    // ダイアログハンドラーを設定
    page.on('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm')
        expect(dialog.message()).toContain('を削除しますか？')
        await dialog.accept()
    })

    await page.click('button:has-text("削除")')
    
    // ボードが削除されたことを確認
    await expect(page.locator('text=ボードがありません')).toBeVisible()
})
```

## 重要なポイント

1. **非同期処理**：`setTimeout`により、Playwrightがダイアログを検出する時間を確保
2. **テスト環境検出**：自動的にテスト環境を検出し、適切な処理を選択
3. **グローバル状態管理**：テスト環境では`window.__lastDialog`でダイアログ情報を公開
4. **エラー耐性**：例外発生時も適切にフォールバック処理を実行
5. **後方互換性**：既存のコードを変更せずに動作

この解決策により、React Native WebアプリケーションでPlaywrightを使用したE2Eテスト実行時に、削除確認ダイアログが正しく処理されるようになります。