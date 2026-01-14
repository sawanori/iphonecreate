# タスク: 分析ダッシュボード

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase5-005 |
| フェーズ | Phase 5: 進捗管理 |
| 作成日 | 2026-01-14 |
| 想定工数 | 2日 |
| 検証レベル | L1（単体） |

---

## 概要

管理者向けの分析ダッシュボードを作成する。全体の完了率、動画別の選択傾向データを取得・表示するAPIとUIを実装する。

---

## 前提条件

### 依存タスク
- phase5-004-progress-page.md（進捗表示画面が実装されていること）

### 前提成果物
- `src/lib/services/progress.service.ts`
- `src/lib/services/choice-history.service.ts`
- AdminLayout

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/api/analytics/route.ts` | 新規作成 |
| `src/app/api/analytics/[videoId]/route.ts` | 新規作成 |
| `src/lib/services/analytics.service.ts` | 新規作成 |
| `src/app/(admin)/dashboard/page.tsx` | 更新 |

---

## 実装詳細

### ステップ 1: analytics.service.ts 作成

`src/lib/services/analytics.service.ts`:

```typescript
import { eq, count, avg, sql, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  userProgress,
  choiceHistory,
  videoProjects,
  videoNodes,
  choices,
} from '@/lib/db/schema';

/**
 * 全体の分析データを取得
 */
export async function getOverallAnalytics() {
  // 総視聴回数と完了率
  const progressStats = await db
    .select({
      total: count(),
      completed: sql<number>`COUNT(*) FILTER (WHERE status = 'completed')`,
      inProgress: sql<number>`COUNT(*) FILTER (WHERE status = 'in_progress')`,
      totalWatchTime: sql<number>`SUM(total_watch_time)`,
    })
    .from(userProgress);

  const stats = progressStats[0];
  const completionRate = stats.total > 0
    ? (Number(stats.completed) / stats.total) * 100
    : 0;

  // プロジェクト別統計
  const projectStats = await db
    .select({
      projectId: userProgress.projectId,
      totalViews: count(),
      completed: sql<number>`COUNT(*) FILTER (WHERE status = 'completed')`,
      avgWatchTime: avg(userProgress.totalWatchTime),
    })
    .from(userProgress)
    .groupBy(userProgress.projectId);

  return {
    totalViews: stats.total,
    completedViews: Number(stats.completed),
    inProgressViews: Number(stats.inProgress),
    overallCompletionRate: completionRate,
    totalWatchTime: Number(stats.totalWatchTime) ?? 0,
    projectStats,
  };
}

/**
 * プロジェクト別の分析データを取得
 */
export async function getProjectAnalytics(projectId: string) {
  // 基本統計
  const basicStats = await db
    .select({
      totalViews: count(),
      completed: sql<number>`COUNT(*) FILTER (WHERE status = 'completed')`,
      avgWatchTime: avg(userProgress.totalWatchTime),
      avgCompletionRate: avg(userProgress.completionRate),
    })
    .from(userProgress)
    .where(eq(userProgress.projectId, projectId));

  const stats = basicStats[0];
  const completionRate = stats.totalViews > 0
    ? (Number(stats.completed) / stats.totalViews) * 100
    : 0;

  // ノード別選択統計
  const nodes = await db
    .select()
    .from(videoNodes)
    .where(eq(videoNodes.projectId, projectId));

  const nodeAnalytics = await Promise.all(
    nodes.map(async (node) => {
      // このノードの選択肢を取得
      const nodeChoices = await db
        .select()
        .from(choices)
        .where(eq(choices.nodeId, node.id));

      // 選択肢ごとの統計
      const choiceStats = await Promise.all(
        nodeChoices.map(async (choice) => {
          const selectStats = await db
            .select({
              selectCount: count(),
              avgResponseTime: avg(choiceHistory.responseTime),
              timeoutCount: sql<number>`COUNT(*) FILTER (WHERE is_timeout = true)`,
            })
            .from(choiceHistory)
            .where(eq(choiceHistory.choiceId, choice.id));

          return {
            choiceId: choice.id,
            choiceText: choice.text,
            selectCount: selectStats[0].selectCount,
            avgResponseTime: Number(selectStats[0].avgResponseTime) ?? 0,
            timeoutCount: Number(selectStats[0].timeoutCount) ?? 0,
          };
        })
      );

      const totalSelections = choiceStats.reduce(
        (sum, c) => sum + c.selectCount,
        0
      );

      return {
        nodeId: node.id,
        nodeTitle: node.title,
        totalSelections,
        choiceStats: choiceStats.map((c) => ({
          ...c,
          selectRate: totalSelections > 0
            ? (c.selectCount / totalSelections) * 100
            : 0,
        })),
      };
    })
  );

  return {
    projectId,
    totalViews: stats.totalViews,
    completionRate,
    averageWatchTime: Number(stats.avgWatchTime) ?? 0,
    averageCompletionRate: Number(stats.avgCompletionRate) ?? 0,
    nodeAnalytics: nodeAnalytics.filter((n) => n.totalSelections > 0),
  };
}

/**
 * 選択傾向サマリーを取得
 */
export async function getChoiceTrends(projectId: string) {
  const result = await db
    .select({
      choiceId: choiceHistory.choiceId,
      nodeId: choiceHistory.nodeId,
      selectCount: count(),
      avgResponseTime: avg(choiceHistory.responseTime),
      timeoutRate: sql<number>`
        (COUNT(*) FILTER (WHERE is_timeout = true)::float / COUNT(*)::float) * 100
      `,
    })
    .from(choiceHistory)
    .innerJoin(userProgress, eq(choiceHistory.progressId, userProgress.id))
    .where(eq(userProgress.projectId, projectId))
    .groupBy(choiceHistory.choiceId, choiceHistory.nodeId);

  return result;
}
```

### ステップ 2: 全体分析API作成

`src/app/api/analytics/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getOverallAnalytics } from '@/lib/services/analytics.service';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';

/**
 * GET /api/analytics
 * 全体の分析データを取得（管理者のみ）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    // AC-ANALYTICS-003: 視聴者は分析データにアクセスできない
    if (session.user.role !== 'admin') {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        '管理者のみアクセス可能です',
        403
      );
    }

    // AC-ANALYTICS-001: 管理者は全体の完了率を取得できる
    const analytics = await getOverallAnalytics();

    return successResponse({ analytics });
  } catch (error) {
    console.error('Get analytics error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      '分析データの取得に失敗しました',
      500
    );
  }
}
```

### ステップ 3: プロジェクト別分析API作成

`src/app/api/analytics/[videoId]/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getProjectAnalytics } from '@/lib/services/analytics.service';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';

/**
 * GET /api/analytics/[videoId]
 * プロジェクト別の分析データを取得（管理者のみ）
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

    // AC-ANALYTICS-003: 視聴者は分析データにアクセスできない
    if (session.user.role !== 'admin') {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        '管理者のみアクセス可能です',
        403
      );
    }

    // AC-ANALYTICS-002: 動画別の選択傾向データを取得できる
    const analytics = await getProjectAnalytics(params.videoId);

    return successResponse({ analytics });
  } catch (error) {
    console.error('Get project analytics error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      '分析データの取得に失敗しました',
      500
    );
  }
}
```

### ステップ 4: ダッシュボード更新

`src/app/(admin)/dashboard/page.tsx` を更新:

```typescript
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getProjects } from '@/lib/services/video.service';
import { getOverallAnalytics } from '@/lib/services/analytics.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default async function DashboardPage() {
  const session = await auth();
  const projects = await getProjects(session?.user?.id);
  const analytics = await getOverallAnalytics();

  const publishedCount = projects.filter((p) => p.isPublished).length;
  const draftCount = projects.length - publishedCount;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        <Button asChild>
          <Link href="/editor/new">新規プロジェクト作成</Link>
        </Button>
      </div>

      {/* 分析サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              総視聴回数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.totalViews}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              完了率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {analytics.overallCompletionRate.toFixed(1)}%
            </p>
            <Progress value={analytics.overallCompletionRate} className="mt-2" />
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
              {Math.floor(analytics.totalWatchTime / 3600)}時間
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              公開コンテンツ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{publishedCount}</p>
            <p className="text-sm text-gray-500">下書き: {draftCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* プロジェクト別統計 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>プロジェクト別パフォーマンス</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.projectStats.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              まだ視聴データがありません
            </p>
          ) : (
            <div className="space-y-4">
              {analytics.projectStats.slice(0, 5).map((stat) => {
                const project = projects.find((p) => p.id === stat.projectId);
                const completionRate = stat.totalViews > 0
                  ? (Number(stat.completed) / stat.totalViews) * 100
                  : 0;

                return (
                  <div
                    key={stat.projectId}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {project?.title ?? stat.projectId}
                      </h3>
                      <div className="flex gap-4 mt-1 text-sm text-gray-500">
                        <span>視聴: {stat.totalViews}回</span>
                        <span>完了: {Number(stat.completed)}回</span>
                      </div>
                    </div>
                    <div className="w-32">
                      <p className="text-sm text-right mb-1">
                        {completionRate.toFixed(0)}%
                      </p>
                      <Progress value={completionRate} />
                    </div>
                    <Button asChild size="sm" variant="outline" className="ml-4">
                      <Link href={`/editor/${stat.projectId}`}>詳細</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 最近のプロジェクト */}
      <Card>
        <CardHeader>
          <CardTitle>最近のプロジェクト</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              プロジェクトがありません
            </p>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{project.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(project.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        project.isPublished
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {project.isPublished ? '公開中' : '下書き'}
                    </span>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/editor/${project.id}`}>編集</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 完了条件

- [x] 分析APIが作成されている
- [x] AC-ANALYTICS-001: 管理者は全体の完了率を取得できる
- [x] AC-ANALYTICS-002: 動画別の選択傾向データを取得できる
- [x] AC-ANALYTICS-003: 視聴者は分析データにアクセスできない
- [x] ダッシュボードに分析データが表示される

---

## テスト方法

### 1. 権限テスト

```bash
# 視聴者でアクセス → 403
curl http://localhost:3000/api/analytics \
  -H "Cookie: viewer-session-token"

# 管理者でアクセス → 200
curl http://localhost:3000/api/analytics \
  -H "Cookie: admin-session-token"
```

### 2. ダッシュボード確認

```
1. admin@example.com でログイン
2. /dashboard にアクセス
3. 分析サマリーが表示される
4. プロジェクト別パフォーマンスが表示される
```

---

## 参照設計書セクション

- DESIGN-BE-2026-001 セクション5.6: 分析データAPI

---

## 成果物

- `src/lib/services/analytics.service.ts`
- `src/app/api/analytics/route.ts`
- `src/app/api/analytics/[videoId]/route.ts`
- 更新された `src/app/(admin)/dashboard/page.tsx`

---

## 次のタスク

- phase5-006-e2e-test.md: 最終統合テスト
