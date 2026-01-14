/**
 * 分析サービス
 * 対応設計書: DESIGN-BE-2026-001 セクション5.6
 */
import { eq, count, avg, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  userProgress,
  choiceHistory,
  videoNodes,
  choices,
} from '@/lib/db/schema';

/**
 * 全体分析データの型定義
 */
export type OverallAnalyticsResult = {
  totalViews: number;
  completedViews: number;
  inProgressViews: number;
  overallCompletionRate: number;
  totalWatchTime: number;
  projectStats: Array<{
    projectId: string;
    totalViews: number;
    completed: number;
    avgWatchTime: string | null;
  }>;
};

/**
 * ノード分析データの型定義
 */
export type NodeAnalyticsResult = {
  nodeId: string;
  nodeTitle: string;
  totalSelections: number;
  choiceStats: Array<{
    choiceId: string;
    choiceText: string;
    selectCount: number;
    avgResponseTime: number;
    timeoutCount: number;
    selectRate: number;
  }>;
};

/**
 * プロジェクト分析データの型定義
 */
export type ProjectAnalyticsResult = {
  projectId: string;
  totalViews: number;
  completionRate: number;
  averageWatchTime: number;
  averageCompletionRate: number;
  nodeAnalytics: NodeAnalyticsResult[];
};

/**
 * 選択傾向データの型定義
 */
export type ChoiceTrendResult = {
  choiceId: string;
  nodeId: string;
  selectCount: number;
  avgResponseTime: string | null;
  timeoutRate: number;
};

/**
 * 全体の分析データを取得
 * AC-ANALYTICS-001: 管理者は全体の完了率を取得できる
 */
export async function getOverallAnalytics(): Promise<OverallAnalyticsResult> {
  // 総視聴回数と完了率
  const progressStats = await db
    .select({
      total: count(),
      completed: sql<number>`COUNT(*) FILTER (WHERE status = 'completed')`,
      inProgress: sql<number>`COUNT(*) FILTER (WHERE status = 'in_progress')`,
      totalWatchTime: sql<number>`COALESCE(SUM(total_watch_time), 0)`,
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
 * AC-ANALYTICS-002: 動画別の選択傾向データを取得できる
 */
export async function getProjectAnalytics(
  projectId: string
): Promise<ProjectAnalyticsResult> {
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
            avgResponseTime: Number(selectStats[0].avgResponseTime) || 0,
            timeoutCount: Number(selectStats[0].timeoutCount) || 0,
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
    averageWatchTime: Number(stats.avgWatchTime) || 0,
    averageCompletionRate: Number(stats.avgCompletionRate) || 0,
    nodeAnalytics: nodeAnalytics.filter((n) => n.totalSelections > 0),
  };
}

/**
 * 選択傾向サマリーを取得
 */
export async function getChoiceTrends(
  projectId: string
): Promise<ChoiceTrendResult[]> {
  const result = await db
    .select({
      choiceId: choiceHistory.choiceId,
      nodeId: choiceHistory.nodeId,
      selectCount: count(),
      avgResponseTime: avg(choiceHistory.responseTime),
      timeoutRate: sql<number>`
        (COUNT(*) FILTER (WHERE is_timeout = true)::float / NULLIF(COUNT(*)::float, 0)) * 100
      `,
    })
    .from(choiceHistory)
    .innerJoin(userProgress, eq(choiceHistory.progressId, userProgress.id))
    .where(eq(userProgress.projectId, projectId))
    .groupBy(choiceHistory.choiceId, choiceHistory.nodeId);

  return result;
}
