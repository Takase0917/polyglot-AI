# PolyglotAI - テスト仕様書

このドキュメントはPolyglotAIアプリケーションのテスト手法について説明します。

## テスト戦略

PolyglotAIでは以下のタイプのテストを実装しています：

1. **ユニットテスト**: コンポーネントや関数の個別のロジックをテスト
2. **統合テスト**: APIエンドポイントやデータフローをテスト
3. **UI/コンポーネントテスト**: Reactコンポーネントの表示と動作をテスト

## テストツール

- **Jest**: JavaScriptテストフレームワーク
- **React Testing Library**: Reactコンポーネントのテスト用ライブラリ
- **MSW (Mock Service Worker)**: APIのモック用（将来的な実装）

## テストの実行方法

### 全てのテストを実行

```bash
npm test
```

### 特定のファイルのテストを実行

```bash
npm test -- path/to/test/file.test.ts
```

### テストをウォッチモードで実行（変更を監視して再実行）

```bash
npm run test:watch
```

### カバレッジレポートを生成

```bash
npm run test:coverage
```

カバレッジレポートは`coverage/`ディレクトリに生成されます。

## テストファイルの構造

テストファイルは対象のコンポーネントやAPIと同じディレクトリに配置し、`.test.tsx`または`.test.ts`の拡張子を使用します。

例：
- `src/app/page.tsx` → `src/app/page.test.tsx`
- `src/app/api/correct/route.ts` → `src/app/api/correct/route.test.ts`

## テスト環境の設定

テスト環境の設定は以下のファイルで管理されています：

- `jest.config.js`: Jestの全体設定
- `jest.setup.js`: テスト前の環境セットアップ（モックなど）
- `src/types/testing-library__jest-dom.d.ts`: TypeScript型定義拡張

## APIのモック

外部APIに依存するコンポーネントやAPIエンドポイントのテストでは、適切なモックデータを使用します。これにより、テストの信頼性が向上し、外部サービスへの依存が削減されます。

### OpenAI API

OpenAI APIのモック例：

```typescript
// モックデータの返却
const mockCompletionData = {
  choices: [
    {
      message: {
        content: JSON.stringify([
          {
            text: "I go to the store",
            isCorrect: false,
            correction: "I went to the store",
            explanation: "Use past tense for completed actions"
          }
        ])
      }
    }
  ]
};
```

### Google Cloud Text-to-Speech API

Google Cloud Text-to-Speech APIのモック例：

```typescript
// モックの音声データを返す
const mockAudioContent = Buffer.from('dummy audio data');
const mockResponse = [{ audioContent: mockAudioContent }];
```

## エラーハンドリングのテスト

各APIエンドポイントでは、以下のエラーケースをテストします：

1. 必要なパラメータが不足している場合
2. 外部APIへの接続に失敗した場合
3. 環境変数が未設定の場合のフォールバック動作

## UIコンポーネントのテスト

UIコンポーネントのテストでは、以下の観点を重視します：

1. 正しいテキストと要素が表示されるか
2. ユーザーインタラクション（クリックなど）が期待通りに動作するか
3. 条件付きレンダリングが適切に機能するか
4. アクセシビリティの考慮（将来的な実装）

## CIパイプラインへの統合

継続的インテグレーション（CI）パイプラインでは、以下のステップを実行します：

1. コードのlintチェック
2. 全テストの実行
3. カバレッジレポートの生成（最低80%のカバレッジを目標）

## テスト戦略の進化

テスト戦略は以下の方向性で進化させる予定です：

1. エンドツーエンド（E2E）テストの追加
2. パフォーマンステストの導入
3. 負荷テストの実装（外部APIの利用コスト制限） 