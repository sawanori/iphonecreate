# タスク: カウントダウンタイマー

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase2-004 |
| フェーズ | Phase 2: 視聴画面MVP |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

選択肢表示時のカウントダウンタイマーコンポーネントとカスタムフックを作成する。プログレスバーの表示とタイムアウト処理を実装する。

---

## 前提条件

### 依存タスク
- phase2-003-choice-overlay.md（ChoiceOverlay が存在すること）

### 前提成果物
- `src/stores/videoStore.ts`
- `src/components/video/ChoiceOverlay.tsx`
- Progress コンポーネント（shadcn/ui）

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/components/video/CountdownTimer.tsx` | 新規作成 |
| `src/hooks/useChoiceTimer.ts` | 新規作成 |
| `src/hooks/index.ts` | 新規作成 |
| `src/components/video/index.ts` | 更新 |

---

## 実装詳細

### ステップ 1: useChoiceTimer フック作成

`src/hooks/useChoiceTimer.ts`:

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { useVideoStore } from '@/stores/videoStore';

/**
 * useChoiceTimer フックのオプション
 */
export interface UseChoiceTimerOptions {
  /** タイムアウト時のコールバック */
  onTimeout?: () => void;
  /** 更新間隔（ミリ秒） */
  interval?: number;
  /** タイマーが有効かどうか */
  enabled?: boolean;
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
 */
export function useChoiceTimer({
  onTimeout,
  interval = 100,
  enabled = true,
}: UseChoiceTimerOptions = {}): UseChoiceTimerReturn {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);
  const hasTimedOutRef = useRef(false);

  const isChoiceVisible = useVideoStore((state) => state.isChoiceVisible);
  const remainingTime = useVideoStore((state) => state.remainingTime);
  const timeLimit = useVideoStore((state) => state.timeLimit);
  const decrementRemainingTime = useVideoStore((state) => state.decrementRemainingTime);
  const setRemainingTime = useVideoStore((state) => state.setRemainingTime);

  // 進捗率を計算
  const progress = timeLimit > 0 ? (remainingTime / timeLimit) * 100 : 0;

  // タイマーが動作中かどうか
  const isRunning = isChoiceVisible && !isPausedRef.current && remainingTime > 0;

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
    onTimeout?.();
  }, [onTimeout]);

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

    if (isChoiceVisible && enabled) {
      startTimer();
    }
  }, [clearTimer, setRemainingTime, timeLimit, isChoiceVisible, enabled, startTimer]);

  // タイマーを一時停止
  const pause = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  // タイマーを再開
  const resume = useCallback(() => {
    isPausedRef.current = false;
  }, []);

  // 選択肢表示時にタイマーを開始
  useEffect(() => {
    if (isChoiceVisible && enabled) {
      hasTimedOutRef.current = false;
      startTimer();
    } else {
      clearTimer();
      isPausedRef.current = false;
    }

    return clearTimer;
  }, [isChoiceVisible, enabled, startTimer, clearTimer]);

  // タイムアウト検出
  useEffect(() => {
    if (remainingTime <= 0 && isChoiceVisible && !hasTimedOutRef.current) {
      handleTimeout();
    }
  }, [remainingTime, isChoiceVisible, handleTimeout]);

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
```

### ステップ 2: CountdownTimer コンポーネント作成

`src/components/video/CountdownTimer.tsx`:

```typescript
'use client';

import { useEffect, useMemo } from 'react';
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

  // 残り時間に基づく色
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

  if (!visible || timeLimit === 0) return null;

  // コンパクト表示
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className={cn('text-lg font-bold tabular-nums', colorClass)}>
          {formattedTime}
        </span>
        <Progress
          value={progress}
          className={cn('w-24 h-2', progressColorClass)}
        />
      </div>
    );
  }

  // 最小表示
  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'flex items-center justify-center w-12 h-12 rounded-full',
          'border-4 transition-colors',
          progress > 50
            ? 'border-blue-500'
            : progress > 20
              ? 'border-yellow-500'
              : 'border-red-500',
          className
        )}
      >
        <span className={cn('text-xl font-bold tabular-nums', colorClass)}>
          {formattedTime}
        </span>
      </div>
    );
  }

  // デフォルト表示
  return (
    <div className={cn('w-full max-w-xs', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">残り時間</span>
        <span
          className={cn(
            'text-2xl font-bold tabular-nums transition-colors',
            colorClass
          )}
        >
          {formattedTime}
        </span>
      </div>
      <Progress
        value={progress}
        className={cn('h-3 transition-all', progressColorClass)}
      />
      {/* 緊急時のパルスアニメーション */}
      {progress <= 20 && isRunning && (
        <div className="mt-2 text-center">
          <span className="text-red-400 text-sm animate-pulse">
            時間切れが近づいています
          </span>
        </div>
      )}
    </div>
  );
}
```

### ステップ 3: hooks インデックスファイル作成

`src/hooks/index.ts`:

```typescript
export { useChoiceTimer } from './useChoiceTimer';
export type { UseChoiceTimerOptions, UseChoiceTimerReturn } from './useChoiceTimer';
```

### ステップ 4: video コンポーネントインデックス更新

`src/components/video/index.ts`:

```typescript
export { VideoPlayer } from './VideoPlayer';
export type { VideoPlayerProps, VideoPlayerRef } from './VideoPlayer';

export { ChoiceOverlay } from './ChoiceOverlay';
export type { ChoiceOverlayProps } from './ChoiceOverlay';

export { CountdownTimer } from './CountdownTimer';
export type { CountdownTimerProps } from './CountdownTimer';
```

---

## 完了条件

- [x] useChoiceTimer フックが作成されている
- [x] CountdownTimer コンポーネントが作成されている
- [x] AC-V-003: カウントダウンタイマーが表示され、残り時間が減少する
- [x] AC-V-005: 制限時間超過で動画が一時停止する（タイムアウトコールバック）
- [x] プログレスバーが滑らかに減少する

---

## テスト方法

### 1. タイマー動作テスト

`src/app/test/timer/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { CountdownTimer } from '@/components/video';
import { useVideoStore } from '@/stores/videoStore';
import { Button } from '@/components/ui/button';

export default function TimerTestPage() {
  const [timeoutCount, setTimeoutCount] = useState(0);
  const { showChoices, hideChoices, isChoiceVisible } = useVideoStore();

  const handleShowTimer = (timeLimit: number) => {
    showChoices(
      [
        { id: 'c1', text: 'テスト選択肢1', targetNodeId: 'n1', order: 0 },
        { id: 'c2', text: 'テスト選択肢2', targetNodeId: 'n2', order: 1 },
      ],
      timeLimit
    );
  };

  const handleTimeout = () => {
    setTimeoutCount((prev) => prev + 1);
    console.log('タイムアウト発生!');
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold">CountdownTimer テスト</h1>

      <div className="flex gap-4 flex-wrap">
        <Button onClick={() => handleShowTimer(10)}>10秒タイマー</Button>
        <Button onClick={() => handleShowTimer(5)}>5秒タイマー</Button>
        <Button onClick={() => handleShowTimer(3)}>3秒タイマー</Button>
        <Button onClick={hideChoices} variant="outline">
          タイマー停止
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Default</h2>
          <div className="bg-gray-900 p-6 rounded-lg">
            <CountdownTimer
              onTimeout={handleTimeout}
              variant="default"
              visible={isChoiceVisible}
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Compact</h2>
          <div className="bg-gray-900 p-6 rounded-lg">
            <CountdownTimer
              onTimeout={handleTimeout}
              variant="compact"
              visible={isChoiceVisible}
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Minimal</h2>
          <div className="bg-gray-900 p-6 rounded-lg">
            <CountdownTimer
              onTimeout={handleTimeout}
              variant="minimal"
              visible={isChoiceVisible}
            />
          </div>
        </div>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <p>タイムアウト回数: {timeoutCount}</p>
        <p>タイマー表示中: {isChoiceVisible ? 'はい' : 'いいえ'}</p>
      </div>
    </div>
  );
}
```

### 2. 動作確認

```bash
npm run dev
# http://localhost:3000/test/timer にアクセス

# 確認項目:
# - タイマーが正確にカウントダウンする
# - プログレスバーが滑らかに減少する
# - 残り時間が少なくなると色が変わる（青→黄→赤）
# - タイムアウト時にコールバックが呼ばれる
# - タイマー停止で表示が消える
```

### 3. 精度テスト

```typescript
// useChoiceTimer.ts に精度テストコードを追加
useEffect(() => {
  if (isChoiceVisible && timeLimit > 0) {
    const startTime = Date.now();
    const expectedDuration = timeLimit * 1000;

    return () => {
      const actualDuration = Date.now() - startTime;
      const drift = actualDuration - expectedDuration;
      console.log(`タイマー精度: ${drift}ms のずれ`);
    };
  }
}, [isChoiceVisible, timeLimit]);
```

目標: ずれが500ms以内

### 4. パフォーマンス確認

```bash
# React DevTools > Profiler でリレンダリング回数を確認
# 100msごとの更新でパフォーマンス問題がないことを確認
```

---

## 参照設計書セクション

- DESIGN-FE-2026-001 セクション5.1: 視聴画面コンポーネント
- DESIGN-FE-2026-001 セクション8.2: カスタムフック

---

## 成果物

- `src/hooks/useChoiceTimer.ts`: タイマーカスタムフック
- `src/components/video/CountdownTimer.tsx`: タイマーコンポーネント
- `src/hooks/index.ts`: フックエクスポート

---

## 注意事項

- `setInterval` は不正確な場合があるため、実際の時間差を考慮
- `tabular-nums` クラスで数字の幅を固定（ちらつき防止）
- タイムアウトは1回のみ発生させる（重複呼び出し防止）

---

## 次のタスク

- phase2-005-branch-transition.md: 分岐遷移ロジック
