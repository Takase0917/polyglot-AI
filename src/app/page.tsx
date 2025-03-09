"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-blue-900 mb-2">PolyglotAI</h1>
        <p className="text-xl text-blue-700">AI-Powered Language Speaking Practice</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-4xl"
      >
        <Card className="shadow-lg border-blue-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">言語練習をはじめましょう</CardTitle>
            <CardDescription className="text-center">
              リアルタイムでAIからフィードバックを受けながら外国語の会話練習ができます
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <FeatureCard 
                title="リアルタイム字幕" 
                description="あなたの発話を即座に文字として表示します"
                icon="🎤"
              />
              <FeatureCard 
                title="間違いのハイライト" 
                description="文法や語彙の誤りをAIが自動検出し、修正提案を表示します"
                icon="✨"
              />
              <FeatureCard 
                title="発音練習" 
                description="修正された文を音声で聞き、正しい発音を練習できます"
                icon="🔊"
              />
              <FeatureCard 
                title="進捗の記録" 
                description="練習の記録を保存し、時間経過による上達を確認できます"
                icon="📊"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Link href="/practice">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
                練習を始める
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
      
      <footer className="mt-16 text-center text-blue-600">
        <p>© 2024 PolyglotAI - 言語学習のためのAIアシスタント</p>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-white p-4 rounded-lg shadow-md border border-blue-100"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </motion.div>
  );
}
