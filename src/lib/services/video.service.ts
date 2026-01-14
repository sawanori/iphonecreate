/**
 * 動画プロジェクトサービス
 * 対応設計書: DESIGN-BE-2026-001 セクション5.3, 5.4
 */
import { eq, desc, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  videoProjects,
  videoNodes,
  choices,
  branchConfigs,
  branchEdges,
} from '@/lib/db/schema';

/**
 * プロジェクト一覧を取得
 * @param userId - ユーザーID（指定時はそのユーザーのプロジェクトのみ）
 * @returns プロジェクト一覧
 */
export async function getProjects(userId?: string) {
  if (userId) {
    return db
      .select()
      .from(videoProjects)
      .where(eq(videoProjects.createdBy, userId))
      .orderBy(desc(videoProjects.createdAt));
  }

  return db.select().from(videoProjects).orderBy(desc(videoProjects.createdAt));
}

/**
 * プロジェクトを取得
 * @param projectId - プロジェクトID
 * @returns プロジェクトまたはnull
 */
export async function getProject(projectId: string) {
  const result = await db
    .select()
    .from(videoProjects)
    .where(eq(videoProjects.id, projectId))
    .limit(1);

  return result[0] ?? null;
}

/**
 * プロジェクトを作成
 * @param data - 作成データ
 * @returns 作成されたプロジェクト
 */
export async function createProject(data: {
  title: string;
  description?: string | undefined;
  createdBy: string;
}) {
  const insertData: {
    title: string;
    createdBy: string;
    description?: string;
  } = {
    title: data.title,
    createdBy: data.createdBy,
  };

  if (data.description !== undefined) {
    insertData.description = data.description;
  }

  const result = await db.insert(videoProjects).values(insertData).returning();

  return result[0];
}

/**
 * プロジェクトを更新
 * @param projectId - プロジェクトID
 * @param data - 更新データ
 * @returns 更新されたプロジェクトまたはnull
 */
export async function updateProject(
  projectId: string,
  data: Partial<{
    title: string;
    description: string;
    thumbnailUrl: string;
    startNodeId: string;
    isPublished: boolean;
    aspectRatio: 'landscape' | 'portrait';
  }>
) {
  const result = await db
    .update(videoProjects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(videoProjects.id, projectId))
    .returning();

  return result[0] ?? null;
}

/**
 * プロジェクトを削除
 * @param projectId - プロジェクトID
 */
export async function deleteProject(projectId: string) {
  await db.delete(videoProjects).where(eq(videoProjects.id, projectId));
}

/**
 * ノードデータ型（更新用）
 */
export interface NodeUpdateData {
  id: string;
  type: string;
  title: string;
  positionX: number;
  positionY: number;
  videoUrl: string | null;
  thumbnailUrl: string | null;
}

/**
 * エッジデータ型（更新用）
 */
export interface EdgeUpdateData {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
}

/**
 * プロジェクトのノードを更新（既存を削除して新規作成）
 * @param projectId - プロジェクトID
 * @param nodes - ノードデータ配列
 */
export async function updateProjectNodes(
  projectId: string,
  nodes: NodeUpdateData[]
) {
  // 既存のノードを削除（カスケードで選択肢、分岐設定も削除される）
  await db.delete(videoNodes).where(eq(videoNodes.projectId, projectId));

  // 新しいノードを挿入
  if (nodes.length > 0) {
    const nodeValues = nodes.map((node) => ({
      id: node.id,
      projectId,
      type: node.type as 'video' | 'choice' | 'end',
      title: node.title,
      positionX: node.positionX,
      positionY: node.positionY,
      videoUrl: node.videoUrl,
      thumbnailUrl: node.thumbnailUrl,
    }));

    await db.insert(videoNodes).values(nodeValues);
  }
}

/**
 * プロジェクトのエッジを更新（既存を削除して新規作成）
 * @param projectId - プロジェクトID
 * @param edges - エッジデータ配列
 */
export async function updateProjectEdges(
  projectId: string,
  edges: EdgeUpdateData[]
) {
  // 既存のエッジを削除
  await db.delete(branchEdges).where(eq(branchEdges.projectId, projectId));

  // 新しいエッジを挿入
  if (edges.length > 0) {
    const edgeValues = edges.map((edge) => ({
      id: edge.id,
      projectId,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
    }));

    await db.insert(branchEdges).values(edgeValues);
  }
}

/**
 * 選択肢データ型（更新用）
 */
export interface ChoiceUpdateData {
  id: string;
  nodeId: string;
  label: string;
  targetNodeId: string | null;
}

/**
 * 分岐設定データ型（更新用）
 */
export interface BranchConfigUpdateData {
  nodeId: string;
  timeLimit: number;
}

/**
 * プロジェクトの選択肢を更新（既存を削除して新規作成）
 * @param projectId - プロジェクトID
 * @param nodeIds - ノードID配列
 * @param choicesData - 選択肢データ配列
 */
export async function updateProjectChoices(
  _projectId: string,
  nodeIds: string[],
  choicesData: ChoiceUpdateData[]
) {
  // プロジェクトに属するノードの選択肢を削除
  if (nodeIds.length > 0) {
    await db.delete(choices).where(inArray(choices.nodeId, nodeIds));
  }

  // 新しい選択肢を挿入
  if (choicesData.length > 0) {
    const choiceValues = choicesData.map((choice, index) => ({
      id: choice.id,
      nodeId: choice.nodeId,
      text: choice.label,
      targetNodeId: choice.targetNodeId,
      order: index,
    }));

    await db.insert(choices).values(choiceValues);
  }
}

/**
 * プロジェクトの分岐設定を更新（既存を削除して新規作成）
 * @param projectId - プロジェクトID
 * @param nodeIds - ノードID配列
 * @param configsData - 分岐設定データ配列
 */
export async function updateProjectBranchConfigs(
  _projectId: string,
  nodeIds: string[],
  configsData: BranchConfigUpdateData[]
) {
  // プロジェクトに属するノードの分岐設定を削除
  if (nodeIds.length > 0) {
    await db.delete(branchConfigs).where(inArray(branchConfigs.nodeId, nodeIds));
  }

  // 新しい分岐設定を挿入
  if (configsData.length > 0) {
    const configValues = configsData.map((config) => ({
      nodeId: config.nodeId,
      timeLimit: config.timeLimit,
    }));

    await db.insert(branchConfigs).values(configValues);
  }
}

/**
 * プロジェクトの全データを取得（ノード、選択肢、設定、エッジを含む）
 * @param projectId - プロジェクトID
 * @returns プロジェクト全データまたはnull
 */
export async function getProjectWithData(projectId: string) {
  const project = await getProject(projectId);
  if (!project) return null;

  // プロジェクトに属するノードを取得
  const nodes = await db
    .select()
    .from(videoNodes)
    .where(eq(videoNodes.projectId, projectId));

  const nodeIds = nodes.map((n) => n.id);

  // 選択肢を取得（ノードがある場合のみ）
  const rawChoices =
    nodeIds.length > 0
      ? await db.select().from(choices).where(inArray(choices.nodeId, nodeIds))
      : [];

  // DBの`text`をAPI用の`label`にマッピング
  const allChoices = rawChoices.map((c) => ({
    id: c.id,
    nodeId: c.nodeId,
    label: c.text,
    targetNodeId: c.targetNodeId,
  }));

  // 分岐設定を取得（ノードがある場合のみ）
  const configs =
    nodeIds.length > 0
      ? await db
          .select()
          .from(branchConfigs)
          .where(inArray(branchConfigs.nodeId, nodeIds))
      : [];

  // エッジを取得
  const edges = await db
    .select()
    .from(branchEdges)
    .where(eq(branchEdges.projectId, projectId));

  return {
    project,
    nodes,
    choices: allChoices,
    branchConfigs: configs,
    edges,
  };
}
