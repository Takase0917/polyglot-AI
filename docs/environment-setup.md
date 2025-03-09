# PolyglotAI - 環境設定ガイド

このガイドでは、PolyglotAIアプリケーションを実行するために必要な環境設定とAPIキーの取得方法について説明します。

## 必要なAPIキーと認証情報

PolyglotAIは以下の外部サービスを使用します：

1. OpenAI API (GPT-4-turbo)
2. Google Cloud (Speech-to-Text, Text-to-Speech)
3. Clerk (認証)
4. Supabase (データベース)

## 1. OpenAI APIキーの取得

GPT-4-turboを使用した文法訂正機能に必要です。

### 手順:

1. [OpenAIのウェブサイト](https://platform.openai.com/)にアクセスし、アカウントを作成またはログインします
2. ダッシュボードから「API Keys」セクションに移動します
3. 「Create new secret key」をクリックして新しいAPIキーを生成します
4. 生成されたキーをコピーして保存します（このキーは一度しか表示されません）

### 環境変数の設定:

```
OPENAI_API_KEY=sk_...（取得したAPIキー）
```

## 2. Google Cloud設定

音声認識と音声合成機能に必要です。

### 手順:

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセスし、Googleアカウントでログインします
2. 新しいプロジェクトを作成します
3. APIライブラリから以下のAPIを有効化します:
   - Speech-to-Text API
   - Text-to-Speech API
4. サービスアカウントを作成します:
   - 「IAMと管理」→「サービスアカウント」に移動
   - 「サービスアカウントを作成」をクリック
   - 名前に「polyglot-ai」などを入力
   - 「作成して続行」をクリック
   - 役割として「Speech to Text User」と「Text to Speech User」を追加
   - 「完了」をクリック
5. サービスアカウントキーを作成します:
   - 作成したサービスアカウントの詳細画面に移動
   - 「キー」タブをクリック
   - 「鍵を追加」→「新しい鍵を作成」を選択
   - JSONフォーマットを選択し、「作成」をクリック
   - JSONキーファイルがダウンロードされます

### 環境変数の設定:

ダウンロードしたJSONファイルの内容をそのまま環境変数として設定します：

```
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

## 3. Clerk認証設定

ユーザー認証機能に必要です。

### 手順:

1. [Clerk](https://clerk.dev/)にアクセスし、アカウントを作成またはログインします
2. 新しいアプリケーションを作成します
3. アプリケーション設定からAPIキーを取得します:
   - 「API Keys」タブに移動
   - 「Publishable Key」と「Secret Key」をコピーします

### 環境変数の設定:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...（Publishable Key）
CLERK_SECRET_KEY=sk_...（Secret Key）
```

## 4. Supabase設定

ユーザーデータと学習進捗の保存に必要です。

### 手順:

1. [Supabase](https://supabase.io/)にアクセスし、アカウントを作成またはログインします
2. 新しいプロジェクトを作成します
3. プロジェクトのURLとAPIキーを取得します:
   - 「Settings」→「API」に移動
   - 「Project URL」と「anon/public」キーをコピーします

### 環境変数の設定:

```
SUPABASE_URL=https://...（Project URL）
SUPABASE_ANON_KEY=...（anon/public キー）
```

## 環境変数ファイルの作成

プロジェクトのルートディレクトリに`.env.local`ファイルを作成し、すべての環境変数を設定します：

```
# OpenAI API
OPENAI_API_KEY=sk_...

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}

# Clerk (認証)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Supabase (データベース)
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
```

## 環境変数のセキュリティに関する注意事項

1. `.env.local`ファイルは決してGitリポジトリにコミットしないでください
2. `.gitignore`ファイルに`.env.local`が含まれていることを確認してください
3. 本番環境では、ホスティングプラットフォーム（Vercel、Netlifyなど）の環境変数設定を使用してください
4. APIキーは定期的にローテーションすることをお勧めします

## トラブルシューティング

### APIキーが認識されない

- アプリケーションを再起動して、環境変数が読み込まれるようにしてください
- キーの形式が正しいことを確認してください（スペースや改行がないこと）

### Google Cloud認証エラー

- JSONデータが正しくエスケープされていることを確認してください
- サービスアカウントに適切な権限があることを確認してください

### Clerk認証の問題

- 「NEXT_PUBLIC_」プレフィックスが必要なキーに正しく付与されていることを確認してください
- Clerkダッシュボードで許可されているドメインを確認してください

### Supabase接続の問題

- データベースURLに「https://」が含まれていることを確認してください
- アノニマスキーが正しいことを確認してください 