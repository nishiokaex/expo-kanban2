# CLAUDE.md

このファイルは、このリポジトリ内のコードを操作する際に Claude Code (claude.ai/code) にガイダンスを提供します。

## 開発日誌を作成すること

`diary/yyyy-mm-dd_hhmm.md`のファイルを作成し、開発日誌を作成してください。内容は以下の通りです。

- **日付**: yyyy-mm-dd hh:mm
- **作業内容**:
  - 何をしたか
  - どのような問題が発生したか
  - どのように解決したか
- **次回の予定**:
- **感想**: 気分や愚痴を書く

## 開発コマンド

- `cd frontend && npm run web` - Expo Web開発サーバーを起動

## 技術要件

### フロントエンド(frontend)
- **React Native**: Expo SDK v52
- **ナビゲーション**: expo-router
- **状態管理**: Zustand (Class構文を使ったストア定義)
- **UIライブラリ**: react-native-paper, react-native-safe-area-context
- **Bottom Tab**: react-native-bottom-tabs
- **データ永続化**: @react-native-async-storage/async-storage
- **通知**: expo-notifications
- **多言語対応**: react-i18next
- **フォーム**: react-hook-form
- **アイコン**: react-icons
- **HTTP通信**: axios（一般用途）, fetch（エラーサーバ通信用）
- **Drag And Drop**: @mgcrea/react-native-dnd
- **言語**: JavaScript（TypeScript不使用）

### バックエンド(backend)
- **BaaS**: Supabase
- **データベース**: PostgreSQL（Supabase）
- **認証**: Supabase Auth

### アーキテクチャ
- **設計パターン**: クリーンアーキテクチャ
  - Domain Layer（ビジネスロジック）
  - Infrastructure Layer（データアクセス）
  - Presentation Layer（UI）
- **データ正規化**: 第1〜第3正規化対応
- **データバージョニング**: バージョン情報付きマイグレーション対応

### テスト
- **Unitテスト**: jest-expo
- **React Nativeテスト**: @testing-library/react-native

## 構成管理

- ソースコードはgithubで管理します
- コミットは、feature/[エンハンス内容] という名前の機能ブランチのみに行う

## 機能開発プロセス

1. feature/[エンハンス内容] という名前の機能ブランチを作成する
2. 機能を開発する
3. Web版でビルドして動作確認し、./frontend/logs以下のファイルに例外が出力されなくなるまで、修正する
4. 変更内容をコミットする
5. ghコマンドでPull Requestを作成する。マージで機能ブランチを削除する設定で作成する。

## 動作確認
```
以下のアプリに対して、playwright MCP serverを使って、正常系E2Eテストを実行してください。テストに失敗した場合、原因を調査して修正してください。
## 対象アプリ
http://localhost:8081/
```

## 開発ガイドライン

- Google Style Guidesに準拠したソースコードを書く
- ドキュメントやコメントは日本語で記述
- セキュリティ・パフォーマンス・保守性を重視した設計

## 調査・分析タスク
- 複雑な問題に対しては、**急がず時間をかけて調査してください**
- 複数のファイルを読み込み、**全体像を把握してから**作業を開始してください
- 不明な点は、関連するドキュメントやコードを**徹底的に調査**してください
