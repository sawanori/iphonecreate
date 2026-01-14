# タスク: 動画アップロード機能

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase4-004 |
| フェーズ | Phase 4: 管理画面 |
| 作成日 | 2026-01-14 |
| 想定工数 | 2日 |
| 検証レベル | L1（単体） |

---

## 概要

動画アップロードコンポーネントと API ルートを作成する。ファイルサイズ制限（500MB）、形式制限（MP4のみ）、アップロード進捗表示を実装する。

---

## 前提条件

### 依存タスク
- phase4-003-r2-storage.md（R2 ストレージ接続が完了していること）

### 前提成果物
- `src/lib/storage/index.ts`

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/components/upload/VideoUploader.tsx` | 新規作成 |
| `src/components/upload/UploadProgress.tsx` | 新規作成 |
| `src/components/upload/index.ts` | 新規作成 |
| `src/app/api/upload/route.ts` | 新規作成 |
| `src/app/api/upload/complete/route.ts` | 新規作成 |

---

## 実装詳細

### ステップ 1: アップロード API ルート作成

`src/app/api/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { generateUploadUrl, generateVideoKey } from '@/lib/storage';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';

// リクエストスキーマ
const uploadRequestSchema = z.object({
  filename: z.string().min(1, 'ファイル名は必須です'),
  contentType: z.string().refine(
    (type) => type === 'video/mp4',
    { message: 'MP4形式のみアップロード可能です' }
  ),
  size: z.number()
    .positive('ファイルサイズは正の数である必要があります')
    .max(500 * 1024 * 1024, 'ファイルサイズは500MB以下である必要があります'),
  projectId: z.string().optional(),
});

/**
 * POST /api/upload
 * アップロード用署名付きURLを発行
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    // 管理者のみアップロード可能
    if (session.user.role !== 'admin') {
      return errorResponse(ErrorCodes.FORBIDDEN, '管理者のみアップロード可能です', 403);
    }

    // リクエストボディをパース
    const body = await request.json();
    const result = uploadRequestSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => e.message).join(', ');
      return errorResponse(ErrorCodes.VALIDATION_ERROR, errors, 400);
    }

    const { filename, contentType, size, projectId } = result.data;

    // ファイルキーを生成
    const key = generateVideoKey(
      projectId ?? `temp-${session.user.id}`,
      filename
    );

    // 署名付きURLを生成
    const { uploadUrl, expiresAt } = await generateUploadUrl({
      key,
      contentType,
      expiresIn: 3600, // 1時間
    });

    return successResponse({
      uploadUrl,
      fileKey: key,
      expiresAt,
    });
  } catch (error) {
    console.error('Upload URL generation error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'アップロードURLの生成に失敗しました',
      500
    );
  }
}
```

### ステップ 2: アップロード完了 API ルート作成

`src/app/api/upload/complete/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { fileExists, getPublicUrl } from '@/lib/storage';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';

// リクエストスキーマ
const completeRequestSchema = z.object({
  fileKey: z.string().min(1, 'ファイルキーは必須です'),
  projectId: z.string().optional(),
});

/**
 * POST /api/upload/complete
 * アップロード完了を通知し、メタデータを返す
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    if (session.user.role !== 'admin') {
      return errorResponse(ErrorCodes.FORBIDDEN, '管理者のみ実行可能です', 403);
    }

    // リクエストボディをパース
    const body = await request.json();
    const result = completeRequestSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => e.message).join(', ');
      return errorResponse(ErrorCodes.VALIDATION_ERROR, errors, 400);
    }

    const { fileKey } = result.data;

    // ファイルの存在確認
    const exists = await fileExists(fileKey);
    if (!exists) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        'アップロードされたファイルが見つかりません',
        404
      );
    }

    // 公開URLを取得
    const videoUrl = getPublicUrl(fileKey);

    // TODO: サムネイル生成（将来の拡張）
    // TODO: 動画メタデータ取得（duration, width, height）

    return successResponse({
      videoUrl,
      thumbnailUrl: null, // サムネイル生成は将来実装
      metadata: {
        duration: 0, // 動画解析は将来実装
        width: 0,
        height: 0,
      },
    });
  } catch (error) {
    console.error('Upload complete error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'アップロード完了処理に失敗しました',
      500
    );
  }
}
```

### ステップ 3: UploadProgress コンポーネント作成

`src/components/upload/UploadProgress.tsx`:

```typescript
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
```

### ステップ 4: VideoUploader コンポーネント作成

`src/components/upload/VideoUploader.tsx`:

```typescript
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
    // 形式チェック
    if (file.type !== 'video/mp4') {
      return 'MP4形式のみアップロード可能です';
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
        const message = error instanceof Error ? error.message : 'アップロードに失敗しました';
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
              accept="video/mp4"
              onChange={handleFileSelect}
              className="hidden"
              id="video-upload"
            />

            <div className="text-4xl mb-4">📹</div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              ここにMP4ファイルをドラッグ&ドロップ
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
              最大500MB、MP4形式のみ
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
```

### ステップ 5: インデックスファイル作成

`src/components/upload/index.ts`:

```typescript
export { VideoUploader } from './VideoUploader';
export type { VideoUploaderProps } from './VideoUploader';

export { UploadProgress } from './UploadProgress';
export type { UploadProgressProps } from './UploadProgress';
```

---

## 完了条件

- [x] AC-A-003: MP4ファイルをアップロードできる
- [x] AC-UPLOAD-002: 500MBを超えるファイルは拒否される
- [x] AC-UPLOAD-003: MP4以外の形式は拒否される
- [x] アップロード進捗が表示される
- [x] ドラッグ&ドロップが動作する

---

## テスト方法

### 1. アップロードテスト

```bash
npm run dev
# テストページを作成してアップロードを確認
```

`src/app/test/upload/page.tsx`:

```typescript
'use client';

import { VideoUploader } from '@/components/upload';

export default function UploadTestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">動画アップロードテスト</h1>

      <VideoUploader
        projectId="test-project"
        onUploadComplete={(result) => {
          console.log('アップロード完了:', result);
          alert(`アップロード完了: ${result.videoUrl}`);
        }}
        onError={(error) => {
          console.error('エラー:', error);
        }}
      />
    </div>
  );
}
```

### 2. バリデーションテスト

```
1. 500MB超のファイルを選択 → エラー表示
2. MP4以外のファイルを選択 → エラー表示
3. 有効なMP4ファイルを選択 → アップロード開始
```

---

## 参照設計書セクション

- DESIGN-FE-2026-001 セクション5.3: アップロードコンポーネント
- DESIGN-BE-2026-001 セクション5.7: ファイルアップロードAPI
- DESIGN-BE-2026-001 セクション8.3: アップロードフロー

---

## 成果物

- `src/components/upload/VideoUploader.tsx`
- `src/components/upload/UploadProgress.tsx`
- `src/app/api/upload/route.ts`
- `src/app/api/upload/complete/route.ts`

---

## 次のタスク

- phase4-005-branch-api.md: 分岐設定API
