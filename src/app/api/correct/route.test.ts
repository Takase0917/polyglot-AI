/**
 * @jest-environment node
 */

// Node環境でテストを実行するように指定
import { POST } from './route';

// モック化
jest.mock('openai');

// エラー型の拡張
interface OpenAIError extends Error {
  code?: string;
  status?: number;
  type?: string;
}

describe('/api/correct API endpoint', () => {
  let mockCreate: jest.Mock;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 環境変数を設定
    process.env = { ...originalEnv, OPENAI_API_MODE: 'fallback' };
    
    // モックの設定
    mockCreate = jest.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify([
              {
                text: "I go to the store yesterday",
                isCorrect: false,
                correction: "I went to the store yesterday",
                explanation: "Use past tense for completed actions in the past."
              }
            ])
          }
        }
      ]
    });

    // OpenAIモジュールのモックを設定
    jest.doMock('openai', () => {
      return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: mockCreate
            }
          }
        }))
      };
    });

    // ルートモジュールを再度インポートして新しいモックが反映されるようにする
    jest.resetModules();
  });

  afterEach(() => {
    // 環境変数を元に戻す
    process.env = originalEnv;
  });

  it('should return 400 if text is empty', async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ text: '', language: 'en-US' })
    };

    const res = await POST(req as any);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data).toEqual({ error: 'No text provided' });
  });

  it('should return mock data when OpenAI client is not available', async () => {
    // 環境変数をクリアしてOpenAI clientがnullになるようにする
    process.env = { ...originalEnv, OPENAI_API_KEY: '' };

    const req = {
      json: jest.fn().mockResolvedValue({ 
        text: 'I go to the store yesterday', 
        language: 'en-US' 
      })
    };

    const res = await POST(req as any);
    expect(res.status).toBe(200);

    const data = await res.json();
    // モックデータの形式はモックジェネレーターに基づく
    expect(data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        text: expect.any(String),
        isCorrect: expect.any(Boolean)
      })
    ]));
  });

  // クォータエラーをシミュレートして、フォールバックメカニズムをテスト
  it('should handle quota exceeded errors and provide mock data', async () => {
    // OpenAI APIキーを設定
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-key', OPENAI_API_MODE: 'fallback' };

    const req = {
      json: jest.fn().mockResolvedValue({ 
        text: 'I go to the store yesterday', 
        language: 'en-US' 
      })
    };

    // クォータエラーをシミュレート
    mockCreate.mockRejectedValueOnce({
      status: 429,
      code: 'insufficient_quota',
      type: 'insufficient_quota',
      message: 'You exceeded your current quota'
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);

    const data = await res.json();
    // モックデータの形式をチェック
    expect(data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        text: expect.any(String),
        isCorrect: expect.any(Boolean)
      })
    ]));
  });

  // モックじゃなくて実際のAPIを呼び出すために現状はスキップ
  it.skip('should try multiple models if first one fails', async () => {
    process.env = { ...originalEnv, OPENAI_API_KEY: 'mock-key' };

    const req = {
      json: jest.fn().mockResolvedValue({ 
        text: 'I go to the store yesterday', 
        language: 'en-US' 
      })
    };

    // モックの実装をリセット
    mockCreate.mockReset();

    // 最初のモデルは失敗、2つ目は成功するようにモック
    mockCreate
      .mockImplementationOnce(() => {
        const error = new Error('Model not found') as OpenAIError;
        error.code = 'model_not_found';
        error.status = 404;
        throw error;
      })
      .mockImplementationOnce(() => {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify([
                  {
                    text: "I go to the store yesterday",
                    isCorrect: false,
                    correction: "I went to the store yesterday",
                    explanation: "Use past tense for completed actions in the past."
                  }
                ])
              }
            }
          ]
        };
      });

    const res = await POST(req as any);
    expect(res.status).toBe(200);

    // モデルが2回試行されたことを確認
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
}); 