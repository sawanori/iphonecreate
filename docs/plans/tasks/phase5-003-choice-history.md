# タスク: 選択履歴記録機能

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase5-003 |
| フェーズ | Phase 5: 進捗管理 |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

選択履歴を記録するAPIルートを作成する。選択時間、タイムアウトフラグの記録と、VideoPlayer への統合を実装する。

---

## 前提条件

### 依存タスク
- phase5-002-progress-api.md（進捗記録APIが実装されていること）

### 前提成果物
- `src/lib/db/schema/progress.ts`
- `src/lib/services/progress.service.ts`
- `src/components/video/VideoPlayer.tsx`

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/api/progress/[videoId]/choice/route.ts` | 新規作成 |
| `src/lib/services/choice-history.service.ts` | 新規作成 |
| `src/hooks/useProgress.ts` | 更新 |

---

## 実装詳細

### ステップ 1: choice-history.service.ts 作成

`src/lib/services/choice-history.service.ts`:

```typescript
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  choiceHistory,
  userProgress,
  type InsertChoiceHistory,
  type SelectChoiceHistory,
} from '@/lib/db/schema';

/**
 * 選択履歴を記録
 */
export async function recordChoice(
  data: Omit<InsertChoiceHistory, 'id' | 'selectedAt'>
): Promise<SelectChoiceHistory> {
  const result = await db
    .insert(choiceHistory)
    .values({
      ...data,
      selectedAt: new Date(),
    })
    .returning();

  return result[0];
}

/**
 * 進捗IDから選択履歴を取得
 */
export async function getChoiceHistoryByProgress(
  progressId: string
): Promise<SelectChoiceHistory[]> {
  return db
    .select()
    .from(choiceHistory)
    .where(eq(choiceHistory.progressId, progressId))
    .orderBy(desc(choiceHistory.selectedAt));
}

/**
 * ノード別の選択統計を取得
 */
export async function getChoiceStatsByNode(
  nodeId: string
): Promise<{
  totalSelections: number;
  averageResponseTime: number;
  timeoutRate: number;
  choiceDistribution: Record<string, number>;
}> {
  const history = await db
    .select()
    .from(choiceHistory)
    .where(eq(choiceHistory.nodeId, nodeId));

  if (history.length === 0) {
    return {
      totalSelections: 0,
      averageResponseTime: 0,
      timeoutRate: 0,
      choiceDistribution: {},
    };
  }

  const totalSelections = history.length;
  const averageResponseTime =
    history.reduce((sum, h) => sum + h.responseTime, 0) / totalSelections;
  const timeoutCount = history.filter((h) => h.isTimeout).length;
  const timeoutRate = (timeoutCount / totalSelections) * 100;

  const choiceDistribution: Record<string, number> = {};
  for (const h of history) {
    choiceDistribution[h.choiceId] = (choiceDistribution[h.choiceId] ?? 0) + 1;
  }

  return {
    totalSelections,
    averageResponseTime,
    timeoutRate,
    choiceDistribution,
  };
}

/**
 * ユーザーの選択パターンを取得
 */
export async function getUserChoicePattern(
  progressId: string
): Promise<Array<{
  nodeId: string;
  choiceId: string;
  responseTime: number;
  isTimeout: boolean;
  selectedAt: Date;
}>> {
  const history = await getChoiceHistoryByProgress(progressId);

  return history.map((h) => ({
    nodeId: h.nodeId,
    choiceId: h.choiceId,
    responseTime: h.responseTime,
    isTimeout: h.isTimeout,
    selectedAt: h.selectedAt,
  }));
}
```

### ステップ 2: 選択履歴APIルート作成

`src/app/api/progress/[videoId]/choice/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getProgressByProject } from '@/lib/services/progress.service';
import {
  recordChoice,
  getChoiceHistoryByProgress,
} from '@/lib/services/choice-history.service';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';

const recordChoiceSchema = z.object({
  nodeId: z.string().min(1, 'ノードIDは必須です'),
  choiceId: z.string().min(1, '選択肢IDは必須です'),
  responseTime: z.number().min(0, '応答時間は0以上である必要があります'),
  isTimeout: z.boolean().default(false),
});

/**
 * GET /api/progress/[videoId]/choice
 * 選択履歴を取得
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

    // 自分の進捗を取得
    const progress = await getProgressByProject(
      session.user.id,
      params.videoId
    );

    if (!progress) {
      return successResponse({ history: [] });
    }

    const history = await getChoiceHistoryByProgress(progress.id);

    return successResponse({ history });
  } catch (error) {
    console.error('Get choice history error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      '選択履歴の取得に失敗しました',
      500
    );
  }
}

/**
 * POST /api/progress/[videoId]/choice
 * 選択を記録
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
    const result = recordChoiceSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => e.message).join(', ');
      return errorResponse(ErrorCodes.VALIDATION_ERROR, errors, 400);
    }

    // 進捗を取得
    const progress = await getProgressByProject(
      session.user.id,
      params.videoId
    );

    if (!progress) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        '進捗が見つかりません。先に視聴を開始してください。',
        404
      );
    }

    // AC-PROGRESS-002: 選択履歴が時刻とともに記録される
    const choice = await recordChoice({
      progressId: progress.id,
      nodeId: result.data.nodeId,
      choiceId: result.data.choiceId,
      responseTime: result.data.responseTime,
      isTimeout: result.data.isTimeout,
    });

    return successResponse({ choice }, undefined, 201);
  } catch (error) {
    console.error('Record choice error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      '選択の記録に失敗しました',
      500
    );
  }
}
```

### ステップ 3: useProgress フック更新

`src/hooks/useProgress.ts` に追加:

```typescript
// 既存のインターフェースに追加
export interface UseProgressReturn {
  // ... 既存のプロパティ
  choiceHistory: ChoiceHistoryItem[];
  recordChoice: (
    projectId: string,
    data: {
      nodeId: string;
      choiceId: string;
      responseTime: number;
      isTimeout: boolean;
    }
  ) => Promise<void>;
  fetchChoiceHistory: (projectId: string) => Promise<void>;
}

interface ChoiceHistoryItem {
  id: string;
  nodeId: string;
  choiceId: string;
  responseTime: number;
  isTimeout: boolean;
  selectedAt: string;
}

// useProgress 関数内に追加
export function useProgress(): UseProgressReturn {
  // ... 既存のコード
  const [choiceHistory, setChoiceHistory] = useState<ChoiceHistoryItem[]>([]);

  const fetchChoiceHistory = useCallback(async (projectId: string) => {
    try {
      const response = await fetch(`/api/progress/${projectId}/choice`);
      const data = await response.json();

      if (data.success) {
        setChoiceHistory(data.data.history);
      }
    } catch (e) {
      console.error('Fetch choice history error:', e);
    }
  }, []);

  const recordChoice = useCallback(
    async (
      projectId: string,
      choiceData: {
        nodeId: string;
        choiceId: string;
        responseTime: number;
        isTimeout: boolean;
      }
    ) => {
      try {
        const response = await fetch(`/api/progress/${projectId}/choice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(choiceData),
        });

        const data = await response.json();

        if (data.success) {
          // 履歴に追加
          setChoiceHistory((prev) => [data.data.choice, ...prev]);
        }
      } catch (e) {
        console.error('Record choice error:', e);
      }
    },
    []
  );

  return {
    // ... 既存のプロパティ
    choiceHistory,
    recordChoice,
    fetchChoiceHistory,
  };
}
```

---

## 完了条件

- [x] 選択履歴APIが作成されている
- [x] AC-PROGRESS-002: 選択履歴が時刻とともに記録される
- [x] AC-PROGRESS-003: 終了ノード到達で完了ステータスになる（前タスクとの連携）
- [x] responseTime と isTimeout が正しく記録される
- [x] useProgress フックが更新されている

---

## テスト方法

### 1. 選択履歴記録テスト

```bash
# 選択を記録
curl -X POST http://localhost:3000/api/progress/project-id/choice \
  -H "Content-Type: application/json" \
  -H "Cookie: ..." \
  -d '{
    "nodeId": "node-1",
    "choiceId": "choice-1",
    "responseTime": 3.5,
    "isTimeout": false
  }'
```

### 2. 選択履歴取得テスト

```bash
# 履歴取得
curl http://localhost:3000/api/progress/project-id/choice \
  -H "Cookie: ..."
```

### 3. 視聴画面統合テスト

```
1. 視聴画面で動画を再生
2. 選択肢を選択
3. DevToolsのNetworkタブでPOSTリクエストを確認
4. responseTime と isTimeout が正しいことを確認
```

---

## 参照設計書セクション

- DESIGN-BE-2026-001 セクション5.5: 進捗記録API

---

## 成果物

- `src/lib/services/choice-history.service.ts`
- `src/app/api/progress/[videoId]/choice/route.ts`
- 更新された `src/hooks/useProgress.ts`

---

## 注意事項

- responseTime は秒単位で小数点対応
- タイムアウトの場合は isTimeout: true を設定
- 選択履歴は時系列で保存

---

## 次のタスク

- phase5-004-progress-page.md: 進捗表示画面
