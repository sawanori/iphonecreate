/**
 * 動画プロジェクト個別API
 * GET /api/videos/[videoId] - プロジェクト詳細取得
 * PATCH /api/videos/[videoId] - プロジェクト更新
 * DELETE /api/videos/[videoId] - プロジェクト削除
 * 対応設計書: DESIGN-BE-2026-001 セクション5.3
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import {
  getProjectWithData,
  updateProject,
  deleteProject,
  updateProjectNodes,
  updateProjectEdges,
  updateProjectChoices,
  updateProjectBranchConfigs,
} from '@/lib/services/video.service';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/index';

/**
 * ノード更新バリデーションスキーマ
 */
const nodeSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['video', 'videoNode', 'choice', 'choiceNode', 'end', 'endNode']),
  title: z.string().max(200),
  positionX: z.number(),
  positionY: z.number(),
  videoUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
});

/**
 * エッジ更新バリデーションスキーマ
 */
const edgeSchema = z.object({
  id: z.string().uuid(),
  sourceNodeId: z.string().uuid(),
  targetNodeId: z.string().uuid(),
});

/**
 * 選択肢更新バリデーションスキーマ
 */
const choiceSchema = z.object({
  id: z.string().uuid(),
  nodeId: z.string().uuid(),
  label: z.string().max(200),
  targetNodeId: z.string().uuid().nullable(),
});

/**
 * 分岐設定更新バリデーションスキーマ
 */
const branchConfigSchema = z.object({
  nodeId: z.string().uuid(),
  timeLimit: z.number().min(5).max(60),
});

/**
 * プロジェクト更新バリデーションスキーマ
 */
const updateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  startNodeId: z.string().uuid().optional().nullable(),
  isPublished: z.boolean().optional(),
  aspectRatio: z.enum(['landscape', 'portrait']).optional(),
  nodes: z.array(nodeSchema).optional(),
  edges: z.array(edgeSchema).optional(),
  choices: z.array(choiceSchema).optional(),
  branchConfigs: z.array(branchConfigSchema).optional(),
});

type RouteContext = {
  params: Promise<{ videoId: string }>;
};

/**
 * GET /api/videos/[videoId]
 * プロジェクト詳細を取得（ノード、選択肢、エッジを含む）
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    const { videoId } = await context.params;
    const data = await getProjectWithData(videoId);

    if (!data) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'プロジェクトが見つかりません', 404);
    }

    return successResponse(data);
  } catch (error) {
    // eslint-disable-next-line no-console -- Error logging for API diagnostics
    console.error('Get project error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'プロジェクト取得に失敗しました',
      500
    );
  }
}

/**
 * PATCH /api/videos/[videoId]
 * プロジェクトを更新
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    if (session.user.role !== 'admin') {
      return errorResponse(ErrorCodes.FORBIDDEN, '管理者のみ更新可能です', 403);
    }

    const body = await request.json();
    const result = updateProjectSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'バリデーションエラー',
        400,
        { errors: result.error.issues }
      );
    }

    const { videoId } = await context.params;

    // undefinedの場合はプロパティを除外して更新
    const updateData: {
      title?: string;
      description?: string;
      thumbnailUrl?: string;
      startNodeId?: string;
      isPublished?: boolean;
      aspectRatio?: 'landscape' | 'portrait';
    } = {};

    if (result.data.title !== undefined) {
      updateData.title = result.data.title;
    }
    if (result.data.description !== undefined) {
      updateData.description = result.data.description;
    }
    if (result.data.thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = result.data.thumbnailUrl;
    }
    if (result.data.startNodeId !== undefined && result.data.startNodeId !== null) {
      updateData.startNodeId = result.data.startNodeId;
    }
    if (result.data.isPublished !== undefined) {
      updateData.isPublished = result.data.isPublished;
    }
    if (result.data.aspectRatio !== undefined) {
      updateData.aspectRatio = result.data.aspectRatio;
    }

    const project = await updateProject(videoId, updateData);

    if (!project) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'プロジェクトが見つかりません', 404);
    }

    // ノードが指定された場合は更新
    if (result.data.nodes !== undefined) {
      const normalizedNodes = result.data.nodes.map((node) => ({
        ...node,
        // React FlowのノードタイプをDBのノードタイプに正規化
        type: node.type.replace('Node', '') as 'video' | 'choice' | 'end',
      }));
      await updateProjectNodes(videoId, normalizedNodes);
    }

    // エッジが指定された場合は更新
    if (result.data.edges !== undefined) {
      await updateProjectEdges(videoId, result.data.edges);
    }

    // ノードIDリストを取得（選択肢・分岐設定の更新に使用）
    const nodeIds = result.data.nodes?.map((n) => n.id) ?? [];

    // 選択肢が指定された場合は更新
    if (result.data.choices !== undefined && nodeIds.length > 0) {
      await updateProjectChoices(videoId, nodeIds, result.data.choices);
    }

    // 分岐設定が指定された場合は更新
    if (result.data.branchConfigs !== undefined && nodeIds.length > 0) {
      await updateProjectBranchConfigs(videoId, nodeIds, result.data.branchConfigs);
    }

    return successResponse({ project });
  } catch (error) {
    // eslint-disable-next-line no-console -- Error logging for API diagnostics
    console.error('Update project error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'プロジェクト更新に失敗しました',
      500
    );
  }
}

/**
 * DELETE /api/videos/[videoId]
 * プロジェクトを削除
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    if (session.user.role !== 'admin') {
      return errorResponse(ErrorCodes.FORBIDDEN, '管理者のみ削除可能です', 403);
    }

    const { videoId } = await context.params;
    await deleteProject(videoId);

    return successResponse({ success: true });
  } catch (error) {
    // eslint-disable-next-line no-console -- Error logging for API diagnostics
    console.error('Delete project error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'プロジェクト削除に失敗しました',
      500
    );
  }
}
