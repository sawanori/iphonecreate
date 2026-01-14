# タスク: 進捗記録API実装

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase5-002 |
| フェーズ | Phase 5: 進捗管理 |
| 作成日 | 2026-01-14 |
| 想定工数 | 2日 |
| 検証レベル | L1（単体） |

---

## 概要

進捗記録と取得のAPIルートを作成する。視聴開始時の進捗レコード作成、進捗更新、自分の進捗のみ取得可能な制限を実装する。

---

## 前提条件

### 依存タスク
- phase5-001-progress-schema.md（進捗スキーマが定義されていること）

### 前提成果物
- `src/lib/db/schema/progress.ts`
- 認証機能

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/api/progress/route.ts` | 新規作成 |
| `src/app/api/progress/[videoId]/route.ts` | 新規作成 |
| `src/lib/services/progress.service.ts` | 新規作成 |
| `src/hooks/useProgress.ts` | 新規作成 |

---

## 実装詳細

### ステップ 1: progress.service.ts 作成

`src/lib/services/progress.service.ts`:

```typescript
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  userProgress,
  choiceHistory,
  type InsertUserProgress,
  type SelectUserProgress,
} from '@/lib/db/schema';

/**
 * ユーザーの進捗一覧を取得
 */
export async function getUserProgressList(
  userId: string
): Promise<SelectUserProgress[]> {
  return db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, userId))
    .orderBy(desc(userProgress.lastAccessedAt));
}

/**
 * 特定プロジェクトの進捗を取得
 */
export async function getProgressByProject(
  userId: string,
  projectId: string
): Promise<SelectUserProgress | null> {
  const result = await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.projectId, projectId)
      )
    )
    .limit(1);

  return result[0] ?? null;
}

/**
 * 進捗レコードを作成または取得
 */
export async function getOrCreateProgress(
  userId: string,
  projectId: string
): Promise<SelectUserProgress> {
  // 既存の進捗を確認
  const existing = await getProgressByProject(userId, projectId);
  if (existing) {
    return existing;
  }

  // 新規作成
  const result = await db
    .insert(userProgress)
    .values({
      userId,
      projectId,
      status: 'not_started',
      startedAt: new Date(),
    })
    .returning();

  return result[0];
}

/**
 * 進捗を更新
 */
export async function updateProgress(
  progressId: string,
  data: Partial<{
    status: 'not_started' | 'in_progress' | 'completed';
    currentNodeId: string;
    totalWatchTime: number;
    completionRate: number;
    completedAt: Date;
  }>
): Promise<SelectUserProgress | null> {
  const result = await db
    .update(userProgress)
    .set({
      ...data,
      lastAccessedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userProgress.id, progressId))
    .returning();

  return result[0] ?? null;
}

/**
 * 視聴開始を記録
 */
export async function startWatching(
  userId: string,
  projectId: string,
  startNodeId: string
): Promise<SelectUserProgress> {
  const progress = await getOrCreateProgress(userId, projectId);

  if (progress.status === 'not_started') {
    await updateProgress(progress.id, {
      status: 'in_progress',
      currentNodeId: startNodeId,
    });
  }

  return progress;
}

/**
 * 視聴完了を記録
 */
export async function completeWatching(
  progressId: string
): Promise<SelectUserProgress | null> {
  return updateProgress(progressId, {
    status: 'completed',
    completionRate: 100,
    completedAt: new Date(),
  });
}

/**
 * 視聴時間を加算
 */
export async function addWatchTime(
  progressId: string,
  seconds: number
): Promise<SelectUserProgress | null> {
  const progress = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.id, progressId))
    .limit(1);

  if (!progress[0]) return null;

  const newTotalTime = progress[0].totalWatchTime + seconds;

  return updateProgress(progressId, {
    totalWatchTime: newTotalTime,
  });
}

/**
 * 進捗サマリーを取得
 */
export async function getProgressSummary(userId: string) {
  const progressList = await getUserProgressList(userId);

  const totalProjects = progressList.length;
  const completedProjects = progressList.filter(
    (p) => p.status === 'completed'
  ).length;
  const inProgressProjects = progressList.filter(
    (p) => p.status === 'in_progress'
  ).length;
  const totalWatchTime = progressList.reduce(
    (sum, p) => sum + p.totalWatchTime,
    0
  );

  return {
    totalProjects,
    completedProjects,
    inProgressProjects,
    totalWatchTime,
  };
}
```

### ステップ 2: 進捗一覧API作成

`src/app/api/progress/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserProgressList, getProgressSummary } from '@/lib/services/progress.service';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';

/**
 * GET /api/progress
 * 自分の進捗一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    const searchParams = request.nextUrl.searchParams;
    const includeSummary = searchParams.get('summary') === 'true';

    const progressList = await getUserProgressList(session.user.id);

    const response: Record<string, unknown> = { progress: progressList };

    if (includeSummary) {
      const summary = await getProgressSummary(session.user.id);
      response.summary = summary;
    }

    return successResponse(response);
  } catch (error) {
    console.error('Get progress list error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      '進捗一覧の取得に失敗しました',
      500
    );
  }
}
```

### ステップ 3: 個別進捗API作成

`src/app/api/progress/[videoId]/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import {
  getProgressByProject,
  startWatching,
  updateProgress,
  addWatchTime,
  completeWatching,
} from '@/lib/services/progress.service';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';

const updateProgressSchema = z.object({
  action: z.enum(['start', 'update', 'complete', 'addTime']),
  currentNodeId: z.string().optional(),
  watchTime: z.number().optional(),
  completionRate: z.number().min(0).max(100).optional(),
});

/**
 * GET /api/progress/[videoId]
 * 特定プロジェクトの進捗を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    const progress = await getProgressByProject(
      session.user.id,
      params.videoId
    );

    // AC-PROGRESS-004: 自分以外の進捗データは取得できない
    // (getProgressByProject で userId を指定しているため自動的に制限される)

    if (!progress) {
      return successResponse({ progress: null });
    }

    return successResponse({ progress });
  } catch (error) {
    console.error('Get progress error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      '進捗の取得に失敗しました',
      500
    );
  }
}

/**
 * POST /api/progress/[videoId]
 * 進捗を更新
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    const body = await request.json();
    const result = updateProgressSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'バリデーションエラー', 400);
    }

    const { action, currentNodeId, watchTime, completionRate } = result.data;

    let progress;

    switch (action) {
      case 'start':
        // AC-PROGRESS-001: 視聴開始時に進捗レコードが作成される
        if (!currentNodeId) {
          return errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            '開始ノードIDが必要です',
            400
          );
        }
        progress = await startWatching(
          session.user.id,
          params.videoId,
          currentNodeId
        );
        break;

      case 'update':
        const existing = await getProgressByProject(
          session.user.id,
          params.videoId
        );
        if (!existing) {
          return errorResponse(ErrorCodes.NOT_FOUND, '進捗が見つかりません', 404);
        }
        progress = await updateProgress(existing.id, {
          currentNodeId,
          completionRate,
        });
        break;

      case 'addTime':
        if (watchTime === undefined) {
          return errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            '視聴時間が必要です',
            400
          );
        }
        const progressForTime = await getProgressByProject(
          session.user.id,
          params.videoId
        );
        if (!progressForTime) {
          return errorResponse(ErrorCodes.NOT_FOUND, '進捗が見つかりません', 404);
        }
        progress = await addWatchTime(progressForTime.id, watchTime);
        break;

      case 'complete':
        // AC-PROGRESS-003: 終了ノード到達で完了ステータスになる
        const progressForComplete = await getProgressByProject(
          session.user.id,
          params.videoId
        );
        if (!progressForComplete) {
          return errorResponse(ErrorCodes.NOT_FOUND, '進捗が見つかりません', 404);
        }
        progress = await completeWatching(progressForComplete.id);
        break;

      default:
        return errorResponse(ErrorCodes.VALIDATION_ERROR, '無効なアクション', 400);
    }

    return successResponse({ progress });
  } catch (error) {
    console.error('Update progress error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      '進捗の更新に失敗しました',
      500
    );
  }
}
```

### ステップ 4: useProgress フック作成

`src/hooks/useProgress.ts`:

```typescript
'use client';

import { useCallback, useState } from 'react';
import type { UserProgress } from '@/types';

export interface UseProgressReturn {
  progress: UserProgress | null;
  isLoading: boolean;
  error: string | null;
  startWatching: (projectId: string, startNodeId: string) => Promise<void>;
  updateProgress: (projectId: string, data: { currentNodeId?: string; completionRate?: number }) => Promise<void>;
  addWatchTime: (projectId: string, seconds: number) => Promise<void>;
  completeWatching: (projectId: string) => Promise<void>;
  fetchProgress: (projectId: string) => Promise<void>;
}

export function useProgress(): UseProgressReturn {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/progress/${projectId}`);
      const data = await response.json();

      if (data.success) {
        setProgress(data.data.progress);
      } else {
        setError(data.error?.message ?? '進捗の取得に失敗しました');
      }
    } catch (e) {
      setError('ネットワークエラー');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startWatching = useCallback(async (projectId: string, startNodeId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/progress/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', currentNodeId: startNodeId }),
      });

      const data = await response.json();

      if (data.success) {
        setProgress(data.data.progress);
      } else {
        setError(data.error?.message ?? '視聴開始の記録に失敗しました');
      }
    } catch (e) {
      setError('ネットワークエラー');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProgress = useCallback(async (projectId: string, updateData: { currentNodeId?: string; completionRate?: number }) => {
    try {
      const response = await fetch(`/api/progress/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', ...updateData }),
      });

      const data = await response.json();

      if (data.success) {
        setProgress(data.data.progress);
      }
    } catch (e) {
      console.error('Progress update error:', e);
    }
  }, []);

  const addWatchTime = useCallback(async (projectId: string, seconds: number) => {
    try {
      await fetch(`/api/progress/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addTime', watchTime: seconds }),
      });
    } catch (e) {
      console.error('Add watch time error:', e);
    }
  }, []);

  const completeWatching = useCallback(async (projectId: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/progress/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });

      const data = await response.json();

      if (data.success) {
        setProgress(data.data.progress);
      }
    } catch (e) {
      console.error('Complete watching error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    progress,
    isLoading,
    error,
    startWatching,
    updateProgress,
    addWatchTime,
    completeWatching,
    fetchProgress,
  };
}
```

---

## 完了条件

- [x] 進捗記録APIが作成されている
- [x] AC-PROGRESS-001: 視聴開始時に進捗レコードが作成される
- [x] AC-PROGRESS-004: 自分以外の進捗データは取得できない
- [x] useProgress フックが作成されている
- [x] TanStack Query または独自フックで状態管理ができている

---

## テスト方法

### 1. API テスト

```bash
npm run dev

# 進捗一覧取得
curl http://localhost:3000/api/progress \
  -H "Cookie: next-auth.session-token=..."

# 視聴開始
curl -X POST http://localhost:3000/api/progress/project-id \
  -H "Content-Type: application/json" \
  -d '{"action":"start","currentNodeId":"node-id"}'
```

### 2. 権限テスト

```
1. ユーザーAでログイン
2. 進捗を作成
3. ログアウト
4. ユーザーBでログイン
5. ユーザーAの進捗にアクセス → 取得できないことを確認
```

---

## 参照設計書セクション

- DESIGN-BE-2026-001 セクション5.5: 進捗記録API

---

## 成果物

- `src/lib/services/progress.service.ts`
- `src/app/api/progress/route.ts`
- `src/app/api/progress/[videoId]/route.ts`
- `src/hooks/useProgress.ts`

---

## 次のタスク

- phase5-003-choice-history.md: 選択履歴記録機能
