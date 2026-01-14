# タスク: react-player 動画プレイヤー基盤

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase2-001 |
| フェーズ | Phase 2: 視聴画面MVP |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

react-player をインストールし、動画プレイヤーの基盤コンポーネントを作成する。基本的な再生コントロールと動画読み込み状態の管理を実装する。

---

## 前提条件

### 依存タスク
- phase1-005-types.md（VideoPlayerState 型が定義されていること）
- phase1-completion.md（Phase 1 が完了していること）

### 前提成果物
- `src/types/video.ts` が存在すること
- UIコンポーネント（Button, Progress）が利用可能であること

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/components/video/VideoPlayer.tsx` | 新規作成 |
| `src/components/video/index.ts` | 新規作成 |

---

## 実装詳細

### ステップ 1: react-player インストール

```bash
npm install react-player
npm install -D @types/react-player
```

### ステップ 2: VideoPlayer コンポーネント作成

`src/components/video/VideoPlayer.tsx`:

```typescript
'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import type { OnProgressProps } from 'react-player/base';
import { cn } from '@/lib/utils';
import type { VideoLoadingState } from '@/types';

/**
 * VideoPlayer コンポーネントのProps
 */
export interface VideoPlayerProps {
  /** 動画URL */
  url: string;
  /** 再生開始時のコールバック */
  onPlay?: () => void;
  /** 一時停止時のコールバック */
  onPause?: () => void;
  /** 動画終了時のコールバック */
  onEnded?: () => void;
  /** 再生位置更新時のコールバック */
  onProgress?: (state: { playedSeconds: number; played: number }) => void;
  /** 動画の長さ取得時のコールバック */
  onDuration?: (duration: number) => void;
  /** 読み込み完了時のコールバック */
  onReady?: () => void;
  /** エラー発生時のコールバック */
  onError?: (error: Error) => void;
  /** 指定時間に到達した時のコールバック */
  onTimeReached?: (time: number) => void;
  /** 選択肢表示時間（秒）*/
  choiceDisplayTime?: number;
  /** 初期再生状態 */
  playing?: boolean;
  /** 初期音量（0-1） */
  volume?: number;
  /** ミュート状態 */
  muted?: boolean;
  /** ループ再生 */
  loop?: boolean;
  /** コントロール表示 */
  controls?: boolean;
  /** 追加のクラス名 */
  className?: string;
}

/**
 * 動画プレイヤーコンポーネント
 */
export function VideoPlayer({
  url,
  onPlay,
  onPause,
  onEnded,
  onProgress,
  onDuration,
  onReady,
  onError,
  onTimeReached,
  choiceDisplayTime,
  playing = false,
  volume = 1,
  muted = false,
  loop = false,
  controls = true,
  className,
}: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const [loadingState, setLoadingState] = useState<VideoLoadingState>('idle');
  const [hasTriggeredTimeReached, setHasTriggeredTimeReached] = useState(false);

  // 動画読み込み開始
  const handleStart = useCallback(() => {
    setLoadingState('loading');
  }, []);

  // 動画読み込み完了
  const handleReady = useCallback(() => {
    setLoadingState('ready');
    onReady?.();
  }, [onReady]);

  // エラー処理
  const handleError = useCallback(
    (error: Error) => {
      setLoadingState('error');
      onError?.(error);
    },
    [onError]
  );

  // 再生位置更新
  const handleProgress = useCallback(
    (state: OnProgressProps) => {
      onProgress?.({
        playedSeconds: state.playedSeconds,
        played: state.played,
      });

      // 選択肢表示時間に到達した場合
      if (
        choiceDisplayTime &&
        state.playedSeconds >= choiceDisplayTime &&
        !hasTriggeredTimeReached
      ) {
        setHasTriggeredTimeReached(true);
        onTimeReached?.(state.playedSeconds);
      }
    },
    [onProgress, choiceDisplayTime, hasTriggeredTimeReached, onTimeReached]
  );

  // URL変更時にフラグをリセット
  useEffect(() => {
    setHasTriggeredTimeReached(false);
  }, [url]);

  // 外部から再生位置を制御するためのメソッドを公開
  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, 'seconds');
  }, []);

  return (
    <div className={cn('video-container relative w-full aspect-video bg-black', className)}>
      {/* ローディング表示 */}
      {loadingState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
        </div>
      )}

      {/* エラー表示 */}
      {loadingState === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-white text-center">
            <p className="text-lg font-semibold">動画の読み込みに失敗しました</p>
            <p className="text-sm text-gray-400 mt-2">URLを確認してください</p>
          </div>
        </div>
      )}

      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        volume={volume}
        muted={muted}
        loop={loop}
        controls={controls}
        width="100%"
        height="100%"
        onStart={handleStart}
        onReady={handleReady}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onProgress={handleProgress}
        onDuration={onDuration}
        onError={handleError}
        progressInterval={100} // 100msごとに進捗更新
        config={{
          file: {
            attributes: {
              preload: 'auto',
            },
          },
        }}
      />
    </div>
  );
}

/**
 * VideoPlayer の ref から呼び出せるメソッド
 */
export interface VideoPlayerRef {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}
```

### ステップ 3: インデックスファイル作成

`src/components/video/index.ts`:

```typescript
export { VideoPlayer } from './VideoPlayer';
export type { VideoPlayerProps, VideoPlayerRef } from './VideoPlayer';
```

---

## 完了条件

- [x] react-player がインストールされている
- [x] VideoPlayer コンポーネントが作成されている
- [ ] AC-V-001: MP4動画がブラウザで再生される
- [x] 動画読み込み状態（loading, ready, error）が適切に表示される
- [ ] 動画読み込み時間が3秒以内（パフォーマンス要件）

---

## テスト方法

### 1. コンポーネント表示テスト

テスト用ページを作成して動作確認:

`src/app/test/video/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { VideoPlayer } from '@/components/video';

export default function VideoTestPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // テスト用のサンプル動画URL（Big Buck Bunny）
  const testVideoUrl = 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4';

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">VideoPlayer テスト</h1>

      <div className="max-w-4xl">
        <VideoPlayer
          url={testVideoUrl}
          playing={isPlaying}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
          onDuration={(d) => setDuration(d)}
          onReady={() => console.log('動画準備完了')}
          onEnded={() => {
            console.log('動画終了');
            setIsPlaying(false);
          }}
        />
      </div>

      <div className="mt-4 space-y-2">
        <p>再生状態: {isPlaying ? '再生中' : '停止中'}</p>
        <p>現在時間: {currentTime.toFixed(1)}秒</p>
        <p>動画の長さ: {duration.toFixed(1)}秒</p>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          {isPlaying ? '一時停止' : '再生'}
        </button>
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
# - 動画が表示される
# - 再生/一時停止ボタンが動作する
# - 再生位置が更新される
# - 動画終了時にコールバックが呼ばれる
```

### 3. パフォーマンス確認

```bash
# Chrome DevTools > Network タブで動画読み込み時間を確認
# 目標: 3秒以内
```

### 4. エラーハンドリング確認

無効なURLを指定してエラー表示を確認:

```typescript
const invalidUrl = 'https://example.com/invalid.mp4';
```

---

## 参照設計書セクション

- DESIGN-FE-2026-001 セクション5.1: 視聴画面コンポーネント
- DESIGN-FE-2026-001 セクション8.1: 動画再生フロー

---

## 成果物

- `src/components/video/VideoPlayer.tsx`: 動画プレイヤーコンポーネント
- `src/components/video/index.ts`: エクスポート用インデックス

---

## 注意事項

- react-player は SSR 非対応のため、`'use client'` ディレクティブが必須
- 動画URLは CORS 対応している必要がある
- MP4 形式以外の動画もサポート可能だが、本プロジェクトでは MP4 を前提とする

---

## 次のタスク

- phase2-002-video-store.md: Zustand ビデオストア実装
