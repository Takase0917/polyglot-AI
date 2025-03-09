/**
 * @jest-environment node
 */

// Node環境でテストを実行するように指定
import { POST } from './route';

// TextToSpeechClientのモック
jest.mock('@google-cloud/text-to-speech', () => {
  return {
    TextToSpeechClient: jest.fn().mockImplementation(() => {
      return {
        synthesizeSpeech: jest.fn().mockResolvedValue([
          {
            audioContent: Buffer.from('mocked audio content').toString('base64')
          }
        ])
      };
    })
  };
});

// MockRequestの型を定義
interface MockRequest extends Partial<Request> {
  json: () => Promise<{
    text: string;
    language: string;
  }>;
}

describe('/api/speak API endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if text is empty', async () => {
    const req: MockRequest = {
      json: jest.fn().mockResolvedValue({ text: '', language: 'en-US' })
    };

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data).toEqual({ error: 'No text provided' });
  });

  it('should return mock audio data when Text-to-Speech client is not available', async () => {
    // 環境変数をクリアしてText-to-Speech clientがnullになるようにする
    const originalEnv = process.env;
    process.env = { ...originalEnv };
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    // TextToSpeechClientをnullにするためにモジュールをリロードする
    jest.resetModules();
    
    // Import POSTハンドラーを直接再度インポートせずに実行できるようにする
    const { POST: reloadedPOST } = jest.requireActual('./route');
    
    const req: MockRequest = {
      json: jest.fn().mockResolvedValue({ 
        text: 'Hello world', 
        language: 'en-US' 
      })
    };

    const res = await reloadedPOST(req as unknown as Request);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('audioContent');
    
    // 環境変数を元に戻す
    process.env = originalEnv;
  });
}); 