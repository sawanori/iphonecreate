'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

/**
 * VideoPreloader コンポーネントのProps
 * 次の動画をバックグラウンドでプリロードする
 */
export interface VideoPreloaderProps {
  /** プリロード対象の動画URL */
  url: string;
  /** プリロード完了時のコールバック */
  onLoaded: () => void;
  /** プリロード進捗更新時のコールバック (0-100) */
  onProgress?: (progress: number) => void;
  /** エラー発生時のコールバック */
  onError?: (error: Error) => void;
}

/**
 * 動画プリローダーコンポーネント
 * 非表示のvideoタグで次の動画をバックグラウンドでプリロード
 */
export function VideoPreloader({
  url,
  onLoaded,
  onProgress,
  onError,
}: VideoPreloaderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const loadedRef = useRef(false);

  // プリロード完了ハンドラー
  const handleCanPlayThrough = useCallback(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setHasLoaded(true);
    onLoaded();
  }, [onLoaded]);

  // プログレスハンドラー
  const handleProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || !onProgress) return;

    if (video.buffered.length > 0 && video.duration > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const progress = Math.min(100, (bufferedEnd / video.duration) * 100);
      onProgress(progress);
    }
  }, [onProgress]);

  // エラーハンドラー
  const handleError = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const error = new Error(
      `動画のプリロードに失敗しました: ${video.error?.message || 'Unknown error'}`
    );
    onError?.(error);
  }, [onError]);

  // URLが変更されたらリセットしてプリロード開始
  useEffect(() => {
    const video = videoRef.current;
    if (!url || !video) return;

    // 状態リセット
    loadedRef.current = false;
    setHasLoaded(false);

    // イベントリスナー設定
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('error', handleError);

    // プリロード開始
    video.src = url;
    video.preload = 'auto';
    video.load();

    return () => {
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('error', handleError);
      // クリーンアップ時にsrcをクリア
      video.src = '';
      video.load();
    };
  }, [url, handleCanPlayThrough, handleProgress, handleError]);

  // 非表示のvideoタグ（プリロード専用）
  return (
    <video
      ref={videoRef}
      className="hidden"
      muted
      playsInline
      aria-hidden="true"
      data-testid="video-preloader"
      data-loaded={hasLoaded}
    />
  );
}
