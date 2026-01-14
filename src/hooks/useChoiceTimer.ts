/**
 * useChoiceTimer - 選択肢タイマーフック
 *
 * 対応設計書: DESIGN-FE-2026-001 セクション8.2
 * 対応タスク: phase2-004-countdown-timer.md
 *
 * 重要: useRefパターンでonTimeoutを保持し、無限ループを防止
 * (設計書v1.1.0の修正指示に基づく)
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useVideoStore } from '@/stores/videoStore';

/**
 * useChoiceTimer フックのオプション
 */
export interface UseChoiceTimerOptions {
  /** タイムアウト時のコールバック */
  onTimeout?: (() => void) | undefined;
  /** 更新間隔（ミリ秒） */
  interval?: number | undefined;
  /** タイマーが有効かどうか */
  enabled?: boolean | undefined;
}

/**
 * useChoiceTimer フックの戻り値
 */
export interface UseChoiceTimerReturn {
  /** 残り時間（秒） */
  remainingTime: number;
  /** 制限時間（秒） */
  timeLimit: number;
  /** 進捗率（0-100） */
  progress: number;
  /** タイマーが動作中かどうか */
  isRunning: boolean;
  /** タイマーをリセット */
  reset: () => void;
  /** タイマーを一時停止 */
  pause: () => void;
  /** タイマーを再開 */
  resume: () => void;
}

/**
 * 選択肢タイマーフック
 *
 * videoStoreのremainingTimeを管理し、タイムアウト時にコールバックを呼び出す
 * useRefパターンでonTimeoutを保持し、親コンポーネントでonTimeoutが
 * 再生成されてもタイマーがリセットされることを防ぐ
 */
export function useChoiceTimer({
  onTimeout,
  interval = 100,
  enabled = true,
}: UseChoiceTimerOptions = {}): UseChoiceTimerReturn {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef = useRef(false);
  const hasTimedOutRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  // onTimeoutをrefで保持（依存配列から除外するため）
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // videoStoreから状態を取得
  const isChoiceVisible = useVideoStore((state) => state.isChoiceVisible);
  const remainingTime = useVideoStore((state) => state.remainingTime);
  const timeLimit = useVideoStore((state) => state.timeLimit);
  const decrementRemainingTime = useVideoStore(
    (state) => state.decrementRemainingTime
  );
  const setRemainingTime = useVideoStore((state) => state.setRemainingTime);

  // 進捗率を計算（0-100）
  const progress = timeLimit > 0 ? (remainingTime / timeLimit) * 100 : 0;

  // タイマーが動作中かどうか (use state instead of ref to avoid accessing ref during render)
  const isRunning =
    isChoiceVisible && !isPaused && remainingTime > 0 && enabled;

  // タイマーをクリア
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // タイムアウト処理
  const handleTimeout = useCallback(() => {
    if (hasTimedOutRef.current) return;
    hasTimedOutRef.current = true;
    clearTimer();
    onTimeoutRef.current?.();
  }, [clearTimer]);

  // タイマーを開始
  const startTimer = useCallback(() => {
    if (!enabled) return;

    clearTimer();
    hasTimedOutRef.current = false;

    intervalRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      decrementRemainingTime();
    }, interval);
  }, [enabled, clearTimer, decrementRemainingTime, interval]);

  // タイマーをリセット
  const reset = useCallback(() => {
    clearTimer();
    setRemainingTime(timeLimit);
    hasTimedOutRef.current = false;
    isPausedRef.current = false;
    setIsPaused(false);

    if (isChoiceVisible && enabled) {
      startTimer();
    }
  }, [clearTimer, setRemainingTime, timeLimit, isChoiceVisible, enabled, startTimer]);

  // タイマーを一時停止
  const pause = useCallback(() => {
    isPausedRef.current = true;
    setIsPaused(true);
  }, []);

  // タイマーを再開
  const resume = useCallback(() => {
    isPausedRef.current = false;
    setIsPaused(false);
  }, []);

  // 選択肢表示時にタイマーを開始
  useEffect(() => {
    if (isChoiceVisible && enabled) {
      hasTimedOutRef.current = false;
      startTimer();
    } else {
      clearTimer();
      isPausedRef.current = false;
      // Use microtask to avoid synchronous setState in effect
      queueMicrotask(() => setIsPaused(false));
    }

    return clearTimer;
  }, [isChoiceVisible, enabled, startTimer, clearTimer]);

  // タイムアウト検出（remainingTimeが0以下になったとき）
  useEffect(() => {
    if (remainingTime <= 0 && isChoiceVisible && !hasTimedOutRef.current && enabled) {
      handleTimeout();
    }
  }, [remainingTime, isChoiceVisible, enabled, handleTimeout]);

  return {
    remainingTime,
    timeLimit,
    progress,
    isRunning,
    reset,
    pause,
    resume,
  };
}
