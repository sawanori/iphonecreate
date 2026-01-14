/**
 * 分岐・ノードサービス
 * 対応設計書: DESIGN-BE-2026-001 セクション5.3, 5.4
 */
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  videoNodes,
  choices,
  branchConfigs,
  branchEdges,
  type NodeType,
} from '@/lib/db/schema';

/**
 * ノードを作成
 * @param data - 作成データ
 * @returns 作成されたノード
 */
export async function createNode(data: {
  projectId: string;
  type: NodeType;
  title: string;
  positionX: number;
  positionY: number;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  choiceDisplayTime?: number;
  duration?: number;
}) {
  const result = await db.insert(videoNodes).values(data).returning();
  return result[0];
}

/**
 * ノードを取得
 * @param nodeId - ノードID
 * @returns ノードまたはnull
 */
export async function getNode(nodeId: string) {
  const result = await db
    .select()
    .from(videoNodes)
    .where(eq(videoNodes.id, nodeId))
    .limit(1);

  return result[0] ?? null;
}

/**
 * ノードを更新
 * @param nodeId - ノードID
 * @param data - 更新データ
 * @returns 更新されたノードまたはnull
 */
export async function updateNode(
  nodeId: string,
  data: Partial<{
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    choiceDisplayTime: number;
    duration: number;
    positionX: number;
    positionY: number;
  }>
) {
  const result = await db
    .update(videoNodes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(videoNodes.id, nodeId))
    .returning();

  return result[0] ?? null;
}

/**
 * ノードを削除
 * @param nodeId - ノードID
 */
export async function deleteNode(nodeId: string) {
  await db.delete(videoNodes).where(eq(videoNodes.id, nodeId));
}

/**
 * 選択肢を保存（既存を削除して再作成）
 * @param nodeId - ノードID
 * @param choicesData - 選択肢データ配列
 * @returns 作成された選択肢配列
 */
export async function saveChoices(
  nodeId: string,
  choicesData: Array<{
    text: string;
    targetNodeId?: string;
    order: number;
  }>
) {
  // 既存の選択肢を削除
  await db.delete(choices).where(eq(choices.nodeId, nodeId));

  // 新しい選択肢を挿入
  if (choicesData.length > 0) {
    const result = await db
      .insert(choices)
      .values(choicesData.map((c) => ({ ...c, nodeId })))
      .returning();
    return result;
  }

  return [];
}

/**
 * ノードの選択肢を取得
 * @param nodeId - ノードID
 * @returns 選択肢配列
 */
export async function getChoices(nodeId: string) {
  return db.select().from(choices).where(eq(choices.nodeId, nodeId));
}

/**
 * 分岐設定を保存（upsert）
 * @param nodeId - ノードID
 * @param data - 分岐設定データ
 * @returns 保存された分岐設定
 */
export async function saveBranchConfig(
  nodeId: string,
  data: {
    timeLimit: number;
    defaultChoiceId?: string;
  }
) {
  // 既存の設定を確認
  const existing = await db
    .select()
    .from(branchConfigs)
    .where(eq(branchConfigs.nodeId, nodeId))
    .limit(1);

  if (existing.length > 0) {
    // 更新
    const result = await db
      .update(branchConfigs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(branchConfigs.nodeId, nodeId))
      .returning();
    return result[0];
  }

  // 新規作成
  const result = await db
    .insert(branchConfigs)
    .values({ nodeId, ...data })
    .returning();
  return result[0];
}

/**
 * 分岐設定を取得
 * @param nodeId - ノードID
 * @returns 分岐設定またはnull
 */
export async function getBranchConfig(nodeId: string) {
  const result = await db
    .select()
    .from(branchConfigs)
    .where(eq(branchConfigs.nodeId, nodeId))
    .limit(1);

  return result[0] ?? null;
}

/**
 * 分岐設定を削除
 * @param nodeId - ノードID
 */
export async function deleteBranchConfig(nodeId: string) {
  await db.delete(branchConfigs).where(eq(branchConfigs.nodeId, nodeId));
}

/**
 * エッジを保存（既存を削除して再作成）
 * @param projectId - プロジェクトID
 * @param edgesData - エッジデータ配列
 * @returns 作成されたエッジ配列
 */
export async function saveEdges(
  projectId: string,
  edgesData: Array<{
    sourceNodeId: string;
    targetNodeId: string;
    choiceId?: string;
  }>
) {
  // 既存のエッジを削除
  await db.delete(branchEdges).where(eq(branchEdges.projectId, projectId));

  // 新しいエッジを挿入
  if (edgesData.length > 0) {
    const result = await db
      .insert(branchEdges)
      .values(edgesData.map((e) => ({ ...e, projectId })))
      .returning();
    return result;
  }

  return [];
}

/**
 * プロジェクトのエッジを取得
 * @param projectId - プロジェクトID
 * @returns エッジ配列
 */
export async function getEdges(projectId: string) {
  return db
    .select()
    .from(branchEdges)
    .where(eq(branchEdges.projectId, projectId));
}
