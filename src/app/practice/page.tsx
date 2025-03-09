"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";

interface TranscriptSegment {
  text: string;
  isCorrect: boolean;
  correction?: string;
  explanation?: string;
}

export default function PracticePage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [correctedSegments, setCorrectedSegments] = useState<TranscriptSegment[]>([]);
  const [processingCorrection, setProcessingCorrection] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && 'webkitSpeechRecognition' in window) {
      // @ts-ignore - webkitSpeechRecognition is not in the types
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
        
        // Process with GPT for corrections when speech pauses
        if (result.isFinal) {
          processTextCorrection(transcriptText);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        toast.error("音声認識エラー: " + event.error);
        setIsListening(false);
      };
    } else {
      toast.error("お使いのブラウザは音声認識をサポートしていません。");
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
      setCorrectedSegments([]);
    }
  };

  const processTextCorrection = async (text: string) => {
    if (!text.trim()) return;
    
    setProcessingCorrection(true);
    
    try {
      // Call our correction API
      const response = await fetch('/api/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: selectedLanguage }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate API response format
      if (Array.isArray(data) && data.length > 0) {
        setCorrectedSegments(data);
        
        // Play the corrected text if there's a correction
        const correctionItem = data.find(item => !item.isCorrect && item.correction);
        if (correctionItem) {
          playCorrectedAudio(correctionItem.correction);
        }
      } else {
        console.error("Unexpected API response format:", data);
        
        // Handle invalid format by creating a generic feedback
        const fallbackData = [{
          text: text,
          isCorrect: true,
          explanation: "Unable to analyze text. Speech recognition was successful, but analysis failed."
        }];
        
        setCorrectedSegments(fallbackData);
        toast.error("分析結果の取得に失敗しました。もう一度お試しください。");
      }
    } catch (error) {
      console.error("Error processing correction:", error);
      toast.error("修正の処理中にエラーが発生しました。");
      
      // For development purposes when API isn't available
      if (process.env.NODE_ENV === 'development') {
        const mockCorrection = [
          {
            text: text,
            isCorrect: false,
            correction: text.includes('go') ? text.replace('go', 'went') : text + ' (corrected)',
            explanation: "This is a mock correction for development."
          }
        ];
        setCorrectedSegments(mockCorrection);
      }
    } finally {
      setProcessingCorrection(false);
    }
  };

  const playCorrectedAudio = async (text: string) => {
    try {
      // Call our text-to-speech API
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: selectedLanguage }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // If we have audio content
      if (data.audioContent) {
        // Convert base64 to audio source
        const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
        
        if (audioRef.current) {
          audioRef.current.src = audioSrc;
          audioRef.current.play().catch(e => {
            console.error("Error playing audio:", e);
            toast.error("音声の再生に失敗しました。");
          });
        }
      } else {
        throw new Error("No audio content received");
      }
    } catch (error) {
      console.error("Error playing corrected audio:", error);
      toast.error("音声の再生中にエラーが発生しました。");
      
      // For testing purposes when API isn't available
      if (process.env.NODE_ENV === 'development') {
        console.log("Development mode: Would play audio for text:", text);
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-blue-50 to-indigo-100 p-4">
      <header className="w-full max-w-4xl flex justify-between items-center py-4">
        <Link href="/">
          <h1 className="text-2xl font-bold text-blue-900 cursor-pointer">PolyglotAI</h1>
        </Link>
        <select 
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="p-2 rounded border border-blue-200"
        >
          <option value="en-US">English (US)</option>
          <option value="en-GB">English (UK)</option>
          <option value="fr-FR">French</option>
          <option value="de-DE">German</option>
          <option value="es-ES">Spanish</option>
        </select>
      </header>

      <main className="w-full max-w-4xl flex-1 flex flex-col items-center justify-start mt-8">
        <Card className="shadow-lg border-blue-200 w-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center">スピーキング練習</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center mb-4">
              <Button 
                onClick={toggleListening}
                className={`px-6 py-5 text-lg ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isListening ? '録音を停止' : '録音を開始'}
              </Button>
            </div>

            {/* Transcript Display */}
            <div className="bg-white p-4 rounded-md min-h-20 border border-blue-100">
              {transcript ? (
                <p className="text-lg">{transcript}</p>
              ) : (
                <p className="text-gray-400 text-center">「録音を開始」ボタンをクリックして話してください...</p>
              )}
            </div>

            {/* Processing Indicator */}
            {processingCorrection && (
              <div className="text-center">
                <p className="mb-2 text-blue-800">修正を処理中...</p>
                <Progress value={66} className="w-full h-2" />
              </div>
            )}

            {/* Corrections Display */}
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
                        className={`bg-white p-4 rounded-md border-l-4 ${segment.isCorrect ? 'border-l-green-500' : 'border-l-amber-500'}`}
                      >
                        <div className="flex flex-col space-y-2">
                          <div>
                            <span className="font-medium">元の文: </span>
                            <span className={segment.isCorrect ? 'text-green-600' : 'text-red-600'}>
                              {segment.text}
                            </span>
                          </div>
                          {!segment.isCorrect && (
                            <>
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
                            </>
                          )}
                          {segment.isCorrect && (
                            <div className="text-green-600">
                              <span className="font-medium">👍 </span>
                              <span>正しい表現です！</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </main>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
} 