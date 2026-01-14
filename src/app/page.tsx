'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Animated counter with bounce effect
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
    coral: 'from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] hover:shadow-[oklch(0.75_0.18_25)]/30',
    cyan: 'from-[oklch(0.78_0.16_195)] to-[oklch(0.65_0.22_295)] hover:shadow-[oklch(0.78_0.16_195)]/30',
    yellow: 'from-[oklch(0.90_0.18_95)] to-[oklch(0.75_0.18_25)] hover:shadow-[oklch(0.90_0.18_95)]/30',
    purple: 'from-[oklch(0.65_0.22_295)] to-[oklch(0.78_0.16_195)] hover:shadow-[oklch(0.65_0.22_295)]/30',
    mint: 'from-[oklch(0.82_0.14_165)] to-[oklch(0.78_0.16_195)] hover:shadow-[oklch(0.82_0.14_165)]/30',
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
    coral: 'from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.20_25)] shadow-[oklch(0.75_0.18_25)]/30',
    cyan: 'from-[oklch(0.78_0.16_195)] to-[oklch(0.68_0.18_195)] shadow-[oklch(0.78_0.16_195)]/30',
    purple: 'from-[oklch(0.65_0.22_295)] to-[oklch(0.55_0.24_295)] shadow-[oklch(0.65_0.22_295)]/30',
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
    <div className="min-h-screen bg-[oklch(0.99_0.005_280)] text-gray-900 overflow-hidden">
      {/* Decorative Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[oklch(0.75_0.18_25)] opacity-20 blob animate-float" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-[oklch(0.78_0.16_195)] opacity-15 blob-2" style={{ animationDelay: '-2s' }} />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-[oklch(0.90_0.18_95)] opacity-15 blob" style={{ animationDelay: '-4s' }} />
        <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] bg-[oklch(0.65_0.22_295)] opacity-10 blob-2" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full">
        <div className="mx-4 mt-4">
          <div className="container mx-auto glass rounded-2xl px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] shadow-lg" />
                <span className="text-xl font-bold bg-gradient-to-r from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] bg-clip-text text-transparent">
                  InteractiveFlow
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/login?callbackUrl=/dashboard">
                  <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 rounded-xl font-medium">
                    Login
                  </Button>
                </Link>
                <Link href="/login?callbackUrl=/dashboard">
                  <Button className="bg-gradient-to-r from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] hover:opacity-90 text-white rounded-xl font-semibold shadow-lg shadow-[oklch(0.75_0.18_25)]/30 transition-all hover:scale-105 hover:shadow-xl">
                    Start Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24">
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div
              className={cn(
                'mb-8 inline-flex items-center gap-3 rounded-full border-2 border-[oklch(0.75_0.18_25)]/20 bg-white/80 backdrop-blur-sm px-5 py-2.5 text-sm transition-all duration-700 shadow-lg',
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
              )}
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.82_0.14_165)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[oklch(0.82_0.14_165)]"></span>
              </span>
              <span className="text-gray-700 font-medium">Next-Gen Training Platform</span>
            </div>

            {/* Heading */}
            <h1
              className={cn(
                'mb-8 text-5xl font-extrabold leading-tight tracking-tight transition-all duration-700 delay-100 sm:text-6xl lg:text-7xl',
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              <span className="text-gray-900">
                Transform Learning with
              </span>
              <br />
              <span className="gradient-text-sunset inline-block mt-2">
                Interactive Videos
              </span>
            </h1>

            {/* Description */}
            <p
              className={cn(
                'mx-auto mb-12 max-w-2xl text-lg text-gray-600 transition-all duration-700 delay-200 sm:text-xl leading-relaxed',
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              Create branching video content where viewers choose their own path.
              Deliver immersive learning experiences that traditional videos cannot achieve.
            </p>

            {/* CTA Buttons */}
            <div
              className={cn(
                'flex flex-col items-center justify-center gap-4 transition-all duration-700 delay-300 sm:flex-row',
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              <Link href="/login?callbackUrl=/dashboard">
                <Button
                  size="lg"
                  className="h-16 px-10 text-lg bg-gradient-to-r from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] hover:opacity-90 text-white rounded-2xl font-semibold shadow-xl shadow-[oklch(0.75_0.18_25)]/30 transition-all hover:scale-105 hover:shadow-2xl group"
                >
                  Get Started Free
                  <svg className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="h-16 px-10 text-lg border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-2xl font-semibold transition-all hover:scale-105 group"
              >
                <svg className="mr-2 h-6 w-6 text-[oklch(0.75_0.18_25)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch Demo
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
                <div className="h-3 w-3 rounded-full bg-[oklch(0.75_0.18_25)]" />
                <div className="h-3 w-3 rounded-full bg-[oklch(0.90_0.18_95)]" />
                <div className="h-3 w-3 rounded-full bg-[oklch(0.82_0.14_165)]" />
              </div>
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                <div className="relative h-full w-full flex items-center justify-center">
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] shadow-2xl shadow-[oklch(0.75_0.18_25)]/40 transition-transform hover:scale-110 cursor-pointer">
                        <svg className="h-12 w-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">Interactive Video Player</p>
                    </div>
                  </div>
                  {/* Choice buttons */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                    <div className="rounded-2xl bg-gradient-to-r from-[oklch(0.78_0.16_195)] to-[oklch(0.82_0.14_165)] px-8 py-4 text-white font-semibold shadow-xl shadow-[oklch(0.78_0.16_195)]/30 hover:scale-105 transition-transform cursor-pointer">
                      Choice A
                    </div>
                    <div className="rounded-2xl bg-gradient-to-r from-[oklch(0.65_0.22_295)] to-[oklch(0.75_0.18_25)] px-8 py-4 text-white font-semibold shadow-xl shadow-[oklch(0.65_0.22_295)]/30 hover:scale-105 transition-transform cursor-pointer">
                      Choice B
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl bg-white p-8 md:p-12 shadow-xl">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {[
                { value: 98, suffix: '%', label: 'Learning Retention', color: 'from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)]' },
                { value: 3, suffix: 'x', label: 'Engagement Rate', color: 'from-[oklch(0.78_0.16_195)] to-[oklch(0.82_0.14_165)]' },
                { value: 500, suffix: '+', label: 'Companies', color: 'from-[oklch(0.90_0.18_95)] to-[oklch(0.75_0.18_25)]' },
                { value: 50000, suffix: '+', label: 'Videos Created', color: 'from-[oklch(0.65_0.22_295)] to-[oklch(0.78_0.16_195)]' },
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className={cn(
                    'mb-3 text-4xl sm:text-5xl font-extrabold bg-gradient-to-r bg-clip-text text-transparent transition-transform group-hover:scale-110',
                    stat.color
                  )}>
                    {mounted && <AnimatedCounter target={stat.value} suffix={stat.suffix} />}
                  </div>
                  <p className="text-gray-600 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-6 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
              Everything You Need
              <span className="block gradient-text mt-2">
                All-in-One Platform
              </span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              From creation to distribution and analytics. All the tools you need in one place.
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
              title="Visual Editor"
              description="Create branching videos with drag & drop. No coding required."
            />
            <FeatureCard
              delay={200}
              color="cyan"
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="Deep Analytics"
              description="Visualize viewer choice patterns and drop-off points for data-driven improvements."
            />
            <FeatureCard
              delay={300}
              color="yellow"
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              }
              title="Responsive Design"
              description="Optimal viewing experience on PC, tablet, and smartphone."
            />
            <FeatureCard
              delay={400}
              color="purple"
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              title="Global CDN"
              description="Fast content delivery from anywhere in the world."
            />
            <FeatureCard
              delay={500}
              color="mint"
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              title="Enterprise Security"
              description="Securely manage your valuable content with enterprise-grade security."
            />
            <FeatureCard
              delay={600}
              color="coral"
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              title="Team Management"
              description="Smooth collaboration with role-based access control."
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-[oklch(0.75_0.18_25)]/5 to-white/0" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-6 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
              <span className="gradient-text-ocean">3 Simple Steps</span>
              <span className="block text-gray-900 mt-2">to Get Started</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              No complex setup required. Start creating interactive videos right away.
            </p>
          </div>

          <div className="mx-auto max-w-2xl space-y-12">
            <StepCard
              number={1}
              color="coral"
              title="Upload Your Video"
              description="Drag and drop your existing video files. MP4 format supported."
            />
            <div className="ml-7 h-16 w-0.5 bg-gradient-to-b from-[oklch(0.75_0.18_25)] via-[oklch(0.78_0.16_195)] to-transparent rounded-full" />
            <StepCard
              number={2}
              color="cyan"
              title="Set Up Branches"
              description="Configure branch points and choices in the visual editor. Flowchart view for easy overview."
            />
            <div className="ml-7 h-16 w-0.5 bg-gradient-to-b from-[oklch(0.78_0.16_195)] via-[oklch(0.65_0.22_295)] to-transparent rounded-full" />
            <StepCard
              number={3}
              color="purple"
              title="Publish & Share"
              description="One-click publish. Share the URL and viewers can start watching immediately."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] opacity-10 blur-[100px]" />
        </div>
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center bg-white rounded-3xl p-12 shadow-2xl shadow-[oklch(0.75_0.18_25)]/10">
            <h2 className="mb-6 text-3xl font-extrabold sm:text-4xl lg:text-5xl gradient-text">
              Start Today
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-gray-600 text-lg leading-relaxed">
              Get started with our free plan now. No credit card required.
            </p>
            <Link href="/login?callbackUrl=/dashboard">
              <Button
                size="lg"
                className="h-16 px-12 text-lg bg-gradient-to-r from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] hover:opacity-90 text-white rounded-2xl font-semibold shadow-xl shadow-[oklch(0.75_0.18_25)]/30 transition-all hover:scale-105 hover:shadow-2xl group"
              >
                Create Free Account
                <svg className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] shadow-lg" />
              <span className="text-xl font-bold gradient-text">InteractiveFlow</span>
            </div>
            <p className="text-gray-500 text-sm">
              Copyright 2026 InteractiveFlow. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-500 hover:text-[oklch(0.75_0.18_25)] transition-colors font-medium">
                Privacy
              </a>
              <a href="#" className="text-gray-500 hover:text-[oklch(0.75_0.18_25)] transition-colors font-medium">
                Terms
              </a>
              <a href="#" className="text-gray-500 hover:text-[oklch(0.75_0.18_25)] transition-colors font-medium">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
