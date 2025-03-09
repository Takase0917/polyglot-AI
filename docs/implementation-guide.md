# PolyglotAI - 実装ガイド

このガイドはPolyglotAIアプリケーションの開発者向けの技術的な実装ガイドです。各機能の実装方法と注意点を説明します。

## 目次

1. [プロジェクトのセットアップ](#1-プロジェクトのセットアップ)
2. [音声認識の実装](#2-音声認識の実装)
3. [GPT-4を使用した文法訂正](#3-gpt-4を使用した文法訂正)
4. [Text-to-Speechの実装](#4-text-to-speechの実装) 
5. [UIコンポーネント](#5-uiコンポーネント)
6. [環境変数の設定](#6-環境変数の設定)
7. [デプロイガイド](#7-デプロイガイド)

## 1. プロジェクトのセットアップ

### 1.1 初期セットアップ

```bash
# Next.jsプロジェクトの作成
npx create-next-app polyglot-ai --typescript --tailwind --eslint --app --src-dir

# 必要なパッケージのインストール
cd polyglot-ai
npm install framer-motion @clerk/nextjs @supabase/supabase-js @google-cloud/speech @google-cloud/text-to-speech openai

# Shadcn UIのセットアップ
npx shadcn@latest init
npx shadcn@latest add button card dialog input sonner textarea progress sheet avatar dropdown-menu
```

### 1.2 プロジェクト構造

```
polyglot-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── correct/
│   │   │   │   └── route.ts  # GPT-4による文法訂正API
│   │   │   └── speak/
│   │   │       └── route.ts  # Text-to-Speech API
│   │   ├── practice/
│   │   │   └── page.tsx      # 練習ページ
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx          # ホームページ
│   ├── components/
│   │   ├── ui/               # Shadcn UIコンポーネント
│   │   └── custom/           # カスタムコンポーネント
│   └── lib/
│       └── utils.ts          # ユーティリティ関数
├── docs/                     # プロジェクト仕様とガイド
├── public/
└── ...設定ファイル
```

## 2. 音声認識の実装

PolyglotAIはブラウザの`Web Speech API`を使用してクライアントサイドで音声認識を行います。

### 2.1 Web Speech APIの基本実装

```typescript
// src/app/practice/page.tsx の一部
"use client";

import { useState, useEffect, useRef } from "react";

export default function PracticePage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const recognitionRef = useRef<any>(null);

  // 音声認識の初期化
  useEffect(() => {
    if (typeof window !== "undefined" && 'webkitSpeechRecognition' in window) {
      // @ts-ignore - webkitSpeechRecognitionはTypesに含まれていない
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = selectedLanguage;

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const transcriptText = result[0].transcript;
        setTranscript(transcriptText);
        
        // 発話が一時停止したときにGPTによる訂正処理を実行
        if (result.isFinal) {
          processTextCorrection(transcriptText);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        // エラーハンドリング
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [selectedLanguage]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
      setTranscript("");
    }
  };

  // ...その他のコード
}
```

### 2.2 サポートされる言語

主要な言語コードのリファレンス：

```typescript
const languageOptions = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "es-ES", label: "Spanish" },
  { value: "ja-JP", label: "Japanese" }
];
```

## 3. GPT-4を使用した文法訂正

### 3.1 API実装

```typescript
// src/app/api/correct/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI クライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text, language } = await req.json();

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // GPT-4用のプロンプト生成
    const prompt = generatePrompt(text, language || 'en-US');

    // OpenAI APIの呼び出し
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `
          あなたは言語教師のエキスパートです。提供されたテキストの文法エラー、
          語彙の問題、不自然な表現を特定してください。
          修正と説明を提供してください。
          
          以下のJSON形式でのみ応答してください:
          [
            {
              "text": "エラーがある元のテキストセグメント",
              "isCorrect": false,
              "correction": "修正されたテキストセグメント",
              "explanation": "エラーの簡単な説明"
            },
            {
              "text": "エラーのない元のテキストセグメント",
              "isCorrect": true
            }
          ]
          
          エラーがない場合は空の配列を返してください。
          `
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });

    // レスポンスの解析
    const content = response.choices[0]?.message?.content || '';
    const correctionData = JSON.parse(content);
    
    return NextResponse.json(correctionData);
  } catch (error) {
    console.error('Error correcting speech:', error);
    return NextResponse.json(
      { error: 'Failed to process correction' },
      { status: 500 }
    );
  }
}

// 言語に応じたプロンプトの生成
function generatePrompt(text: string, language: string): string {
  const languageMap: Record<string, string> = {
    'en-US': 'American English',
    'en-GB': 'British English',
    'fr-FR': 'French',
    'de-DE': 'German',
    'es-ES': 'Spanish',
  };

  const languageName = languageMap[language] || 'English';

  return `
  以下は${languageName}の話し言葉です。
  文法エラー、語彙の誤用、または不自然な表現を特定してください。
  各問題について修正と簡単な説明を提供してください。
  
  テキスト: "${text}"
  `;
}
```

### 3.2 フロントエンドでの統合

```typescript
// src/app/practice/page.tsx の一部
const processTextCorrection = async (text: string) => {
  if (!text.trim()) return;
  
  setProcessingCorrection(true);
  
  try {
    const response = await fetch('/api/correct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        language: selectedLanguage
      }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    setCorrectedSegments(data);
    
    // 修正された文を音声で再生
    if (data[0]?.correction) {
      playCorrectedAudio(data[0].correction);
    }
  } catch (error) {
    console.error("Error processing correction:", error);
    toast.error("修正の処理中にエラーが発生しました。");
  } finally {
    setProcessingCorrection(false);
  }
};
```

## 4. Text-to-Speechの実装

### 4.1 API実装

```typescript
// src/app/api/speak/route.ts
import { NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Text-to-Speech クライアントの初期化
const textToSpeechClient = new TextToSpeechClient({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '{}'),
});

export async function POST(req: Request) {
  try {
    const { text, language } = await req.json();

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // 言語コードと音声名の設定
    const languageCode = getLanguageCode(language || 'en-US');
    const voiceName = getVoiceName(language || 'en-US');

    // リクエストの設定
    const request = {
      input: { text },
      voice: {
        languageCode,
        name: voiceName,
        ssmlGender: 'NEUTRAL',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        pitch: 0,
        speakingRate: 1,
      },
    };

    // Google Cloud Text-to-Speech APIの呼び出し
    const [response] = await textToSpeechClient.synthesizeSpeech(request);
    const audioContent = response.audioContent;

    if (!audioContent) {
      throw new Error('Failed to generate audio content');
    }

    // 音声をbase64エンコードして返す
    const audioBase64 = Buffer.from(audioContent).toString('base64');
    return NextResponse.json({ audioContent: audioBase64 });
  } catch (error) {
    console.error('Error generating speech:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}

// 言語コードの取得
function getLanguageCode(language: string): string {
  const languageCodes: Record<string, string> = {
    'en-US': 'en-US',
    'en-GB': 'en-GB',
    'fr-FR': 'fr-FR',
    'de-DE': 'de-DE',
    'es-ES': 'es-ES',
  };

  return languageCodes[language] || 'en-US';
}

// 音声名の取得
function getVoiceName(language: string): string {
  const voiceNames: Record<string, string> = {
    'en-US': 'en-US-Neural2-C',
    'en-GB': 'en-GB-Neural2-B',
    'fr-FR': 'fr-FR-Neural2-A',
    'de-DE': 'de-DE-Neural2-B',
    'es-ES': 'es-ES-Neural2-C',
  };

  return voiceNames[language] || 'en-US-Neural2-C';
}
```

### 4.2 フロントエンドでの統合

```typescript
// src/app/practice/page.tsx の一部
const playCorrectedAudio = async (text: string) => {
  try {
    const response = await fetch('/api/speak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        language: selectedLanguage
      }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    
    // Base64エンコードされた音声データをデコードして再生
    if (data.audioContent) {
      const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
      
      if (audioRef.current) {
        audioRef.current.src = audioSrc;
        audioRef.current.play().catch(e => {
          console.error("Error playing audio:", e);
          toast.error("音声の再生に失敗しました。");
        });
      }
    }
  } catch (error) {
    console.error("Error playing corrected audio:", error);
    toast.error("音声の再生中にエラーが発生しました。");
  }
};
```

## 5. UIコンポーネント

### 5.1 訂正表示コンポーネント

```tsx
// src/app/practice/page.tsx の一部
// 訂正と説明の表示
<AnimatePresence>
  {correctedSegments.length > 0 && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mt-4"
    >
      <h3 className="font-semibold mb-2 text-blue-900">修正と説明:</h3>
      <div className="space-y-4">
        {correctedSegments.map((segment, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-4 rounded-md border-l-4 border-l-amber-500"
          >
            <div className="flex flex-col space-y-2">
              <div>
                <span className="font-medium">元の文: </span>
                <span className="text-red-600">{segment.text}</span>
              </div>
              <div>
                <span className="font-medium">修正: </span>
                <span className="text-green-600">{segment.correction}</span>
              </div>
              {segment.explanation && (
                <div>
                  <span className="font-medium">説明: </span>
                  <span>{segment.explanation}</span>
                </div>
              )}
              <Button 
                onClick={() => segment.correction && playCorrectedAudio(segment.correction)}
                variant="outline" 
                className="self-start mt-2"
                size="sm"
              >
                <span className="mr-2">🔊</span> 修正を聞く
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

### 5.2 録音ボタンと字幕表示

```tsx
// src/app/practice/page.tsx の一部
// 録音ボタン
<div className="flex justify-center mb-4">
  <Button 
    onClick={toggleListening}
    className={`px-6 py-5 text-lg ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
  >
    {isListening ? '録音を停止' : '録音を開始'}
  </Button>
</div>

// 字幕表示
<div className="bg-white p-4 rounded-md min-h-20 border border-blue-100">
  {transcript ? (
    <p className="text-lg">{transcript}</p>
  ) : (
    <p className="text-gray-400 text-center">「録音を開始」ボタンをクリックして話してください...</p>
  )}
</div>

// 処理中インジケーター
{processingCorrection && (
  <div className="text-center">
    <p className="mb-2 text-blue-800">修正を処理中...</p>
    <Progress value={66} className="w-full h-2" />
  </div>
)}
```

## 6. 環境変数の設定

プロジェクトのルートに`.env.local`ファイルを作成し、以下の環境変数を設定します：

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

## 7. デプロイガイド

### 7.1 Vercelへのデプロイ

1. [Vercel](https://vercel.com/)アカウントを作成
2. GitHubリポジトリと連携
3. 環境変数を設定
4. デプロイボタンをクリック

```bash
# ローカルでのVercelデプロイ (Vercel CLIがインストールされている場合)
vercel
```

### 7.2 その他のデプロイ先

- **Netlify**: 同様にGitHubリポジトリと連携し、環境変数を設定
- **AWS Amplify**: AWS管理コンソールからデプロイ設定
- **DigitalOcean**: App Platformを利用したデプロイ

### 7.3 セルフホスティング

```bash
# ビルド
npm run build

# 起動
npm start
```

## 8. パフォーマンスと最適化のヒント

- APIキャッシュとレート制限を実装し、コスト管理
- インクリメンタルストリーミング処理による応答性の向上
- クライアントサイドキャッシュによるAPI呼び出しの削減
- WebSocketを活用したリアルタイム更新（進捗データなど）

## 9. トラブルシューティング

- **音声認識が動作しない**: ブラウザがWeb Speech APIをサポートしているか確認
- **APIエラー**: 環境変数とAPIキーの設定を確認
- **デプロイ問題**: 環境変数とビルド設定を確認 