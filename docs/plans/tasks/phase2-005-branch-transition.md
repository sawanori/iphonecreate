# タスク: 分岐遷移ロジック

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase2-005 |
| フェーズ | Phase 2: 視聴画面MVP |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

選択に応じた次ノードへの遷移ロジックを実装する。動画プリロード機能と遷移アニメーションを含むカスタムフックとコンポーネントを作成する。

---

## 前提条件

### 依存タスク
- phase2-004-countdown-timer.md（useChoiceTimer が存在すること）

### 前提成果物
- `src/stores/videoStore.ts`
- `src/components/video/VideoPlayer.tsx`
- `src/types/branch.ts` の型定義

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/hooks/useVideoPlayer.ts` | 新規作成 |
| `src/components/video/BranchTransition.tsx` | 新規作成 |
| `src/hooks/index.ts` | 更新 |
| `src/components/video/index.ts` | 更新 |

---

## 実装詳細

### ステップ 1: useVideoPlayer フック作成

`src/hooks/useVideoPlayer.ts`:

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import { useVideoStore } from '@/stores/videoStore';
import type { VideoNode, Choice, BranchConfig } from '@/types';

/**
 * useVideoPlayer フックのオプション
 */
export interface UseVideoPlayerOptions {
  /** 動画ノード一覧 */
  nodes: VideoNode[];
  /** 分岐設定一覧 */
  branchConfigs: BranchConfig[];
  /** 初期ノードID */
  initialNodeId: string;
  /** 遷移完了時のコールバック */
  onTransitionComplete?: (fromNodeId: string, toNodeId: string) => void;
  /** 選択時のコールバック */
  onChoice?: (nodeId: string, choice: Choice, isTimeout: boolean) => void;
  /** 動画終了時のコールバック */
  onEnd?: (nodeId: string) => void;
  /** プリロード有効化 */
  enablePreload?: boolean;
}

/**
 * useVideoPlayer フックの戻り値
 */
export interface UseVideoPlayerReturn {
  /** 現在のノード */
  currentNode: VideoNode | null;
  /** 現在の動画URL */
  currentVideoUrl: string;
  /** 次の動画URLリスト（プリロード用） */
  nextVideoUrls: string[];
  /** 選択肢を処理 */
  handleChoiceSelect: (choice: Choice, isTimeout?: boolean) => void;
  /** 指定ノードに遷移 */
  navigateToNode: (nodeId: string) => void;
  /** 選択肢表示時間に達した時の処理 */
  handleChoiceDisplayTime: () => void;
  /** 動画終了時の処理 */
  handleVideoEnd: () => void;
  /** タイムアウト処理 */
  handleTimeout: () => void;
  /** 遷移中かどうか */
  isTransitioning: boolean;
  /** ローディング中かどうか */
  isLoading: boolean;
}

/**
 * 動画プレイヤーのロジックをまとめたフック
 */
export function useVideoPlayer({
  nodes,
  branchConfigs,
  initialNodeId,
  onTransitionComplete,
  onChoice,
  onEnd,
  enablePreload = true,
}: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const [isLoading, setIsLoading] = useState(false);
  const preloadedUrlsRef = useRef<Set<string>>(new Set());

  const {
    currentNodeId,
    isTransitioning,
    setCurrentNode,
    setCurrentNodeId,
    setIsTransitioning,
    setIsPlaying,
    showChoices,
    hideChoices,
    selectChoice,
  } = useVideoStore();

  // 現在のノードを取得
  const currentNode = nodes.find((n) => n.id === currentNodeId) ?? null;

  // 現在のノードの分岐設定を取得
  const currentBranchConfig = branchConfigs.find(
    (b) => b.nodeId === currentNodeId
  );

  // 現在の動画URL
  const currentVideoUrl = currentNode?.videoUrl ?? '';

  // 次の動画URLリスト（プリロード用）
  const nextVideoUrls = currentBranchConfig?.choices
    .map((choice) => {
      const targetNode = nodes.find((n) => n.id === choice.targetNodeId);
      return targetNode?.videoUrl;
    })
    .filter((url): url is string => !!url) ?? [];

  // 初期ノードを設定
  useEffect(() => {
    if (initialNodeId && !currentNodeId) {
      const node = nodes.find((n) => n.id === initialNodeId);
      if (node) {
        setCurrentNode(node);
      }
    }
  }, [initialNodeId, currentNodeId, nodes, setCurrentNode]);

  // プリロード処理
  useEffect(() => {
    if (!enablePreload) return;

    nextVideoUrls.forEach((url) => {
      if (!preloadedUrlsRef.current.has(url)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = url;
        document.head.appendChild(link);
        preloadedUrlsRef.current.add(url);
      }
    });
  }, [nextVideoUrls, enablePreload]);

  // 選択肢表示時間に達した時の処理
  const handleChoiceDisplayTime = useCallback(() => {
    if (!currentBranchConfig) return;

    // 動画を一時停止して選択肢を表示
    setIsPlaying(false);
    showChoices(currentBranchConfig.choices, currentBranchConfig.timeLimit);
  }, [currentBranchConfig, setIsPlaying, showChoices]);

  // 選択処理
  const handleChoiceSelect = useCallback(
    (choice: Choice, isTimeout = false) => {
      if (isTransitioning) return;

      // コールバック
      onChoice?.(currentNodeId, choice, isTimeout);

      // 選択をストアに記録
      selectChoice(choice.id, isTimeout);

      // 遷移開始
      setIsTransitioning(true);
      setIsLoading(true);

      // 遷移アニメーション後に次のノードへ
      setTimeout(() => {
        const targetNode = nodes.find((n) => n.id === choice.targetNodeId);

        if (targetNode) {
          setCurrentNode(targetNode);
          hideChoices();

          // 遷移完了コールバック
          onTransitionComplete?.(currentNodeId, targetNode.id);
        }

        setIsLoading(false);
        setIsTransitioning(false);

        // 少し待ってから再生開始
        setTimeout(() => {
          setIsPlaying(true);
        }, 100);
      }, 500); // 500ms の遷移アニメーション
    },
    [
      isTransitioning,
      currentNodeId,
      nodes,
      onChoice,
      onTransitionComplete,
      selectChoice,
      setIsTransitioning,
      setCurrentNode,
      hideChoices,
      setIsPlaying,
    ]
  );

  // タイムアウト処理
  const handleTimeout = useCallback(() => {
    if (!currentBranchConfig) return;

    const defaultChoiceId = currentBranchConfig.defaultChoiceId;

    if (defaultChoiceId) {
      // デフォルト選択肢で遷移
      const defaultChoice = currentBranchConfig.choices.find(
        (c) => c.id === defaultChoiceId
      );
      if (defaultChoice) {
        handleChoiceSelect(defaultChoice, true);
      }
    } else {
      // 動画を一時停止して待機
      setIsPlaying(false);
    }
  }, [currentBranchConfig, handleChoiceSelect, setIsPlaying]);

  // 動画終了処理
  const handleVideoEnd = useCallback(() => {
    // 終了ノードの場合
    if (currentNode?.type === 'end') {
      onEnd?.(currentNodeId);
      return;
    }

    // 選択肢がない場合は終了
    if (!currentBranchConfig || currentBranchConfig.choices.length === 0) {
      onEnd?.(currentNodeId);
      return;
    }

    // 選択肢表示時間が設定されていない場合は動画終了時に表示
    if (!currentNode?.choiceDisplayTime) {
      handleChoiceDisplayTime();
    }
  }, [
    currentNode,
    currentNodeId,
    currentBranchConfig,
    onEnd,
    handleChoiceDisplayTime,
  ]);

  // 指定ノードに遷移
  const navigateToNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setCurrentNode(node);
        setIsPlaying(true);
      }
    },
    [nodes, setCurrentNode, setIsPlaying]
  );

  return {
    currentNode,
    currentVideoUrl,
    nextVideoUrls,
    handleChoiceSelect,
    navigateToNode,
    handleChoiceDisplayTime,
    handleVideoEnd,
    handleTimeout,
    isTransitioning,
    isLoading,
  };
}
```

### ステップ 2: BranchTransition コンポーネント作成

`src/components/video/BranchTransition.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * BranchTransition コンポーネントのProps
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
}

/**
 * 分岐遷移アニメーションコンポーネント
 */
export function BranchTransition({
  isTransitioning,
  type = 'fade',
  duration = 500,
  onComplete,
  children,
  className,
}: BranchTransitionProps) {
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle');

  useEffect(() => {
    if (isTransitioning) {
      // フェードアウト開始
      setPhase('out');

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
  }, [isTransitioning, duration, onComplete]);

  // アニメーションクラスを取得
  const getAnimationClasses = () => {
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

      default:
        return '';
    }
  };

  return (
    <div
      className={cn('relative', className)}
      style={{ transitionDuration: `${duration / 2}ms` }}
    >
      <div className={cn('w-full h-full', getAnimationClasses())}>
        {children}
      </div>

      {/* 遷移オーバーレイ */}
      {isTransitioning && (
        <div
          className={cn(
            'absolute inset-0 bg-black z-30',
            'flex items-center justify-center',
            phase === 'out' ? 'animate-fade-in' : 'animate-fade-out'
          )}
          style={{ animationDuration: `${duration / 2}ms` }}
        >
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4" />
            <p className="text-lg">次の動画を読み込み中...</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

### ステップ 3: hooks インデックス更新

`src/hooks/index.ts`:

```typescript
export { useChoiceTimer } from './useChoiceTimer';
export type { UseChoiceTimerOptions, UseChoiceTimerReturn } from './useChoiceTimer';

export { useVideoPlayer } from './useVideoPlayer';
export type { UseVideoPlayerOptions, UseVideoPlayerReturn } from './useVideoPlayer';
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

export { BranchTransition } from './BranchTransition';
export type { BranchTransitionProps } from './BranchTransition';
```

---

## 完了条件

- [x] useVideoPlayer フックが作成されている
- [x] BranchTransition コンポーネントが作成されている
- [x] AC-V-004: 選択肢を選ぶと対応する動画に遷移する
- [x] AC-V-007: 選択から次の動画再生まで2秒以内
- [x] 動画プリロードが機能している

---

## テスト方法

### 1. 遷移ロジックテスト

`src/app/test/branch/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import {
  VideoPlayer,
  ChoiceOverlay,
  CountdownTimer,
  BranchTransition,
} from '@/components/video';
import { useVideoPlayer } from '@/hooks';
import { useVideoStore } from '@/stores/videoStore';
import { Button } from '@/components/ui/button';
import type { VideoNode, BranchConfig } from '@/types';

// モックデータ
const mockNodes: VideoNode[] = [
  {
    id: 'node-1',
    type: 'video',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    title: '動画1',
    choiceDisplayTime: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'node-2',
    type: 'video',
    videoUrl: 'https://test-videos.co.uk/vids/jellyfish/mp4/720/Jellyfish_720_10s_1MB.mp4',
    title: '動画2 (選択肢A)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'node-3',
    type: 'end',
    videoUrl: 'https://test-videos.co.uk/vids/sintel/mp4/720/Sintel_720_10s_1MB.mp4',
    title: '動画3 (選択肢B) - 終了',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockBranchConfigs: BranchConfig[] = [
  {
    nodeId: 'node-1',
    choices: [
      { id: 'choice-a', text: '選択肢A - クラゲの動画へ', targetNodeId: 'node-2', order: 0 },
      { id: 'choice-b', text: '選択肢B - 終了動画へ', targetNodeId: 'node-3', order: 1 },
    ],
    timeLimit: 10,
    defaultChoiceId: null,
  },
];

export default function BranchTestPage() {
  const [events, setEvents] = useState<string[]>([]);
  const { isChoiceVisible, choices, remainingTime, timeLimit } = useVideoStore();
  const { setIsPlaying } = useVideoStore();

  const addEvent = (event: string) => {
    setEvents((prev) => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${event}`]);
  };

  const {
    currentNode,
    currentVideoUrl,
    handleChoiceSelect,
    handleChoiceDisplayTime,
    handleVideoEnd,
    handleTimeout,
    isTransitioning,
  } = useVideoPlayer({
    nodes: mockNodes,
    branchConfigs: mockBranchConfigs,
    initialNodeId: 'node-1',
    onTransitionComplete: (from, to) => addEvent(`遷移完了: ${from} → ${to}`),
    onChoice: (nodeId, choice, isTimeout) =>
      addEvent(`選択: ${choice.text} (タイムアウト: ${isTimeout})`),
    onEnd: (nodeId) => addEvent(`終了: ${nodeId}`),
  });

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">分岐遷移テスト</h1>

      <div className="max-w-4xl">
        <BranchTransition isTransitioning={isTransitioning}>
          <div className="relative">
            <VideoPlayer
              url={currentVideoUrl}
              playing={!isChoiceVisible && !isTransitioning}
              onTimeReached={handleChoiceDisplayTime}
              choiceDisplayTime={currentNode?.choiceDisplayTime}
              onEnded={handleVideoEnd}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            <ChoiceOverlay
              choices={choices}
              isVisible={isChoiceVisible}
              onSelect={(choice) => handleChoiceSelect(choice)}
              remainingTime={remainingTime}
              timeLimit={timeLimit}
            />

            {isChoiceVisible && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <CountdownTimer
                  onTimeout={handleTimeout}
                  variant="compact"
                  visible={isChoiceVisible}
                />
              </div>
            )}
          </div>
        </BranchTransition>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-4 bg-muted rounded-lg">
          <h2 className="font-semibold mb-2">現在の状態</h2>
          <p>ノード: {currentNode?.title ?? 'なし'}</p>
          <p>タイプ: {currentNode?.type ?? '-'}</p>
          <p>遷移中: {isTransitioning ? 'はい' : 'いいえ'}</p>
          <p>選択肢表示: {isChoiceVisible ? 'はい' : 'いいえ'}</p>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h2 className="font-semibold mb-2">イベントログ</h2>
          <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
            {events.map((event, i) => (
              <p key={i}>{event}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-4">
        <Button onClick={() => handleChoiceDisplayTime()}>
          選択肢を強制表示
        </Button>
      </div>
    </div>
  );
}
```

### 2. 動作確認

```bash
npm run dev
# http://localhost:3000/test/branch にアクセス

# 確認項目:
# - 動画が再生される
# - 選択肢表示時間（5秒）で選択肢が表示される
# - 選択肢を選ぶと次の動画に遷移する
# - 遷移アニメーションが表示される
# - タイムアウトで動画が一時停止する（defaultChoiceId が null の場合）
```

### 3. 遷移時間計測

```typescript
// useVideoPlayer.ts に計測コードを追加
const transitionStartTime = useRef<number>(0);

// handleChoiceSelect 内
transitionStartTime.current = performance.now();

// 遷移完了時
const transitionDuration = performance.now() - transitionStartTime.current;
console.log(`遷移時間: ${transitionDuration}ms`);
```

目標: 2秒（2000ms）以内

### 4. プリロード確認

```bash
# Chrome DevTools > Network タブで確認
# - 動画再生中に次の動画がプリロードされている
# - preload リクエストが発生している
```

---

## 参照設計書セクション

- DESIGN-FE-2026-001 セクション5.1: 視聴画面コンポーネント
- DESIGN-FE-2026-001 セクション8.1: 動画再生フロー
- DESIGN-FE-2026-001 セクション16.1: パフォーマンス最適化

---

## 成果物

- `src/hooks/useVideoPlayer.ts`: 動画プレイヤーロジックフック
- `src/components/video/BranchTransition.tsx`: 遷移アニメーションコンポーネント

---

## 注意事項

- プリロードは帯域幅を消費するため、必要な動画のみに限定
- 遷移時間は UX に影響するため、500ms 程度に抑える
- タイムアウト処理は 1 回のみ実行されるようにする

---

## 次のタスク

- phase2-006-watch-page.md: 視聴画面ページ統合
