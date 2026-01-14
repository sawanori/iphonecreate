'use client';

import { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UploadProgress } from './UploadProgress';
import { cn } from '@/lib/utils';

/**
 * アップロード状態
 */
type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

/**
 * VideoUploader コンポーネントのProps
 */
export interface VideoUploaderProps {
  /** プロジェクトID */
  projectId?: string;
  /** アップロード完了時のコールバック */
  onUploadComplete?: (result: { videoUrl: string; fileKey: string }) => void;
  /** エラー時のコールバック */
  onError?: (error: string) => void;
  /** 追加のクラス名 */
  className?: string;
}

/**
 * 動画アップローダーコンポーネント
 */
export function VideoUploader({
  projectId,
  onUploadComplete,
  onError,
  className,
}: VideoUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイルバリデーション
  const validateFile = useCallback((file: File): string | null => {
    // 形式チェック（MP4またはMOV）
    if (file.type !== 'video/mp4' && file.type !== 'video/quicktime') {
      return 'MP4またはMOV形式のみアップロード可能です';
    }

    // サイズチェック（500MB）
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'ファイルサイズは500MB以下にしてください';
    }

    return null;
  }, []);

  // アップロード処理
  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setStatus('error');
        setErrorMessage(validationError);
        onError?.(validationError);
        return;
      }

      setFilename(file.name);
      setStatus('uploading');
      setProgress(0);
      setErrorMessage('');

      try {
        // 1. 署名付きURLを取得
        const urlResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            size: file.size,
            projectId,
          }),
        });

        if (!urlResponse.ok) {
          const error = await urlResponse.json();
          throw new Error(error.error?.message ?? 'URLの取得に失敗しました');
        }

        const { data: urlData } = await urlResponse.json();

        // 2. R2にアップロード
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100;
            setProgress(percent);
          }
        });

        await new Promise<void>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error('アップロードに失敗しました'));
            }
          };
          xhr.onerror = () => reject(new Error('ネットワークエラー'));

          xhr.open('PUT', urlData.uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });

        // 3. アップロード完了を通知
        setStatus('processing');
        setProgress(100);

        const completeResponse = await fetch('/api/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileKey: urlData.fileKey,
            projectId,
          }),
        });

        if (!completeResponse.ok) {
          const error = await completeResponse.json();
          throw new Error(error.error?.message ?? '完了処理に失敗しました');
        }

        const { data: completeData } = await completeResponse.json();

        setStatus('complete');
        onUploadComplete?.({
          videoUrl: completeData.videoUrl,
          fileKey: urlData.fileKey,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'アップロードに失敗しました';
        setStatus('error');
        setErrorMessage(message);
        onError?.(message);
      }
    },
    [projectId, validateFile, onUploadComplete, onError]
  );

  // ファイル選択
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        uploadFile(file);
      }
    },
    [uploadFile]
  );

  // ドラッグ&ドロップ
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);

      const file = event.dataTransfer.files[0];
      if (file) {
        uploadFile(file);
      }
    },
    [uploadFile]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // リセット
  const handleReset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setFilename('');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        {status === 'idle' ? (
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-700'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,.mov"
              onChange={handleFileSelect}
              className="hidden"
              id="video-upload"
            />

            <div className="text-4xl mb-4">video_camera</div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              ここに動画ファイルをドラッグ&ドロップ
              <br />
              または
            </p>

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              ファイルを選択
            </Button>

            <p className="text-xs text-gray-400 mt-4">
              最大500MB、MP4・MOV形式対応
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <UploadProgress
              progress={progress}
              filename={filename}
              status={status}
              errorMessage={errorMessage}
            />

            {(status === 'complete' || status === 'error') && (
              <Button onClick={handleReset} variant="outline" size="sm">
                別のファイルをアップロード
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
