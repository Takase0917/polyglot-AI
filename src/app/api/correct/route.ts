import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { APIError } from 'openai';
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';

// Defining interfaces for the correction results
interface CorrectionSegment {
  text: string;
  isCorrect: boolean;
  correction?: string;
  explanation?: string;
}

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
function isQuotaOrBillingError(error: Error | APIError): boolean {
  const apiError = error as APIError;
  const status = apiError.status as number | undefined;
  const code = apiError.code as string | undefined;
  const type = apiError.type as string | undefined;
  
  return !!(
    status === 429 || // 一般的なレート制限
    code === 'insufficient_quota' || // クォータ不足
    type === 'insufficient_quota' || // クォータ不足
    code === 'billing_hard_limit_reached' || // 課金制限到達
    (apiError.message && (
      apiError.message.includes('quota') || 
      apiError.message.includes('billing') || 
      apiError.message.includes('exceeded')
    ))
  );
}

// モックデータ生成
function generateMockCorrection(text: string): CorrectionSegment[] {
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
function safeJsonParse(content: string): CorrectionSegment[] {
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

// OpenAI APIの設定インターフェース
type ChatCompletionConfig = Omit<ChatCompletionCreateParamsNonStreaming, 'model'> & {
  model?: string;
};

// 使用可能なモデルを順番に試す関数
async function tryModels(client: OpenAI, config: ChatCompletionConfig) {
  let lastError = null;
  
  for (const model of OPENAI_MODELS) {
    try {
      console.log(`Trying OpenAI model: ${model}`);
      return await client.chat.completions.create({
        ...config,
        model: model
      });
    } catch (error: unknown) {
      lastError = error as Error | APIError;
      
      // クォータ/課金エラーの場合はループを抜ける
      if (isQuotaOrBillingError(lastError)) {
        console.warn(`OpenAI API quota exceeded or billing issue detected. Error: ${(lastError as Error).message}`);
        if (API_MODE === 'fallback') {
          throw { type: 'quota_exceeded', originalError: lastError, message: 'API quota exceeded' };
        }
        break;
      }
      
      // モデルが見つからないか、アクセス権がない場合は次のモデルを試す
      const apiError = lastError as APIError;
      if (apiError.code === 'model_not_found' || apiError.status === 404) {
        console.warn(`Model ${model} not available, trying next model...`);
        continue;
      }
      
      // その他のエラーの場合はそのままエラーを投げる
      throw lastError;
    }
  }
  
  // 全てのモデルで失敗した場合は最後のエラーを投げる
  throw lastError;
}

// 複数モデルを試行してAPI応答を受け取る関数
export async function POST(req: Request) {
  try {
    const { text, language } = await req.json();

    // テキストが空の場合はエラーを返す
    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // OpenAI clientが利用できない場合はモックデータを返す
    if (!openai) {
      console.log('Using mock correction data as OpenAI client is not available');
      const mockData = generateMockCorrection(text);
      return NextResponse.json(mockData);
    }

    // APIリクエストの設定
    const prompt = generatePrompt(text, language);
    
    const config: ChatCompletionCreateParamsNonStreaming = {
      model: OPENAI_MODELS[0], // Use the first model by default, tryModels will override this
      messages: [
        {
          role: 'system',
          content: `You are a language correction expert focusing on grammar, vocabulary, and natural expression.
          
          Given a text input in ${language || 'English'}, evaluate and correct it as follows:
          
          Return a JSON array with objects containing:
          
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
    } catch (apiError: Error | unknown) {
      // クォータ超過や課金問題の場合はモックレスポンスを提供
      const error = apiError as Error & { type?: string };
      if (error.type === 'quota_exceeded' || isQuotaOrBillingError(error as Error)) {
        console.warn(`OpenAI API quota or billing issue detected, using fallback data: ${(error as Error).message}`);
        const mockData = generateMockCorrection(text);
        return NextResponse.json(mockData);
      }
      
      // その他のエラーの場合はエラーレスポンスを返す
      console.error('Error calling OpenAI API:', apiError);
      return NextResponse.json(
        { error: 'An error occurred while processing the text correction' },
        { status: 500 }
      );
    }
  } catch (error: Error | unknown) {
    console.error('Unexpected error in /api/correct:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// 翻訳やわかりやすい言葉への言い換え
function generatePrompt(text: string, language: string | undefined): string {
  // 言語に応じて指示を生成
  let languageInstruction = '';
  
  if (language === 'ja-JP') {
    languageInstruction = '日本語の文法や自然な表現を確認してください。';
  } else if (language?.startsWith('en')) {
    languageInstruction = 'Check for English grammar and natural expression.';
  } else if (language?.startsWith('fr')) {
    languageInstruction = 'Vérifiez la grammaire française et l\'expression naturelle.';
  } else if (language?.startsWith('de')) {
    languageInstruction = 'Überprüfen Sie die deutsche Grammatik und den natürlichen Ausdruck.';
  } else if (language?.startsWith('es')) {
    languageInstruction = 'Compruebe la gramática española y la expresión natural.';
  } else {
    // デフォルト: 英語
    languageInstruction = 'Check for English grammar and natural expression.';
  }
  
  return `${languageInstruction}
  
  Text to correct:
  "${text}"`;
} 