# タスク: Zustand ビデオストア実装

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase2-002 |
| フェーズ | Phase 2: 視聴画面MVP |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

Zustand をインストールし、動画再生状態を管理するストアを実装する。再生状態、選択肢表示状態、遷移状態などを一元管理する。

---

## 前提条件

### 依存タスク
- phase2-001-video-player.md（VideoPlayer コンポーネントが存在すること）

### 前提成果物
- `src/types/video.ts` の `VideoPlayerState` 型
- `src/components/video/VideoPlayer.tsx`

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/stores/videoStore.ts` | 新規作成 |

---

## 実装詳細

### ステップ 1: Zustand インストール

```bash
npm install zustand
```

### ステップ 2: ビデオストア作成

`src/stores/videoStore.ts`:

```typescript
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { VideoPlayerState, VideoNode, Choice } from '@/types';

/**
 * ビデオストアの状態
 */
interface VideoStoreState extends VideoPlayerState {
  /** 現在の動画ノード情報 */
  currentNode: VideoNode | null;
  /** 利用可能な選択肢 */
  choices: Choice[];
  /** 残り時間（秒） */
  remainingTime: number;
  /** 制限時間（秒） */
  timeLimit: number;
  /** 選択済みの選択肢履歴 */
  choiceHistory: Array<{
    nodeId: string;
    choiceId: string;
    timestamp: number;
    isTimeout: boolean;
  }>;
}

/**
 * ビデオストアのアクション
 */
interface VideoStoreActions {
  // 再生制御
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlay: () => void;

  // 音量制御
  setVolume: (volume: number) => void;
  setIsMuted: (isMuted: boolean) => void;
  toggleMute: () => void;

  // 時間制御
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;

  // ノード制御
  setCurrentNode: (node: VideoNode | null) => void;
  setCurrentNodeId: (nodeId: string) => void;

  // 選択肢制御
  setChoices: (choices: Choice[]) => void;
  setIsChoiceVisible: (isVisible: boolean) => void;
  showChoices: (choices: Choice[], timeLimit: number) => void;
  hideChoices: () => void;

  // タイマー制御
  setRemainingTime: (time: number) => void;
  decrementRemainingTime: () => void;

  // 遷移制御
  setIsTransitioning: (isTransitioning: boolean) => void;

  // 選択処理
  selectChoice: (choiceId: string, isTimeout?: boolean) => void;

  // 履歴
  addToHistory: (nodeId: string, choiceId: string, isTimeout: boolean) => void;
  clearHistory: () => void;

  // リセット
  reset: () => void;
}

/**
 * ストアの初期状態
 */
const initialState: VideoStoreState = {
  currentNodeId: '',
  isPlaying: false,
  isChoiceVisible: false,
  isTransitioning: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  currentNode: null,
  choices: [],
  remainingTime: 0,
  timeLimit: 0,
  choiceHistory: [],
};

/**
 * ビデオストア
 */
export const useVideoStore = create<VideoStoreState & VideoStoreActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // 再生制御
      setIsPlaying: (isPlaying) => set({ isPlaying }, false, 'setIsPlaying'),

      togglePlay: () =>
        set((state) => ({ isPlaying: !state.isPlaying }), false, 'togglePlay'),

      // 音量制御
      setVolume: (volume) =>
        set({ volume: Math.max(0, Math.min(1, volume)) }, false, 'setVolume'),

      setIsMuted: (isMuted) => set({ isMuted }, false, 'setIsMuted'),

      toggleMute: () =>
        set((state) => ({ isMuted: !state.isMuted }), false, 'toggleMute'),

      // 時間制御
      setCurrentTime: (currentTime) =>
        set({ currentTime }, false, 'setCurrentTime'),

      setDuration: (duration) => set({ duration }, false, 'setDuration'),

      // ノード制御
      setCurrentNode: (currentNode) =>
        set(
          {
            currentNode,
            currentNodeId: currentNode?.id ?? '',
          },
          false,
          'setCurrentNode'
        ),

      setCurrentNodeId: (currentNodeId) =>
        set({ currentNodeId }, false, 'setCurrentNodeId'),

      // 選択肢制御
      setChoices: (choices) => set({ choices }, false, 'setChoices'),

      setIsChoiceVisible: (isChoiceVisible) =>
        set({ isChoiceVisible }, false, 'setIsChoiceVisible'),

      showChoices: (choices, timeLimit) =>
        set(
          {
            choices,
            timeLimit,
            remainingTime: timeLimit,
            isChoiceVisible: true,
            isPlaying: false, // 選択肢表示時は動画を一時停止
          },
          false,
          'showChoices'
        ),

      hideChoices: () =>
        set(
          {
            isChoiceVisible: false,
            choices: [],
            remainingTime: 0,
            timeLimit: 0,
          },
          false,
          'hideChoices'
        ),

      // タイマー制御
      setRemainingTime: (remainingTime) =>
        set({ remainingTime }, false, 'setRemainingTime'),

      decrementRemainingTime: () =>
        set(
          (state) => ({
            remainingTime: Math.max(0, state.remainingTime - 0.1),
          }),
          false,
          'decrementRemainingTime'
        ),

      // 遷移制御
      setIsTransitioning: (isTransitioning) =>
        set({ isTransitioning }, false, 'setIsTransitioning'),

      // 選択処理
      selectChoice: (choiceId, isTimeout = false) => {
        const state = get();
        const choice = state.choices.find((c) => c.id === choiceId);

        if (!choice) return;

        // 履歴に追加
        get().addToHistory(state.currentNodeId, choiceId, isTimeout);

        // 選択肢を非表示にして遷移開始
        set(
          {
            isChoiceVisible: false,
            isTransitioning: true,
          },
          false,
          'selectChoice'
        );
      },

      // 履歴
      addToHistory: (nodeId, choiceId, isTimeout) =>
        set(
          (state) => ({
            choiceHistory: [
              ...state.choiceHistory,
              {
                nodeId,
                choiceId,
                timestamp: Date.now(),
                isTimeout,
              },
            ],
          }),
          false,
          'addToHistory'
        ),

      clearHistory: () => set({ choiceHistory: [] }, false, 'clearHistory'),

      // リセット
      reset: () => set(initialState, false, 'reset'),
    })),
    { name: 'video-store' }
  )
);

/**
 * セレクター: 再生状態のみを取得
 */
export const selectPlaybackState = (state: VideoStoreState) => ({
  isPlaying: state.isPlaying,
  currentTime: state.currentTime,
  duration: state.duration,
  volume: state.volume,
  isMuted: state.isMuted,
});

/**
 * セレクター: 選択肢状態のみを取得
 */
export const selectChoiceState = (state: VideoStoreState) => ({
  isChoiceVisible: state.isChoiceVisible,
  choices: state.choices,
  remainingTime: state.remainingTime,
  timeLimit: state.timeLimit,
});

/**
 * セレクター: 遷移状態のみを取得
 */
export const selectTransitionState = (state: VideoStoreState) => ({
  isTransitioning: state.isTransitioning,
  currentNodeId: state.currentNodeId,
});
```

---

## 完了条件

- [x] Zustand がインストールされている
- [x] videoStore が作成されている
- [x] DevTools で状態変更が確認できる
- [x] 状態変更時のリレンダリングが最適化されている（セレクター使用）

---

## テスト方法

### 1. Zustand DevTools 確認

Chrome の Redux DevTools 拡張機能をインストールし、状態変更を確認:

```bash
npm run dev
# Chrome DevTools > Redux タブで video-store の状態を確認
```

### 2. コンポーネントテスト

`src/app/test/video/page.tsx` を更新:

```typescript
'use client';

import { useEffect } from 'react';
import { VideoPlayer } from '@/components/video';
import { useVideoStore, selectPlaybackState, selectChoiceState } from '@/stores/videoStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function VideoTestPage() {
  const { isPlaying, currentTime, duration, volume } = useVideoStore(selectPlaybackState);
  const { isChoiceVisible, choices, remainingTime, timeLimit } = useVideoStore(selectChoiceState);

  const {
    setIsPlaying,
    togglePlay,
    setCurrentTime,
    setDuration,
    showChoices,
    hideChoices,
    selectChoice,
    setVolume,
  } = useVideoStore();

  const testVideoUrl = 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4';

  // テスト用の選択肢表示
  const handleShowChoices = () => {
    showChoices(
      [
        { id: 'choice-1', text: '選択肢A', targetNodeId: 'node-a', order: 0 },
        { id: 'choice-2', text: '選択肢B', targetNodeId: 'node-b', order: 1 },
      ],
      10 // 10秒の制限時間
    );
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">VideoStore テスト</h1>

      <div className="max-w-4xl relative">
        <VideoPlayer
          url={testVideoUrl}
          playing={isPlaying}
          volume={volume}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
          onDuration={setDuration}
        />

        {/* 選択肢オーバーレイ（テスト用） */}
        {isChoiceVisible && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
            <p className="text-white text-lg">残り時間: {remainingTime.toFixed(1)}秒</p>
            <Progress value={(remainingTime / timeLimit) * 100} className="w-64" />
            <div className="flex gap-4">
              {choices.map((choice) => (
                <Button
                  key={choice.id}
                  onClick={() => selectChoice(choice.id)}
                  size="lg"
                >
                  {choice.text}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex gap-4">
          <Button onClick={togglePlay}>
            {isPlaying ? '一時停止' : '再生'}
          </Button>
          <Button onClick={handleShowChoices} variant="secondary">
            選択肢を表示
          </Button>
          <Button onClick={hideChoices} variant="outline">
            選択肢を非表示
          </Button>
        </div>

        <div className="space-y-2">
          <p>再生状態: {isPlaying ? '再生中' : '停止中'}</p>
          <p>現在時間: {currentTime.toFixed(1)}秒 / {duration.toFixed(1)}秒</p>
          <p>音量: {(volume * 100).toFixed(0)}%</p>
          <p>選択肢表示: {isChoiceVisible ? 'はい' : 'いいえ'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">音量調整</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-64"
          />
        </div>
      </div>
    </div>
  );
}
```

### 3. 状態変更確認

```bash
npm run dev
# http://localhost:3000/test/video にアクセス

# 確認項目:
# - 再生/一時停止で isPlaying が変更される
# - 選択肢表示で isChoiceVisible が true になる
# - 選択肢選択で isChoiceVisible が false になる
# - Redux DevTools で状態履歴を確認
```

### 4. セレクターの最適化確認

React DevTools Profiler でリレンダリングを確認:
- 関係のない状態変更でコンポーネントが再レンダリングされないこと

---

## 参照設計書セクション

- DESIGN-FE-2026-001 セクション7.2: クライアント状態管理（Zustand）

---

## 成果物

- `src/stores/videoStore.ts`: ビデオ状態管理ストア

---

## 注意事項

- `devtools` ミドルウェアは開発時のみ有効
- `subscribeWithSelector` で細かい購読制御が可能
- セレクターを使用してリレンダリングを最適化すること

---

## 次のタスク

- phase2-003-choice-overlay.md: 選択肢オーバーレイコンポーネント
