'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import type { OnProgressProps } from 'react-player/base';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VideoLoadingState } from '@/types';

/**
 * VideoPlayer コンポーネントのProps
 * 対応設計書: DESIGN-FE-2026-001 セクション5.1
 */
export interface VideoPlayerProps {
  /** 動画URL */
  url: string;
  /** ユーザーが既に操作済みか（分岐後などはtrue） */
  hasUserInteracted?: boolean;
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
  /** アスペクト比 */
  aspectRatio?: 'landscape' | 'portrait';
  /** 追加のクラス名 */
  className?: string;
}

/**
 * 動画プレイヤーコンポーネント
 * react-playerをラップし、再生/一時停止制御、進捗コールバック、エラーハンドリングを提供
 */
export function VideoPlayer({
  url,
  hasUserInteracted = false,
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
  aspectRatio = 'landscape',
  className,
}: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const [loadingState, setLoadingState] = useState<VideoLoadingState>('idle');
  const [hasTriggeredTimeReached, setHasTriggeredTimeReached] = useState(false);
  const [showTapToPlay, setShowTapToPlay] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // URLが空の場合のログ
  if (!url) {
    console.warn('[VideoPlayer] Empty URL provided');
  }

  // 動画読み込み開始
  const handleStart = useCallback(() => {
    setLoadingState('loading');
    setShowTapToPlay(false);
  }, []);

  // 動画読み込み完了
  const handleReady = useCallback(() => {
    setLoadingState('ready');
    setShowTapToPlay(false);
    onReady?.();
  }, [onReady]);

  // エラー処理
  const handleError = useCallback(
    (error: unknown) => {
      console.error('[VideoPlayer] Error loading video:', { url, error, retryCount, hasUserInteracted });

      // ユーザーが既に操作済み（分岐後など）の場合はエラー表示
      // 初回でユーザー未操作の場合はタップして再生を表示
      if (retryCount === 0 && !hasUserInteracted) {
        setShowTapToPlay(true);
        setLoadingState('ready'); // エラー状態にせず、タップ待ち状態に
        return;
      }

      setLoadingState('error');
      // react-playerのエラーはunknown型で渡されることがあるため、Error型に変換
      const errorInstance =
        error instanceof Error ? error : new Error(String(error));
      onError?.(errorInstance);
    },
    [onError, url, retryCount, hasUserInteracted]
  );

  // タップして再生
  const handleTapToPlay = useCallback(() => {
    setShowTapToPlay(false);
    setRetryCount((c) => c + 1);
    onPlay?.();
  }, [onPlay]);

  // 再生位置更新
  const handleProgress = useCallback(
    (state: OnProgressProps) => {
      onProgress?.({
        playedSeconds: state.playedSeconds,
        played: state.played,
      });

      // 選択肢表示時間に到達した場合
      if (
        choiceDisplayTime !== undefined &&
        state.playedSeconds >= choiceDisplayTime &&
        !hasTriggeredTimeReached
      ) {
        setHasTriggeredTimeReached(true);
        onTimeReached?.(state.playedSeconds);
      }
    },
    [onProgress, choiceDisplayTime, hasTriggeredTimeReached, onTimeReached]
  );

  // URL変更時にフラグをリセット - use microtask to avoid synchronous setState in effect
  useEffect(() => {
    queueMicrotask(() => {
      setHasTriggeredTimeReached(false);
      setLoadingState('idle');
      setShowTapToPlay(false);
      setRetryCount(0);
    });
  }, [url]);

  return (
    <div
      className={cn(
        'video-container relative w-full bg-black',
        aspectRatio === 'portrait' ? 'aspect-[9/16]' : 'aspect-video',
        className
      )}
    >
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
            <p className="text-lg font-semibold">
              動画の読み込みに失敗しました
            </p>
            <p className="text-sm text-gray-400 mt-2">URLを確認してください</p>
          </div>
        </div>
      )}

      {/* モバイル用タップして再生オーバーレイ */}
      {showTapToPlay && (
        <button
          onClick={handleTapToPlay}
          className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 cursor-pointer"
          aria-label="タップして再生"
        >
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <Play className="w-10 h-10 text-white fill-white" />
            </div>
            <p className="text-lg font-medium">タップして再生</p>
          </div>
        </button>
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
        {...(onPlay ? { onPlay } : {})}
        {...(onPause ? { onPause } : {})}
        {...(onEnded ? { onEnded } : {})}
        onProgress={handleProgress}
        {...(onDuration ? { onDuration } : {})}
        onError={handleError}
        progressInterval={100} // 100msごとに進捗更新
        playsinline
        config={{
          file: {
            attributes: {
              preload: 'auto',
              playsInline: true,
              'webkit-playsinline': 'true',
              crossOrigin: 'anonymous',
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
