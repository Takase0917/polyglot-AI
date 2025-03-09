/**
 * @jest-environment node
 */

// Node環境でテストを実行するように指定
import { POST } from './route';

// TextToSpeechClientをモック
jest.mock('@google-cloud/text-to-speech', () => {
  return {
    TextToSpeechClient: jest.fn().mockImplementation(() => ({
      synthesizeSpeech: jest.fn().mockResolvedValue([
        {
          audioContent: Buffer.from('mock audio content')
        }
      ])
    }))
  };
});

describe('/api/speak API endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('should return mock audio data when Text-to-Speech client is not available', async () => {
    // 環境変数をクリアしてText-to-Speech clientがnullになるようにする
    const originalEnv = process.env;
    process.env = { ...originalEnv, GOOGLE_APPLICATION_CREDENTIALS_JSON: '' };

    const req = {
      json: jest.fn().mockResolvedValue({ 
        text: 'This is a test', 
        language: 'en-US' 
      })
    };

    const res = await POST(req as any);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('audioContent');
    expect(typeof data.audioContent).toBe('string');
    expect(data.audioContent.length).toBeGreaterThan(0);

    // 環境変数を元に戻す
    process.env = originalEnv;
  });
}); 