'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

/**
 * UploadProgress コンポーネントのProps
 */
export interface UploadProgressProps {
  /** 進捗率（0-100） */
  progress: number;
  /** ファイル名 */
  filename?: string;
  /** 状態 */
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  /** エラーメッセージ */
  errorMessage?: string;
  /** 追加のクラス名 */
  className?: string;
}

/**
 * アップロード進捗表示コンポーネント
 */
export function UploadProgress({
  progress,
  filename,
  status,
  errorMessage,
  className,
}: UploadProgressProps) {
  const statusText = {
    idle: '待機中',
    uploading: 'アップロード中...',
    processing: '処理中...',
    complete: '完了',
    error: 'エラー',
  };

  const statusColor = {
    idle: 'text-gray-500',
    uploading: 'text-blue-500',
    processing: 'text-yellow-500',
    complete: 'text-green-500',
    error: 'text-red-500',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {filename && (
        <div className="flex items-center justify-between text-sm">
          <span className="truncate max-w-[200px]">{filename}</span>
          <span className={cn('font-medium', statusColor[status])}>
            {statusText[status]}
          </span>
        </div>
      )}

      <Progress
        value={progress}
        className={cn(
          status === 'error' && '[&>div]:bg-red-500',
          status === 'complete' && '[&>div]:bg-green-500'
        )}
      />

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{progress.toFixed(0)}%</span>
        {status === 'uploading' && <span>アップロード中...</span>}
      </div>

      {status === 'error' && errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
