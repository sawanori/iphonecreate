'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * BranchTransition コンポーネントのProps
 * 対応設計書: DESIGN-FE-2026-001 セクション5.1
 * 対応タスク: phase2-005-branch-transition.md
 */
export interface BranchTransitionProps {
  /** 遷移中かどうか */
  isTransitioning: boolean;
  /** 遷移の種類 */
  type?: 'fade' | 'slide' | 'zoom';
  /** 遷移時間（ミリ秒） */
  duration?: number;
  /** 遷移完了時のコールバック */
  onComplete?: () => void;
  /** 子要素 */
  children: React.ReactNode;
  /** 追加のクラス名 */
  className?: string;
  /** ローディングテキスト */
  loadingText?: string;
}

/**
 * 分岐遷移アニメーションコンポーネント
 *
 * AC-V-004: 選択肢を選ぶと対応する動画に遷移する
 * AC-V-007: 選択から次の動画再生まで2秒以内
 *
 * フェードアウト/フェードインアニメーションを提供し、
 * 遷移中はローディングインジケーターを表示します。
 */
export function BranchTransition({
  isTransitioning,
  type = 'fade',
  duration = 500,
  onComplete,
  children,
  className,
  loadingText = 'Loading next video...',
}: BranchTransitionProps) {
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle');

  useEffect(() => {
    if (isTransitioning) {
      // フェードアウト開始 - use microtask to avoid synchronous setState
      queueMicrotask(() => setPhase('out'));

      // フェードイン開始
      const inTimeout = setTimeout(() => {
        setPhase('in');
      }, duration / 2);

      // 完了
      const completeTimeout = setTimeout(() => {
        setPhase('idle');
        onComplete?.();
      }, duration);

      return () => {
        clearTimeout(inTimeout);
        clearTimeout(completeTimeout);
      };
    }
    // 遷移が終了したらphaseをidleに戻す - use microtask to avoid synchronous setState
    queueMicrotask(() => setPhase('idle'));
    return undefined;
  }, [isTransitioning, duration, onComplete]);

  // アニメーションクラスを取得
  const getAnimationClasses = (): string => {
    if (phase === 'idle') return '';

    switch (type) {
      case 'fade':
        return phase === 'out'
          ? 'opacity-0 transition-opacity'
          : 'opacity-100 transition-opacity';

      case 'slide':
        return phase === 'out'
          ? 'translate-x-full opacity-0 transition-all'
          : 'translate-x-0 opacity-100 transition-all';

      case 'zoom':
        return phase === 'out'
          ? 'scale-110 opacity-0 transition-all'
          : 'scale-100 opacity-100 transition-all';
    }
  };

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ transitionDuration: `${duration / 2}ms` }}
      data-testid="branch-transition"
    >
      <div
        className={cn('w-full h-full', getAnimationClasses())}
        data-testid="branch-transition-content"
      >
        {children}
      </div>

      {/* 遷移オーバーレイ */}
      {isTransitioning && (
        <div
          className={cn(
            'absolute inset-0 bg-black z-30',
            'flex items-center justify-center',
            phase === 'out' ? 'animate-in fade-in' : 'animate-out fade-out'
          )}
          style={{ animationDuration: `${duration / 2}ms` }}
          data-testid="branch-transition-overlay"
          role="status"
          aria-live="polite"
        >
          <div className="text-white text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"
              aria-hidden="true"
            />
            <p className="text-lg">{loadingText}</p>
          </div>
        </div>
      )}
    </div>
  );
}
