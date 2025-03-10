# PolyglotAI - アプリケーション仕様書

## 1. 概要

PolyglotAIは、日本人ユーザー向けの外国語スピーキング練習を支援するAIアプリケーションです。リアルタイムでの音声認識と文法訂正機能を通じて、効率的に外国語のスピーキングスキルを向上させることができます。

## 2. 目的

外国語学習において、特にスピーキング練習は以下の課題があります：
- 常にフィードバックを与えてくれる会話パートナーの不足
- 自分の間違いに気づきにくい
- 正確な発音や表現を習得するための効率的な方法の欠如

これらの課題を解決するため、PolyglotAIは最新のAI技術を活用して、リアルタイムでユーザーの発話を分析し、即座にフィードバックを提供します。

## 3. 主な機能

### 3.1 リアルタイム字幕表示（Google Cloud Speech-to-Text API）

- **機能詳細**: ユーザーの発話をリアルタイムで文字に変換し表示します
- **技術**: Google Cloud Speech-to-Text API
- **実装**:
  - WebブラウザのWeb Speech APIでユーザーの音声をキャプチャ
  - 継続的な音声認識モードで発話内容をリアルタイムで字幕表示
  - 複数言語のサポート（英語、フランス語、ドイツ語、スペイン語など）

### 3.2 間違い箇所のハイライト表示（OpenAI GPT-4-turbo）

- **機能詳細**: 発話内容の文法、語彙、表現の誤りをAIが検出し色付きでハイライト
- **技術**: OpenAI GPT-4-turbo API
- **実装**:
  - カスタマイズされたプロンプトエンジニアリングにより、高精度な文法・語彙チェック
  - 間違い箇所を赤色でハイライト
  - 各修正項目に説明を付加し、学習効果を高める
  - 結果は構造化されたJSONデータとして返され、UIでわかりやすく表示

### 3.3 修正後の再発話練習機能（Google Cloud Text-to-Speech API）

- **機能詳細**: 訂正された文を音声合成で再生し、ユーザーが正しい表現を聞いて練習できる
- **技術**: Google Cloud Text-to-Speech API
- **実装**:
  - 複数言語、複数の音声タイプをサポート
  - 自然な発音とイントネーションで高品質な音声合成
  - 再生速度の調整機能

### 3.4 UI・UXの簡潔さと分かりやすさ

- **機能詳細**: 直感的に操作できるシンプルなユーザーインターフェース
- **実装**:
  - Shadcn UIコンポーネントとTailwind CSSによる一貫したデザイン
  - Framer Motionを用いたアニメーションによる視覚的フィードバック
  - レスポンシブデザインで様々なデバイスに対応

## 4. 技術スタック

### 4.1 フロントエンド

- **Next.js**: Reactベースのフレームワークで、サーバーコンポーネントとクライアントコンポーネントを効果的に組み合わせる
- **TailwindCSS**: ユーティリティファーストのCSSフレームワークで効率的なスタイリングを実現
- **Shadcn UI**: アクセシビリティに優れたReactコンポーネントライブラリ
- **Framer Motion**: 高品質でインタラクティブなアニメーションを実現

### 4.2 バックエンド・API

- **Google Cloud Speech-to-Text**: 高精度な音声認識を提供
- **OpenAI GPT API**: GPT-4-turboを使用した文法・語彙訂正
- **Google Cloud Text-to-Speech**: 自然な音声合成

### 4.3 認証・データベース

- **Clerk**: 安全で使いやすいユーザー認証システム
- **Supabase**: Postgresデータベースでユーザーの進捗データを管理

## 5. システムアーキテクチャ

```
┌───────────────────┐    ┌───────────────────┐    ┌────────────────────┐
│   クライアント    │    │      サーバー      │    │  外部APIサービス   │
│ (Next.js/React)   │────│  (Next.js API Routes)│────│                    │
└───────────────────┘    └───────────────────┘    │ - Google Speech API │
                                  │                │ - OpenAI GPT API    │
                                  │                │ - Google TTS API    │
                                  │                └────────────────────┘
                         ┌────────┴──────────┐
                         │   データストレージ │
                         │   (Supabase)      │
                         └───────────────────┘
```

## 6. 開発ワークフロー

1. **ユーザーインターフェース開発**: Shadcn UIとTailwindを使用したコンポーネント設計
2. **API統合**: 各外部APIとのインターフェース構築
3. **認証機能**: Clerkを使用したユーザー認証の実装
4. **データ永続化**: Supabaseを使用したデータベース連携
5. **テスト**: 単体テストと統合テストによる品質保証
6. **パフォーマンス最適化**: クライアント・サーバー間の効率的なデータフロー設計

## 7. セキュリティ考慮事項

- API認証情報は環境変数として安全に管理
- ユーザー認証はClerkによるセキュアな実装
- HTTPS通信の強制により、すべてのデータ転送を暗号化
- OpenAIとGoogleのAPIに送信されるデータのプライバシー考慮

## 8. 将来の拡張性

- 他言語サポートの追加
- 発音スコアリング機能
- 会話シナリオとロールプレイ機能
- モバイルアプリへの展開
- ユーザー間の進捗共有と比較機能

## 9. API仕様

### 9.1 /api/correct

**目的**: ユーザーの発話テキストの文法・語彙チェックを行う

**リクエスト**:
```json
{
  "text": "I go to the store yesterday",
  "language": "en-US"
}
```

**レスポンス**:
```json
[
  {
    "text": "I go to the store yesterday",
    "isCorrect": false,
    "correction": "I went to the store yesterday",
    "explanation": "Use past tense for completed actions in the past."
  }
]
```

### 9.2 /api/speak

**目的**: テキストを音声に変換する

**リクエスト**:
```json
{
  "text": "I went to the store yesterday",
  "language": "en-US"
}
```

**レスポンス**:
```json
{
  "audioContent": "base64エンコードされた音声データ"
}
```

## 10. ユーザーインターフェース

### 10.1 ホーム画面

- アプリの紹介
- 主な機能の説明
- 練習開始ボタン

### 10.2 練習画面

- 録音開始/停止ボタン
- リアルタイム字幕表示エリア
- 言語選択ドロップダウン
- 訂正と説明の表示エリア
- 修正音声再生ボタン

## 11. エラーハンドリング

- 音声認識エラー: デバイスのマイク許可がない場合のガイダンス
- API接続エラー: 外部APIに接続できない場合の適切なフィードバック
- 入力検証: 空の入力やサポートされていない言語の処理

## 12. パフォーマンス最適化

- クライアントサイドストリーミング処理によるレイテンシの最小化
- インクリメンタルレンダリングによるUIの応答性の向上
- リソース使用量の最適化（API呼び出し頻度の制限など）

## 13. 環境設定

本番環境では以下の環境変数が必要です：

```
OPENAI_API_KEY=sk-...
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
``` 