import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// APIキーが設定されているかチェック
const apiKey = process.env.OPENAI_API_KEY;

// モードの設定: 'production', 'development', or 'fallback'
// fallbackモードでは、APIエラーが発生した場合に常にモックレスポンスを使用
const API_MODE = process.env.OPENAI_API_MODE || 'fallback';

// 実行環境に応じた初期化またはモックの使用
const getOpenAIClient = () => {
  if (!apiKey) {
    console.warn('OpenAI API key is not set. Using mock responses for development.');
    return null;
  }
  
  return new OpenAI({
    apiKey: apiKey,
  });
};

// OpenAI clientの初期化
const openai = getOpenAIClient();

// 利用可能なOpenAIモデル
const OPENAI_MODELS = [
  'gpt-4o',           // 最新のGPT-4 Omniモデル
  'gpt-4-turbo-preview', 
  'gpt-4-0125-preview',
  'gpt-3.5-turbo'     // フォールバックとして古いモデル
];

// エラーがクォータまたは課金関連かどうかをチェック
function isQuotaOrBillingError(error: any): boolean {
  return (
    error.status === 429 || // 一般的なレート制限
    error.code === 'insufficient_quota' || // クォータ不足
    error.type === 'insufficient_quota' || // クォータ不足
    error.code === 'billing_hard_limit_reached' || // 課金制限到達
    (error.message && (
      error.message.includes('quota') || 
      error.message.includes('billing') || 
      error.message.includes('exceeded')
    ))
  );
}

// モックデータ生成
function generateMockCorrection(text: string): any[] {
  console.log('Using mock correction data due to API issues');
  
  // 簡単な文法チェックのルール
  const mockRules = [
    { pattern: /\b(go|come|run|get|have)\b.+(yesterday|last|ago)/i, 
      replace: (match: string) => match.replace(/\b(go|come|run|get|have)\b/i, (verb) => {
        const pastTense: {[key: string]: string} = {
          'go': 'went', 'come': 'came', 'run': 'ran', 'get': 'got', 'have': 'had'
        };
        return pastTense[verb.toLowerCase()] || verb;
      }),
      explanation: "Use past tense for completed actions in the past." 
    },
    { pattern: /I (is|are|were)\b/i, 
      replace: (match: string) => match.replace(/(is|are|were)/i, 'am'),
      explanation: "Use 'am' with first person singular pronoun 'I'." 
    },
    { pattern: /\bhe (are|am|were)\b/i, 
      replace: (match: string) => match.replace(/(are|am|were)/i, 'is'),
      explanation: "Use 'is' with third person singular pronouns." 
    },
  ];
  
  // テキストに含まれる問題を検出
  for (const rule of mockRules) {
    if (rule.pattern.test(text)) {
      const corrected = text.replace(rule.pattern, rule.replace);
      return [{
        text: text,
        isCorrect: false,
        correction: corrected,
        explanation: rule.explanation
      }];
    }
  }
  
  // デフォルトの修正（何も検出できなかった場合）
  return [{
    text: text,
    isCorrect: true,
    explanation: "No grammatical errors detected (mock response)."
  }];
}

// JSONデータの安全な解析
function safeJsonParse(content: string): any[] {
  try {
    const parsed = JSON.parse(content);
    
    // 解析結果が配列でない場合は空の配列を返す
    if (!Array.isArray(parsed)) {
      console.warn('API returned non-array response:', parsed);
      return [];
    }
    
    return parsed;
  } catch (error) {
    console.error('Error parsing JSON:', error, 'Content:', content);
    return [];
  }
}

// 使用可能なモデルを順番に試す関数
async function tryModels(client: OpenAI, config: any) {
  let lastError = null;
  
  for (const model of OPENAI_MODELS) {
    try {
      console.log(`Trying OpenAI model: ${model}`);
      return await client.chat.completions.create({
        ...config,
        model: model
      });
    } catch (error: any) {
      lastError = error;
      
      // クォータ/課金エラーの場合はループを抜ける
      if (isQuotaOrBillingError(error)) {
        console.warn(`OpenAI API quota exceeded or billing issue detected. Error: ${error.message}`);
        if (API_MODE === 'fallback') {
          throw { type: 'quota_exceeded', originalError: error, message: 'API quota exceeded' };
        }
        break;
      }
      
      // モデルが見つからないか、アクセス権がない場合は次のモデルを試す
      if (error.code === 'model_not_found' || error.status === 404) {
        console.warn(`Model ${model} not available, trying next model...`);
        continue;
      }
      
      // その他のエラーの場合はそのままエラーを投げる
      throw error;
    }
  }
  
  // すべてのモデルが失敗した場合は最後のエラーを投げる
  throw lastError;
}

export async function POST(req: Request) {
  try {
    const { text, language } = await req.json();

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // 開発環境でAPIキーがない場合はモックレスポンスを返す
    if (!openai) {
      console.log('Using mock correction data as OpenAI client is not available');
      const mockData = generateMockCorrection(text);
      return NextResponse.json(mockData);
    }

    // GPT-4用のプロンプト生成
    const prompt = generatePrompt(text, language || 'en-US');

    // OpenAI APIの呼び出し設定
    const config = {
      messages: [
        {
          role: 'system',
          content: `
          You are an expert language teacher. Your task is to identify grammatical errors, 
          vocabulary issues, and unnatural expressions in the text provided. 
          Provide corrections with explanations.
          
          Respond in the following JSON format only:
          [
            {
              "text": "original text segment with error",
              "isCorrect": false,
              "correction": "corrected text segment",
              "explanation": "brief explanation of the error"
            },
            {
              "text": "original text segment without error",
              "isCorrect": true
            }
          ]
          
          If there are no errors, return an array with a single item where isCorrect is true.
          `
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    };

    try {
      // 複数のモデルを試行してレスポンスを取得
      const response = await tryModels(openai, config);

      // Parse the response
      try {
        const content = response.choices[0]?.message?.content || '[]';
        const correctionData = safeJsonParse(content);
        
        // 空の配列の場合は正しいとみなす
        if (correctionData.length === 0) {
          return NextResponse.json([{
            text: text,
            isCorrect: true,
            explanation: "No grammatical errors detected."
          }]);
        }
        
        return NextResponse.json(correctionData);
      } catch (parseError) {
        console.error('Error parsing GPT response:', parseError);
        // パース失敗時はモックデータを返す
        const mockData = generateMockCorrection(text);
        return NextResponse.json(mockData);
      }
    } catch (apiError: any) {
      // クォータ超過や課金問題の場合はモックレスポンスを提供
      if (apiError.type === 'quota_exceeded' || isQuotaOrBillingError(apiError)) {
        const mockData = generateMockCorrection(text);
        return NextResponse.json(mockData);
      }
      
      // その他のエラーは通常通り処理
      throw apiError;
    }
  } catch (error) {
    console.error('Error correcting speech:', error);
    // エラー時でも何らかのレスポンスを返す（空の配列ではなく有効なデータ）
    const errorMockData = [{
      text: "Error occurred during processing",
      isCorrect: true,
      explanation: "The system encountered an error. Please try again later."
    }];
    return NextResponse.json(errorMockData, { status: 500 });
  }
}

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
  The following is spoken text in ${languageName}. 
  Identify any grammatical errors, vocabulary misuse, or unnatural expressions.
  Provide corrections and brief explanations for each issue.
  
  Text: "${text}"
  `;
} 