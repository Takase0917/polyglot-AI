# PolyglotAI - AI-Powered Language Speaking Practice

PolyglotAIは、日本人ユーザー向けに設計された、外国語スピーキング練習を支援するAIアプリケーションです。リアルタイムで音声認識、文法チェック、発音フィードバックを提供し、効率的な言語学習をサポートします。

[English documentation available below](#english-documentation)

![PolyglotAI Screenshot](docs/screenshot_placeholder.png)

## 主な機能

- **リアルタイム字幕表示**: Google Cloud Speech-to-Text APIを使用して、ユーザーの発話をリアルタイムでテキスト化
- **インテリジェントな文法訂正**: OpenAI GPT-4-turboを利用して、文法や語彙の誤りを即座に検出し修正提案
- **発音練習支援**: Google Cloud Text-to-Speech APIで正しい発音を音声で提示
- **直感的なUI/UX**: Shadcn UIとFramer Motionを活用した、使いやすいインターフェース

## 初期セットアップ

### 必要条件

- Node.js 18.0以上
- npm または yarn
- 各種APIキー:
  - OpenAI API
  - Google Cloud (Speech-to-Text, Text-to-Speech)
  - Clerk (認証用)
  - Supabase (データ管理用)

### インストール手順

1. リポジトリをクローン:

```bash
git clone https://github.com/yourusername/polyglot-ai.git
cd polyglot-ai
```

2. 依存関係をインストール:

```bash
npm install
# または
yarn install
```

3. 環境変数を設定:

`.env.local.example`を`.env.local`にコピーし、必要なAPIキーとシークレットを入力します。

```bash
cp .env.local.example .env.local
```

4. アプリケーションを起動:

```bash
npm run dev
# または
yarn dev
```

5. ブラウザで http://localhost:3000 にアクセスしてアプリケーションを使用開始

## 環境設定

詳細な環境設定手順は[環境設定ガイド](docs/environment-setup.md)を参照してください。

## テスト

このプロジェクトにはJestとReact Testing Libraryを使用した包括的なテストスイートが含まれています。

### テストの実行

```bash
# すべてのテストを実行
npm test

# ウォッチモードでテストを実行（変更を監視して再実行）
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage
```

詳細なテスト戦略と実装についての情報は、[テスト仕様書](docs/testing.md)を参照してください。

## トラブルシューティング

アプリケーションの使用中に問題が発生した場合は、[トラブルシューティングガイド](docs/troubleshooting.md)を参照してください。一般的な問題とその解決方法が記載されています。

## 使用方法

1. ホーム画面の「練習を始める」ボタンをクリック
2. 言語を選択（英語、フランス語、ドイツ語、スペイン語など）
3. 「録音を開始」ボタンをクリックして話し始める
4. 発話内容がリアルタイムで表示され、文法や語彙の誤りがあればハイライト表示
5. 訂正内容を確認し、「修正を聞く」ボタンで正しい発音を聞く
6. 正しい表現で再度練習

## 開発情報

本プロジェクトは以下の技術スタックで構築されています:

- **フロントエンド**: Next.js, React, TailwindCSS, Shadcn UI, Framer Motion
- **バックエンド**: Next.js API Routes
- **API**: OpenAI GPT-4-turbo, Google Cloud Speech-to-Text, Google Cloud Text-to-Speech
- **認証**: Clerk
- **データベース**: Supabase
- **テスト**: Jest, React Testing Library

詳細な実装ガイドラインは[実装ガイド](docs/implementation-guide.md)を参照してください。

## 機能拡張予定

- ユーザーの進捗追跡機能
- 言語レベル別のフィードバック調整
- 会話シナリオとロールプレイ練習
- モバイルアプリ版

## コントリビューション

コントリビューションを歓迎します！以下の手順でご参加ください:

1. このリポジトリをフォーク
2. 機能追加やバグ修正のブランチを作成
3. 変更を加えてコミット
4. リモートリポジトリに変更をプッシュ
5. プルリクエストを作成

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

---

<a name="english-documentation"></a>
# PolyglotAI - AI-Powered Language Speaking Practice

PolyglotAI is an AI-powered application designed to assist Japanese users in practicing foreign language speaking. It provides real-time speech recognition, grammar checking, and pronunciation feedback to support efficient language learning.

## Key Features

- **Real-time Subtitles**: Uses Google Cloud Speech-to-Text API to convert user speech to text in real time
- **Intelligent Grammar Correction**: Leverages OpenAI GPT-4-turbo to instantly detect and suggest corrections for grammar and vocabulary errors
- **Pronunciation Practice**: Provides correct pronunciation audio using Google Cloud Text-to-Speech API
- **Intuitive UI/UX**: User-friendly interface built with Shadcn UI and Framer Motion

## Initial Setup

### Requirements

- Node.js 18.0 or higher
- npm or yarn
- API keys for:
  - OpenAI API
  - Google Cloud (Speech-to-Text, Text-to-Speech)
  - Clerk (for authentication)
  - Supabase (for data management)

### Installation Steps

1. Clone the repository:

```bash
git clone https://github.com/yourusername/polyglot-ai.git
cd polyglot-ai
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

Copy `.env.local.example` to `.env.local` and fill in your API keys and secrets.

```bash
cp .env.local.example .env.local
```

4. Start the application:

```bash
npm run dev
# or
yarn dev
```

5. Open http://localhost:3000 in your browser to start using the application

## Environment Configuration

For detailed environment setup instructions, please refer to the [Environment Setup Guide](docs/environment-setup.md).

## Testing

This project includes comprehensive test suites using Jest and React Testing Library.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

For more information about testing strategy and implementation, see the [Testing Documentation](docs/testing.md).

## Troubleshooting

If you encounter any issues while using the application, please refer to the [Troubleshooting Guide](docs/troubleshooting.md) for common problems and their solutions.

## How to Use

1. Click the "Start Practice" button on the home screen
2. Select a language (English, French, German, Spanish, etc.)
3. Click the "Start Recording" button and begin speaking
4. Your speech will be displayed in real-time, with grammar or vocabulary errors highlighted
5. Review the corrections and click "Listen to Correction" to hear the proper pronunciation
6. Practice again with the correct expression

## Development Information

This project is built with the following technology stack:

- **Frontend**: Next.js, React, TailwindCSS, Shadcn UI, Framer Motion
- **Backend**: Next.js API Routes
- **APIs**: OpenAI GPT-4-turbo, Google Cloud Speech-to-Text, Google Cloud Text-to-Speech
- **Authentication**: Clerk
- **Database**: Supabase
- **Testing**: Jest, React Testing Library

For detailed implementation guidelines, please refer to the [Implementation Guide](docs/implementation-guide.md).

## Planned Features

- User progress tracking
- Language level-specific feedback
- Conversation scenarios and role-play practice
- Mobile app version

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork this repository
2. Create a branch for your feature or bug fix
3. Make your changes and commit them
4. Push your changes to your remote repository
5. Create a pull request

## License

This project is released under the MIT License. See the [LICENSE](LICENSE) file for details.
