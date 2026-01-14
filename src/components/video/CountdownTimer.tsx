/**
 * CountdownTimer - カウントダウンタイマーコンポーネント
 *
 * 対応設計書: DESIGN-FE-2026-001 セクション5.1, 5.5
 * 対応タスク: phase2-004-countdown-timer.md, phase2-007-responsive.md
 *
 * 機能:
 * - 残り時間を視覚的に表示（円形プログレス）
 * - 残り3秒で警告色に変化
 * - アクセシビリティ対応（aria-live、aria-valuetext）
 * - レスポンシブデザイン対応
 */

'use client';

import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useChoiceTimer } from '@/hooks/useChoiceTimer';

/**
 * CountdownTimer コンポーネントのProps
 */
export interface CountdownTimerProps {
  /** タイムアウト時のコールバック */
  onTimeout?: () => void;
  /** 表示形式 */
  variant?: 'default' | 'compact' | 'minimal';
  /** 追加のクラス名 */
  className?: string;
  /** 表示するかどうか */
  visible?: boolean;
}

/**
 * カウントダウンタイマーコンポーネント
 *
 * 選択肢表示時に残り時間を視覚的に表示する
 * - 残り時間が50%以上: 青色（通常）
 * - 残り時間が20-50%: 黄色（注意）
 * - 残り時間が20%未満: 赤色（警告）
 *
 * レスポンシブ対応:
 * - xs/mobile: コンパクトサイズ
 * - sm+: 標準サイズ
 * - md+: 大きめサイズ
 */
export function CountdownTimer({
  onTimeout,
  variant = 'default',
  className,
  visible = true,
}: CountdownTimerProps) {
  const { remainingTime, timeLimit, progress, isRunning } = useChoiceTimer({
    onTimeout,
    enabled: visible,
  });

  // 残り時間のフォーマット
  const formattedTime = useMemo(() => {
    const seconds = Math.ceil(remainingTime);
    if (variant === 'minimal') {
      return seconds.toString();
    }
    return `${seconds}秒`;
  }, [remainingTime, variant]);

  // 残り秒数（整数）
  const remainingSeconds = Math.ceil(remainingTime);

  // 残り時間に基づくテキスト色
  const colorClass = useMemo(() => {
    if (progress > 50) return 'text-white';
    if (progress > 20) return 'text-yellow-400';
    return 'text-red-400';
  }, [progress]);

  // プログレスバーの色
  const progressColorClass = useMemo(() => {
    if (progress > 50) return '[&>div]:bg-blue-500';
    if (progress > 20) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-red-500';
  }, [progress]);

  // 円形プログレスのボーダー色
  const circleColorClass = useMemo(() => {
    if (progress > 50) return 'border-blue-500';
    if (progress > 20) return 'border-yellow-500';
    return 'border-red-500';
  }, [progress]);

  // 非表示またはタイムリミットが0の場合は何も表示しない
  if (!visible || timeLimit === 0) return null;

  // コンパクト表示 - レスポンシブ
  if (variant === 'compact') {
    return (
      <div
        className={cn('flex items-center gap-2', className)}
        role="timer"
        aria-live="polite"
        aria-label={`残り${remainingSeconds}秒`}
      >
        <span
          className={cn(
            // Responsive text size
            'text-base sm:text-lg font-bold tabular-nums',
            colorClass
          )}
        >
          {formattedTime}
        </span>
        <Progress
          value={progress}
          // Responsive width
          className={cn('w-16 sm:w-20 md:w-24 h-2', progressColorClass)}
          aria-label="残り時間"
        />
      </div>
    );
  }

  // 最小表示（円形） - レスポンシブ
  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full',
          // Responsive size
          'w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16',
          'border-4 transition-colors duration-300',
          circleColorClass,
          // 残り3秒以下でパルスアニメーション
          remainingSeconds <= 3 && isRunning && 'animate-pulse',
          className
        )}
        role="timer"
        aria-live="polite"
        aria-label={`残り${remainingSeconds}秒`}
      >
        <span
          className={cn(
            // Responsive text size
            'text-lg sm:text-xl md:text-2xl font-bold tabular-nums',
            colorClass
          )}
        >
          {formattedTime}
        </span>
      </div>
    );
  }

  // デフォルト表示 - レスポンシブ
  return (
    <div
      // Responsive max-width
      className={cn('w-full max-w-[280px] sm:max-w-xs', className)}
      role="timer"
      aria-live="polite"
      aria-label={`残り${remainingSeconds}秒`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm text-gray-400">残り時間</span>
        <span
          className={cn(
            // Responsive text size
            'text-xl sm:text-2xl font-bold tabular-nums transition-colors duration-300',
            colorClass
          )}
        >
          {formattedTime}
        </span>
      </div>
      <Progress
        value={progress}
        // Responsive height
        className={cn('h-2 sm:h-3 transition-all duration-100', progressColorClass)}
        aria-label={`残り${remainingSeconds}秒`}
      />
      {/* 緊急時の警告メッセージ（残り20%以下） - レスポンシブ */}
      {progress <= 20 && isRunning && (
        <div className="mt-2 text-center">
          <span className="text-red-400 text-xs sm:text-sm animate-pulse">
            時間切れが近づいています
          </span>
        </div>
      )}
    </div>
  );
}
