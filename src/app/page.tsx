'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * アニメーション付きカウンター
 */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/**
 * フィーチャーカード
 */
function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Card
      className={cn(
        'group relative overflow-hidden border-0 bg-gradient-to-br from-gray-900 to-gray-800 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <CardContent className="relative p-8">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
          {icon}
        </div>
        <h3 className="mb-3 text-xl font-bold text-white">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

/**
 * ステップカード
 */
function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex items-start gap-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-bold text-white shadow-lg shadow-blue-500/30">
        {number}
      </div>
      <div>
        <h3 className="mb-2 text-xl font-bold text-white">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ナビゲーション */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
            <span className="text-xl font-bold">InteractiveFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                ログイン
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                無料で始める
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ヒーローセクション */}
      <section className="relative overflow-hidden pt-32 pb-20">
        {/* 背景エフェクト */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[120px]" />
          <div className="absolute top-1/4 right-0 h-[600px] w-[600px] rounded-full bg-purple-500/20 blur-[120px]" />
        </div>

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div
              className={cn(
                'mb-6 inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800/50 px-4 py-2 text-sm transition-all duration-700',
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
              )}
            >
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-gray-300">次世代のトレーニングプラットフォーム</span>
            </div>

            <h1
              className={cn(
                'mb-6 text-5xl font-bold leading-tight tracking-tight transition-all duration-700 delay-100 sm:text-6xl lg:text-7xl',
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                インタラクティブ動画で
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                学習体験を変革する
              </span>
            </h1>

            <p
              className={cn(
                'mx-auto mb-10 max-w-2xl text-lg text-gray-400 transition-all duration-700 delay-200 sm:text-xl',
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              分岐する動画コンテンツで、視聴者が自ら選択しながら学ぶ。
              従来の一方向的な動画では実現できなかった、
              没入感のある学習体験を提供します。
            </p>

            <div
              className={cn(
                'flex flex-col items-center justify-center gap-4 transition-all duration-700 delay-300 sm:flex-row',
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              <Link href="/login">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40"
                >
                  無料で始める
                  <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg border-gray-700 bg-transparent text-white hover:bg-gray-800"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                デモを見る
              </Button>
            </div>
          </div>

          {/* ヒーロー画像/モックアップ */}
          <div
            className={cn(
              'mx-auto mt-16 max-w-5xl transition-all duration-1000 delay-500',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            )}
          >
            <div className="relative rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800 p-2 shadow-2xl">
              <div className="aspect-video rounded-xl bg-gray-900 overflow-hidden">
                <div className="relative h-full w-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  {/* プレイヤーモックアップ */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                        <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <p className="text-gray-400">インタラクティブ動画プレイヤー</p>
                    </div>
                  </div>
                  {/* 選択肢オーバーレイ */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                    <div className="rounded-lg bg-blue-500/90 px-6 py-3 text-white shadow-lg backdrop-blur-sm">
                      選択肢 A
                    </div>
                    <div className="rounded-lg bg-purple-500/90 px-6 py-3 text-white shadow-lg backdrop-blur-sm">
                      選択肢 B
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 数字セクション */}
      <section className="border-y border-gray-800 bg-gray-900/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: 98, suffix: '%', label: '学習定着率の向上' },
              { value: 3, suffix: '倍', label: 'エンゲージメント' },
              { value: 500, suffix: '+', label: '導入企業' },
              { value: 50000, suffix: '+', label: '作成された動画' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mb-2 text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent sm:text-5xl">
                  {mounted && <AnimatedCounter target={stat.value} suffix={stat.suffix} />}
                </div>
                <p className="text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 機能セクション */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              すべてが揃った
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                オールインワン
              </span>
              プラットフォーム
            </h2>
            <p className="text-gray-400 text-lg">
              動画の作成から配信、分析まで。必要な機能がすべて揃っています。
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              delay={100}
              icon={
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
              title="ビジュアルエディター"
              description="ドラッグ&ドロップで直感的に分岐動画を作成。プログラミング知識は不要です。"
            />
            <FeatureCard
              delay={200}
              icon={
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="詳細な分析"
              description="視聴者の選択パターンや離脱ポイントを可視化。データドリブンな改善が可能に。"
            />
            <FeatureCard
              delay={300}
              icon={
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              }
              title="レスポンシブ対応"
              description="PC、タブレット、スマートフォン。あらゆるデバイスで最適な視聴体験を提供。"
            />
            <FeatureCard
              delay={400}
              icon={
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              title="高速配信"
              description="グローバルCDNで世界中どこからでも高速にコンテンツを配信。"
            />
            <FeatureCard
              delay={500}
              icon={
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              title="セキュア"
              description="エンタープライズグレードのセキュリティ。大切なコンテンツを安全に管理。"
            />
            <FeatureCard
              delay={600}
              icon={
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              title="チーム管理"
              description="役割ベースのアクセス制御で、チームでの共同作業もスムーズに。"
            />
          </div>
        </div>
      </section>

      {/* 使い方セクション */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                3ステップ
              </span>
              で始められる
            </h2>
            <p className="text-gray-400 text-lg">
              複雑な設定は不要。すぐにインタラクティブ動画を作成できます。
            </p>
          </div>

          <div className="mx-auto max-w-2xl space-y-12">
            <StepCard
              number={1}
              title="動画をアップロード"
              description="既存の動画ファイルをドラッグ&ドロップでアップロード。MP4形式に対応しています。"
            />
            <div className="ml-6 h-12 w-px bg-gradient-to-b from-purple-500 to-transparent" />
            <StepCard
              number={2}
              title="分岐を設定"
              description="ビジュアルエディターで分岐ポイントと選択肢を設定。フローチャート形式で全体像を把握できます。"
            />
            <div className="ml-6 h-12 w-px bg-gradient-to-b from-purple-500 to-transparent" />
            <StepCard
              number={3}
              title="公開・共有"
              description="ワンクリックで公開。URLを共有するだけで、誰でもすぐに視聴を開始できます。"
            />
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/20 blur-[100px]" />
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            今すぐ始めましょう
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-gray-400 text-lg">
            無料プランで今すぐスタート。クレジットカードは不要です。
          </p>
          <Link href="/login">
            <Button
              size="lg"
              className="h-14 px-10 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/30"
            >
              無料アカウントを作成
              <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-gray-800 bg-gray-950 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
              <span className="text-xl font-bold">InteractiveFlow</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2026 InteractiveFlow. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                プライバシー
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                利用規約
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                お問い合わせ
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
