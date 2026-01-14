'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Pop Feature Card with hover effects
 */
function FeatureCard({
  icon,
  title,
  description,
  delay,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  color: 'coral' | 'cyan' | 'yellow' | 'purple' | 'mint';
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const colorClasses = {
    coral: 'from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] hover:shadow-[oklch(0.45_0.15_165)]/30',
    cyan: 'from-[oklch(0.80_0.12_165)] to-[oklch(0.45_0.15_165)] hover:shadow-[oklch(0.80_0.12_165)]/30',
    yellow: 'from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] hover:shadow-[oklch(0.45_0.15_165)]/30',
    purple: 'from-[oklch(0.80_0.12_165)] to-[oklch(0.45_0.15_165)] hover:shadow-[oklch(0.80_0.12_165)]/30',
    mint: 'from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] hover:shadow-[oklch(0.45_0.15_165)]/30',
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden border-0 bg-white transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 rounded-3xl',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 40px -15px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-5', colorClasses[color])} />
      </div>
      <CardContent className="relative p-8">
        <div className={cn(
          'mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3',
          colorClasses[color]
        )}>
          {icon}
        </div>
        <h3 className="mb-3 text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Step Card with playful number badge
 */
function StepCard({
  number,
  title,
  description,
  color,
}: {
  number: number;
  title: string;
  description: string;
  color: 'coral' | 'cyan' | 'purple';
}) {
  const colorClasses = {
    coral: 'from-[oklch(0.45_0.15_165)] to-[oklch(0.35_0.12_165)] shadow-[oklch(0.45_0.15_165)]/30',
    cyan: 'from-[oklch(0.80_0.12_165)] to-[oklch(0.70_0.13_165)] shadow-[oklch(0.80_0.12_165)]/30',
    purple: 'from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] shadow-[oklch(0.45_0.15_165)]/30',
  };

  return (
    <div className="relative flex items-start gap-6 group">
      <div className={cn(
        'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl font-bold text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6',
        colorClasses[color]
      )}>
        {number}
      </div>
      <div className="pt-2">
        <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[oklch(0.99_0.005_165)] text-gray-900 overflow-hidden">
      {/* Decorative Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[oklch(0.45_0.15_165)] opacity-15 blob animate-float" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-[oklch(0.80_0.12_165)] opacity-15 blob-2" style={{ animationDelay: '-2s' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full">
        <div className="mx-4 mt-4">
          <div className="container mx-auto glass rounded-2xl px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] shadow-lg" />
                <span className="text-xl font-bold bg-gradient-to-r from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] bg-clip-text text-transparent">
                  AかBか
                </span>
              </div>
              <Link href="/login?callbackUrl=/dashboard">
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 rounded-xl font-medium">
                  ログイン
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24">
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            {/* Heading */}
            <h1
              className={cn(
                'mb-8 text-[clamp(1.75rem,6vw,4.5rem)] font-extrabold leading-tight tracking-tight transition-all duration-700 delay-100',
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              <span className="text-gray-900 whitespace-nowrap">
                インタラクティブ動画で
              </span>
              <br />
              <span className="gradient-text-sunset inline-block mt-2 whitespace-nowrap">
                学習体験を変革する
              </span>
            </h1>

            {/* Description */}
            <p
              className={cn(
                'mx-auto mb-12 max-w-2xl text-lg text-gray-600 transition-all duration-700 delay-200 sm:text-xl leading-relaxed',
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              視聴者が自ら選択しながら学ぶ、分岐する動画コンテンツを作成。
              従来の動画では実現できなかった没入感のある学習体験を提供します。
            </p>

            {/* CTA Buttons */}
            <div
              className={cn(
                'flex flex-row items-center justify-center gap-3 sm:gap-4 transition-all duration-700 delay-300',
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              <Link href="/login?callbackUrl=/dashboard">
                <Button
                  size="lg"
                  className="h-12 px-4 text-sm sm:h-16 sm:px-10 sm:text-lg bg-gradient-to-r from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] hover:opacity-90 text-white rounded-xl sm:rounded-2xl font-semibold shadow-xl shadow-[oklch(0.45_0.15_165)]/30 transition-all hover:scale-105 hover:shadow-2xl group"
                >
                  無料で始める
                  <svg className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-4 text-sm sm:h-16 sm:px-10 sm:text-lg border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl sm:rounded-2xl font-semibold transition-all hover:scale-105 group"
              >
                <svg className="mr-1 sm:mr-2 h-5 w-5 sm:h-6 sm:w-6 text-[oklch(0.45_0.15_165)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                デモを見る
              </Button>
            </div>
          </div>

          {/* Hero Mockup */}
          <div
            className={cn(
              'mx-auto mt-20 max-w-5xl transition-all duration-1000 delay-500',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            )}
          >
            <div className="relative rounded-3xl bg-white p-3 shadow-2xl shadow-gray-200/50">
              {/* Browser dots */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <div className="h-3 w-3 rounded-full bg-[oklch(0.45_0.15_165)]" />
                <div className="h-3 w-3 rounded-full bg-[oklch(0.60_0.13_165)]" />
                <div className="h-3 w-3 rounded-full bg-[oklch(0.80_0.12_165)]" />
              </div>
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                <div className="relative h-full w-full flex items-center justify-center">
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center px-4">
                      <div className="mx-auto mb-4 sm:mb-6 flex h-16 w-16 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] shadow-2xl shadow-[oklch(0.45_0.15_165)]/40 transition-transform hover:scale-110 cursor-pointer">
                        <svg className="h-8 w-8 sm:h-12 sm:w-12 text-white ml-0.5 sm:ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium text-xs sm:text-base">インタラクティブ動画プレイヤー</p>
                    </div>
                  </div>
                  {/* Choice buttons */}
                  <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-row gap-2 sm:gap-4">
                    <div className="rounded-lg sm:rounded-xl bg-gradient-to-r from-[oklch(0.45_0.15_165)] to-[oklch(0.60_0.13_165)] px-3 sm:px-6 py-1.5 sm:py-2.5 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-[oklch(0.45_0.15_165)]/30 hover:scale-105 transition-transform cursor-pointer text-center">
                      選択肢 A
                    </div>
                    <div className="rounded-lg sm:rounded-xl bg-gradient-to-r from-[oklch(0.80_0.12_165)] to-[oklch(0.45_0.15_165)] px-3 sm:px-6 py-1.5 sm:py-2.5 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-[oklch(0.80_0.12_165)]/30 hover:scale-105 transition-transform cursor-pointer text-center">
                      選択肢 B
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-6 text-[clamp(1.25rem,4vw,3rem)] font-extrabold">
              <span className="whitespace-nowrap">必要な機能がすべて揃った</span>
              <span className="block gradient-text mt-2 whitespace-nowrap">
                オールインワンプラットフォーム
              </span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              動画の作成から配信、分析まで。必要なツールがすべて一箇所に。
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              delay={100}
              color="coral"
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
              title="ビジュアルエディター"
              description="ドラッグ&ドロップで分岐動画を直感的に作成。プログラミング知識は不要です。"
            />
            <FeatureCard
              delay={200}
              color="cyan"
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="詳細な分析"
              description="視聴者の選択パターンや離脱ポイントを可視化。データドリブンな改善が可能に。"
            />
            <FeatureCard
              delay={300}
              color="yellow"
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              }
              title="レスポンシブ対応"
              description="PC、タブレット、スマートフォン。あらゆるデバイスで最適な視聴体験を提供。"
            />
            <FeatureCard
              delay={400}
              color="purple"
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              title="高速配信"
              description="グローバルCDNで世界中どこからでも高速にコンテンツを配信。"
            />
            <FeatureCard
              delay={500}
              color="mint"
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              title="セキュア"
              description="エンタープライズグレードのセキュリティで大切なコンテンツを安全に管理。"
            />
            <FeatureCard
              delay={600}
              color="coral"
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              title="チーム管理"
              description="役割ベースのアクセス制御で、チームでの共同作業もスムーズに。"
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-[oklch(0.45_0.15_165)]/5 to-white/0" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-6 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
              <span className="gradient-text-ocean">3ステップ</span>
              <span className="block text-gray-900 mt-2">で始められる</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              複雑な設定は不要。すぐにインタラクティブ動画を作成できます。
            </p>
          </div>

          <div className="mx-auto max-w-2xl space-y-12">
            <StepCard
              number={1}
              color="coral"
              title="動画をアップロード"
              description="既存の動画ファイルをドラッグ&ドロップでアップロード。MP4形式に対応しています。"
            />
            <div className="ml-7 h-16 w-0.5 bg-gradient-to-b from-[oklch(0.45_0.15_165)] via-[oklch(0.80_0.12_165)] to-transparent rounded-full" />
            <StepCard
              number={2}
              color="cyan"
              title="分岐を設定"
              description="ビジュアルエディターで分岐ポイントと選択肢を設定。フローチャート形式で全体像を把握できます。"
            />
            <div className="ml-7 h-16 w-0.5 bg-gradient-to-b from-[oklch(0.80_0.12_165)] via-[oklch(0.45_0.15_165)] to-transparent rounded-full" />
            <StepCard
              number={3}
              color="purple"
              title="公開・共有"
              description="ワンクリックで公開。URLを共有するだけで、誰でもすぐに視聴を開始できます。"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] opacity-10 blur-[100px]" />
        </div>
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center bg-white rounded-3xl p-12 shadow-2xl shadow-[oklch(0.45_0.15_165)]/10">
            <h2 className="mb-6 text-xl font-extrabold sm:text-2xl lg:text-3xl gradient-text whitespace-nowrap">
              今すぐ始めましょう
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-gray-600 text-lg leading-relaxed">
              無料プランで今すぐスタート。クレジットカードは不要です。
            </p>
            <div className="flex justify-center">
              <Link href="/login?callbackUrl=/dashboard">
                <Button
                  size="lg"
                  className="h-16 px-12 text-lg bg-gradient-to-r from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] hover:opacity-90 text-white rounded-2xl font-semibold shadow-xl shadow-[oklch(0.45_0.15_165)]/30 transition-all hover:scale-105 hover:shadow-2xl group"
                >
                  無料アカウントを作成
                  <svg className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] shadow-lg" />
              <span className="text-xl font-bold gradient-text">AかBか</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2026 AかBか. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-500 hover:text-[oklch(0.45_0.15_165)] transition-colors font-medium">
                プライバシー
              </a>
              <a href="#" className="text-gray-500 hover:text-[oklch(0.45_0.15_165)] transition-colors font-medium">
                利用規約
              </a>
              <a href="#" className="text-gray-500 hover:text-[oklch(0.45_0.15_165)] transition-colors font-medium">
                お問い合わせ
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
