import { NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// APIキーが設定されているかチェック
const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

// Text-to-Speech クライアントの初期化
let textToSpeechClient: TextToSpeechClient | null = null;

try {
  if (credentialsJson) {
    textToSpeechClient = new TextToSpeechClient({
      credentials: JSON.parse(credentialsJson),
    });
  } else {
    console.warn('Google Cloud credentials not set. Using mock responses for development.');
  }
} catch (error) {
  console.error('Error initializing Text-to-Speech client:', error);
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
    if (!textToSpeechClient) {
      console.log('Using mock audio data as Text-to-Speech client is not available');
      // ダミーのbase64エンコードされたオーディオデータを返す (1秒の無音MP3)
      const mockAudioBase64 = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbMAYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBggICAgICAgICAgICAgICAgICAgICAgICAgKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwP/////////////////////////////////8AAAAKTEFNRTMuMTAwBEoAAAAAAAAAABRJdE9mAQAAABgAEAN2AAAJAAABswQH/+MYxAAAAANIAAAAAExBTUUzLjEwMABBP/AAAAALPAAAAC5AcJAAAD////+AAAAAAoM4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxCoAAAFGAAAAAAAAAIAo8j///3//ygAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
      return NextResponse.json({ audioContent: mockAudioBase64 });
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
        ssmlGender: 'NEUTRAL' as const,
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
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
    const audioBase64 = Buffer.from(audioContent as Uint8Array).toString('base64');
    return NextResponse.json({ audioContent: audioBase64 });
  } catch (error) {
    console.error('Error generating speech:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}

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