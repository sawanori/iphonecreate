# タスク: 進捗表示画面

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase5-004 |
| フェーズ | Phase 5: 進捗管理 |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

ユーザーの進捗一覧と選択履歴を表示する画面を作成する。完了/進行中/未開始のステータス表示を実装する。

---

## 前提条件

### 依存タスク
- phase5-003-choice-history.md（選択履歴記録が実装されていること）

### 前提成果物
- `src/lib/services/progress.service.ts`
- `src/hooks/useProgress.ts`

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/(viewer)/progress/page.tsx` | 新規作成 |
| `src/stores/progressStore.ts` | 新規作成 |
| `src/components/progress/ProgressCard.tsx` | 新規作成 |
| `src/components/progress/index.ts` | 新規作成 |

---

## 実装詳細

### ステップ 1: progressStore 作成

`src/stores/progressStore.ts`:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { UserProgress, ChoiceHistory, ProgressSummary } from '@/types';

interface ProgressStoreState {
  progressList: UserProgress[];
  summary: ProgressSummary | null;
  selectedProgress: UserProgress | null;
  choiceHistory: ChoiceHistory[];
  isLoading: boolean;
  error: string | null;
}

interface ProgressStoreActions {
  setProgressList: (list: UserProgress[]) => void;
  setSummary: (summary: ProgressSummary) => void;
  setSelectedProgress: (progress: UserProgress | null) => void;
  setChoiceHistory: (history: ChoiceHistory[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchProgressList: () => Promise<void>;
  fetchProgressDetail: (projectId: string) => Promise<void>;
  reset: () => void;
}

const initialState: ProgressStoreState = {
  progressList: [],
  summary: null,
  selectedProgress: null,
  choiceHistory: [],
  isLoading: false,
  error: null,
};

export const useProgressStore = create<ProgressStoreState & ProgressStoreActions>()(
  devtools(
    (set) => ({
      ...initialState,

      setProgressList: (list) => set({ progressList: list }, false, 'setProgressList'),
      setSummary: (summary) => set({ summary }, false, 'setSummary'),
      setSelectedProgress: (progress) => set({ selectedProgress: progress }, false, 'setSelectedProgress'),
      setChoiceHistory: (history) => set({ choiceHistory: history }, false, 'setChoiceHistory'),
      setIsLoading: (isLoading) => set({ isLoading }, false, 'setIsLoading'),
      setError: (error) => set({ error }, false, 'setError'),

      fetchProgressList: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/progress?summary=true');
          const data = await response.json();

          if (data.success) {
            set({
              progressList: data.data.progress,
              summary: data.data.summary,
              isLoading: false,
            });
          } else {
            set({
              error: data.error?.message ?? '進捗の取得に失敗しました',
              isLoading: false,
            });
          }
        } catch (e) {
          set({
            error: 'ネットワークエラー',
            isLoading: false,
          });
        }
      },

      fetchProgressDetail: async (projectId: string) => {
        set({ isLoading: true, error: null });

        try {
          const [progressRes, historyRes] = await Promise.all([
            fetch(`/api/progress/${projectId}`),
            fetch(`/api/progress/${projectId}/choice`),
          ]);

          const [progressData, historyData] = await Promise.all([
            progressRes.json(),
            historyRes.json(),
          ]);

          if (progressData.success && historyData.success) {
            set({
              selectedProgress: progressData.data.progress,
              choiceHistory: historyData.data.history,
              isLoading: false,
            });
          } else {
            set({
              error: '詳細の取得に失敗しました',
              isLoading: false,
            });
          }
        } catch (e) {
          set({
            error: 'ネットワークエラー',
            isLoading: false,
          });
        }
      },

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'progress-store' }
  )
);
```

### ステップ 2: ProgressCard コンポーネント作成

`src/components/progress/ProgressCard.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UserProgress } from '@/types';

export interface ProgressCardProps {
  progress: UserProgress;
  projectTitle?: string;
  className?: string;
}

export function ProgressCard({ progress, projectTitle, className }: ProgressCardProps) {
  const statusConfig = {
    not_started: {
      label: '未開始',
      color: 'bg-gray-100 text-gray-800',
      icon: '⏸️',
    },
    in_progress: {
      label: '進行中',
      color: 'bg-blue-100 text-blue-800',
      icon: '▶️',
    },
    completed: {
      label: '完了',
      color: 'bg-green-100 text-green-800',
      icon: '✅',
    },
  };

  const config = statusConfig[progress.status];

  // 視聴時間のフォーマット
  const formatWatchTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg truncate">
            {projectTitle ?? progress.projectId}
          </CardTitle>
          <span
            className={cn(
              'px-2 py-1 text-xs font-medium rounded-full',
              config.color
            )}
          >
            {config.icon} {config.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 進捗バー */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">進捗</span>
            <span className="font-medium">{progress.completionRate.toFixed(0)}%</span>
          </div>
          <Progress value={progress.completionRate} />
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">視聴時間</p>
            <p className="font-medium">{formatWatchTime(progress.totalWatchTime)}</p>
          </div>
          <div>
            <p className="text-gray-500">最終アクセス</p>
            <p className="font-medium">
              {new Date(progress.lastAccessedAt).toLocaleDateString('ja-JP')}
            </p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="pt-2">
          <Button asChild className="w-full">
            <Link href={`/watch/${progress.projectId}`}>
              {progress.status === 'completed' ? 'もう一度視聴' : '続きから視聴'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### ステップ 3: インデックスファイル作成

`src/components/progress/index.ts`:

```typescript
export { ProgressCard } from './ProgressCard';
export type { ProgressCardProps } from './ProgressCard';
```

### ステップ 4: 進捗表示ページ作成

`src/app/(viewer)/progress/page.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useProgressStore } from '@/stores/progressStore';
import { ProgressCard } from '@/components/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProgressPage() {
  const {
    progressList,
    summary,
    isLoading,
    error,
    fetchProgressList,
  } = useProgressStore();

  useEffect(() => {
    fetchProgressList();
  }, [fetchProgressList]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">学習進捗</h1>

      {/* サマリーカード */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                総コンテンツ数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summary.totalProjects}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                完了
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {summary.completedProjects}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                進行中
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {summary.inProgressProjects}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                総視聴時間
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {Math.floor(summary.totalWatchTime / 60)}分
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 進捗一覧 */}
      {progressList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">
              まだ視聴履歴がありません
            </p>
            <p className="text-sm text-gray-400">
              動画を視聴すると、ここに進捗が表示されます
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {progressList.map((progress) => (
            <ProgressCard key={progress.id} progress={progress} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 完了条件

- [x] 進捗表示ページが作成されている
- [x] 進捗一覧が表示される
- [x] 完了/進行中/未開始のステータスが表示される
- [x] サマリー情報が表示される
- [x] 各進捗から視聴画面に遷移できる

---

## テスト方法

### 1. ページアクセステスト

```bash
npm run dev
# ログイン後 http://localhost:3000/progress にアクセス
```

### 2. 表示確認

```
1. サマリーカードが表示される
2. 進捗一覧が表示される（または「履歴がありません」メッセージ）
3. ステータスに応じた色分けがされている
```

### 3. 遷移テスト

```
1. 「続きから視聴」ボタンをクリック
2. 視聴画面に遷移する
3. 動画が前回の続きから再生される（実装次第）
```

---

## 参照設計書セクション

- DESIGN-FE-2026-001 セクション4.2: ルーティング構造

---

## 成果物

- `src/app/(viewer)/progress/page.tsx`
- `src/stores/progressStore.ts`
- `src/components/progress/ProgressCard.tsx`

---

## 次のタスク

- phase5-005-analytics-dashboard.md: 分析ダッシュボード
