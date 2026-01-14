# タスク: 選択肢オーバーレイコンポーネント

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase2-003 |
| フェーズ | Phase 2: 視聴画面MVP |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

動画上に表示される選択肢オーバーレイコンポーネントを作成する。2択の選択肢ボタン、アニメーション、選択時のコールバックを実装する。

---

## 前提条件

### 依存タスク
- phase2-002-video-store.md（videoStore が存在すること）

### 前提成果物
- `src/stores/videoStore.ts`
- `src/types/branch.ts` の `Choice` 型
- Button コンポーネント（shadcn/ui）

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/components/video/ChoiceOverlay.tsx` | 新規作成 |
| `src/components/video/index.ts` | 更新 |

---

## 実装詳細

### ステップ 1: ChoiceOverlay コンポーネント作成

`src/components/video/ChoiceOverlay.tsx`:

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Choice } from '@/types';

/**
 * ChoiceOverlay コンポーネントのProps
 */
export interface ChoiceOverlayProps {
  /** 表示する選択肢 */
  choices: Choice[];
  /** 表示状態 */
  isVisible: boolean;
  /** 選択時のコールバック */
  onSelect: (choice: Choice) => void;
  /** 残り時間（秒） */
  remainingTime?: number;
  /** 制限時間（秒） */
  timeLimit?: number;
  /** 追加のクラス名 */
  className?: string;
  /** 無効状態 */
  disabled?: boolean;
}

/**
 * 選択肢オーバーレイコンポーネント
 */
export function ChoiceOverlay({
  choices,
  isVisible,
  onSelect,
  remainingTime,
  timeLimit,
  className,
  disabled = false,
}: ChoiceOverlayProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  // 表示時にアニメーション開始
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setSelectedChoiceId(null);
    }
  }, [isVisible]);

  // 選択肢クリック処理
  const handleChoiceClick = useCallback(
    (choice: Choice) => {
      if (disabled || selectedChoiceId) return;

      setSelectedChoiceId(choice.id);

      // 選択アニメーション後にコールバック実行
      setTimeout(() => {
        onSelect(choice);
      }, 300);
    },
    [disabled, selectedChoiceId, onSelect]
  );

  // 非表示状態
  if (!isVisible) return null;

  // 選択肢を順序でソート
  const sortedChoices = [...choices].sort((a, b) => a.order - b.order);

  // 残り時間の割合
  const timeProgress = timeLimit && remainingTime !== undefined
    ? (remainingTime / timeLimit) * 100
    : 100;

  // 残り時間が少ない場合の警告色
  const isTimeLow = timeProgress < 30;

  return (
    <div
      className={cn(
        'choice-overlay absolute inset-0 flex flex-col items-center justify-center',
        'bg-black/70 backdrop-blur-sm z-20',
        isAnimating && 'animate-fade-in',
        className
      )}
      role="dialog"
      aria-label="選択肢"
    >
      {/* タイマー表示 */}
      {timeLimit && remainingTime !== undefined && (
        <div className="mb-8 text-center">
          <p
            className={cn(
              'text-2xl font-bold mb-2 transition-colors',
              isTimeLow ? 'text-red-400' : 'text-white'
            )}
          >
            残り {remainingTime.toFixed(1)} 秒
          </p>
          <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-100 ease-linear',
                isTimeLow ? 'bg-red-500' : 'bg-blue-500'
              )}
              style={{ width: `${timeProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 選択肢ボタン */}
      <div className="flex flex-col sm:flex-row gap-4 px-4 w-full max-w-2xl">
        {sortedChoices.map((choice, index) => (
          <Button
            key={choice.id}
            onClick={() => handleChoiceClick(choice)}
            disabled={disabled || selectedChoiceId !== null}
            size="lg"
            variant={selectedChoiceId === choice.id ? 'default' : 'secondary'}
            className={cn(
              'choice-button flex-1 min-h-[64px] text-lg font-medium',
              'transition-all duration-200',
              'hover:scale-105 active:scale-95',
              'focus:ring-4 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black',
              // アニメーション遅延
              isAnimating && `animate-slide-up`,
              // 選択状態
              selectedChoiceId === choice.id && 'ring-4 ring-blue-500 scale-105',
              selectedChoiceId && selectedChoiceId !== choice.id && 'opacity-50'
            )}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
            aria-pressed={selectedChoiceId === choice.id}
          >
            {choice.text}
          </Button>
        ))}
      </div>

      {/* 選択後のフィードバック */}
      {selectedChoiceId && (
        <p className="mt-6 text-white text-lg animate-fade-in">
          選択を処理中...
        </p>
      )}
    </div>
  );
}
```

### ステップ 2: インデックスファイル更新

`src/components/video/index.ts`:

```typescript
export { VideoPlayer } from './VideoPlayer';
export type { VideoPlayerProps, VideoPlayerRef } from './VideoPlayer';

export { ChoiceOverlay } from './ChoiceOverlay';
export type { ChoiceOverlayProps } from './ChoiceOverlay';
```

---

## 完了条件

- [x] ChoiceOverlay コンポーネントが作成されている
- [x] AC-V-002: 指定タイミングで2つの選択肢がオーバーレイ表示される
- [x] 選択肢表示遅延が0.5秒以内
- [x] アニメーションが滑らかに動作する
- [x] キーボード操作（Tab、Enter）が可能

---

## テスト方法

### 1. コンポーネントテスト

`src/app/test/video/page.tsx` を更新:

```typescript
'use client';

import { useState } from 'react';
import { VideoPlayer, ChoiceOverlay } from '@/components/video';
import { useVideoStore, selectPlaybackState, selectChoiceState } from '@/stores/videoStore';
import { Button } from '@/components/ui/button';
import type { Choice } from '@/types';

export default function VideoTestPage() {
  const { isPlaying, currentTime, duration } = useVideoStore(selectPlaybackState);
  const { isChoiceVisible, choices, remainingTime, timeLimit } = useVideoStore(selectChoiceState);

  const {
    setIsPlaying,
    setCurrentTime,
    setDuration,
    showChoices,
    selectChoice,
    setRemainingTime,
  } = useVideoStore();

  const [lastSelected, setLastSelected] = useState<Choice | null>(null);

  const testVideoUrl = 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4';

  // テスト用の選択肢表示
  const handleShowChoices = () => {
    showChoices(
      [
        { id: 'choice-1', text: '選択肢A - 左のルートへ進む', targetNodeId: 'node-a', order: 0 },
        { id: 'choice-2', text: '選択肢B - 右のルートへ進む', targetNodeId: 'node-b', order: 1 },
      ],
      15 // 15秒の制限時間
    );
  };

  // 選択処理
  const handleSelect = (choice: Choice) => {
    setLastSelected(choice);
    selectChoice(choice.id);
  };

  // タイマー減少テスト
  const handleDecrementTimer = () => {
    setRemainingTime(Math.max(0, remainingTime - 1));
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">ChoiceOverlay テスト</h1>

      <div className="max-w-4xl relative">
        <VideoPlayer
          url={testVideoUrl}
          playing={isPlaying}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
          onDuration={setDuration}
        />

        {/* 選択肢オーバーレイ */}
        <ChoiceOverlay
          choices={choices}
          isVisible={isChoiceVisible}
          onSelect={handleSelect}
          remainingTime={remainingTime}
          timeLimit={timeLimit}
        />
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex gap-4 flex-wrap">
          <Button onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? '一時停止' : '再生'}
          </Button>
          <Button onClick={handleShowChoices} variant="secondary">
            選択肢を表示
          </Button>
          <Button onClick={handleDecrementTimer} variant="outline">
            タイマー -1秒
          </Button>
        </div>

        <div className="space-y-2 p-4 bg-muted rounded-lg">
          <h2 className="font-semibold">状態</h2>
          <p>再生時間: {currentTime.toFixed(1)}秒 / {duration.toFixed(1)}秒</p>
          <p>選択肢表示: {isChoiceVisible ? 'はい' : 'いいえ'}</p>
          <p>残り時間: {remainingTime.toFixed(1)}秒</p>
          <p>最後の選択: {lastSelected ? lastSelected.text : 'なし'}</p>
        </div>
      </div>
    </div>
  );
}
```

### 2. 動作確認

```bash
npm run dev
# http://localhost:3000/test/video にアクセス

# 確認項目:
# - 「選択肢を表示」で選択肢が表示される
# - 選択肢ボタンがフェードインアニメーションで表示される
# - ボタンをクリックすると選択が反映される
# - 選択後に別のボタンが半透明になる
```

### 3. レスポンシブ確認

```bash
# Chrome DevTools > Device Toolbar

# 確認項目:
# - 320px幅で選択肢が縦並びになる
# - タブレット以上で横並びになる
# - ボタンの最小タップ領域が48x48px以上
```

### 4. アクセシビリティ確認

```bash
# キーボード操作テスト:
# - Tab キーで選択肢間を移動できる
# - Enter キーで選択できる
# - フォーカスリングが表示される
```

### 5. パフォーマンス確認

表示遅延を計測:

```typescript
// ChoiceOverlay.tsx に計測コードを追加
useEffect(() => {
  if (isVisible) {
    const start = performance.now();
    requestAnimationFrame(() => {
      const end = performance.now();
      console.log(`選択肢表示遅延: ${end - start}ms`);
    });
  }
}, [isVisible]);
```

目標: 500ms以内

---

## 参照設計書セクション

- DESIGN-FE-2026-001 セクション5.1: 視聴画面コンポーネント
- DESIGN-FE-2026-001 セクション5.5: レスポンシブ対応

---

## 成果物

- `src/components/video/ChoiceOverlay.tsx`: 選択肢オーバーレイコンポーネント

---

## 注意事項

- 選択肢は最大2つを想定（設計書に基づく）
- アニメーションは CSS で実装（JavaScript アニメーションは使用しない）
- タップ領域は最小48x48pxを確保（モバイル対応）

---

## 次のタスク

- phase2-004-countdown-timer.md: カウントダウンタイマー
