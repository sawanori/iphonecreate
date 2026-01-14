/**
 * 進捗サービス
 * 対応設計書: DESIGN-BE-2026-001 セクション5.5
 */
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  userProgress,
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
 * AC-PROGRESS-001: 視聴開始時に進捗レコードが作成される
 */
export async function startWatching(
  userId: string,
  projectId: string,
  startNodeId: string
): Promise<SelectUserProgress> {
  const progress = await getOrCreateProgress(userId, projectId);

  if (progress.status === 'not_started') {
    const updated = await updateProgress(progress.id, {
      status: 'in_progress',
      currentNodeId: startNodeId,
    });
    return updated ?? progress;
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
