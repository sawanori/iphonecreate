/**
 * 選択履歴サービス
 * 対応設計書: DESIGN-BE-2026-001 セクション5.5
 */
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  choiceHistory,
  type InsertChoiceHistory,
  type SelectChoiceHistory,
} from '@/lib/db/schema';

/**
 * 選択履歴を記録
 * AC-PROGRESS-002: 選択履歴が時刻とともに記録される
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
