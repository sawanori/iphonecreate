/**
 * 個別進捗API
 * GET /api/progress/[videoId] - 特定プロジェクトの進捗を取得
 * POST /api/progress/[videoId] - 進捗を更新
 * 対応設計書: DESIGN-BE-2026-001 セクション5.5
 */
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
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/index';

/**
 * 進捗更新バリデーションスキーマ
 */
const updateProgressSchema = z.object({
  action: z.enum(['start', 'update', 'complete', 'addTime']),
  currentNodeId: z.string().optional(),
  watchTime: z.number().optional(),
  completionRate: z.number().min(0).max(100).optional(),
});

type RouteContext = {
  params: Promise<{ videoId: string }>;
};

/**
 * GET /api/progress/[videoId]
 * 特定プロジェクトの進捗を取得
 * AC-PROGRESS-004: 自分以外の進捗データは取得できない
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    const { videoId } = await context.params;

    // AC-PROGRESS-004: getProgressByProjectでuserIdを指定しているため
    // 自動的に自分の進捗のみ取得される
    const progress = await getProgressByProject(session.user.id, videoId);

    if (!progress) {
      return successResponse({ progress: null });
    }

    return successResponse({ progress });
  } catch (error) {
    // eslint-disable-next-line no-console -- Error logging for API diagnostics
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
export async function POST(request: NextRequest, context: RouteContext) {
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

    const { videoId } = await context.params;
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
        progress = await startWatching(session.user.id, videoId, currentNodeId);
        break;

      case 'update': {
        const existing = await getProgressByProject(session.user.id, videoId);
        if (!existing) {
          return errorResponse(ErrorCodes.NOT_FOUND, '進捗が見つかりません', 404);
        }
        // undefinedの値を除外してupdateProgressに渡す
        const updateData: {
          currentNodeId?: string;
          completionRate?: number;
        } = {};
        if (currentNodeId !== undefined) {
          updateData.currentNodeId = currentNodeId;
        }
        if (completionRate !== undefined) {
          updateData.completionRate = completionRate;
        }
        progress = await updateProgress(existing.id, updateData);
        break;
      }

      case 'addTime': {
        if (watchTime === undefined) {
          return errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            '視聴時間が必要です',
            400
          );
        }
        const progressForTime = await getProgressByProject(
          session.user.id,
          videoId
        );
        if (!progressForTime) {
          return errorResponse(ErrorCodes.NOT_FOUND, '進捗が見つかりません', 404);
        }
        progress = await addWatchTime(progressForTime.id, watchTime);
        break;
      }

      case 'complete': {
        // AC-PROGRESS-003: 終了ノード到達で完了ステータスになる
        const progressForComplete = await getProgressByProject(
          session.user.id,
          videoId
        );
        if (!progressForComplete) {
          return errorResponse(ErrorCodes.NOT_FOUND, '進捗が見つかりません', 404);
        }
        progress = await completeWatching(progressForComplete.id);
        break;
      }

      default:
        return errorResponse(ErrorCodes.VALIDATION_ERROR, '無効なアクション', 400);
    }

    return successResponse({ progress });
  } catch (error) {
    // eslint-disable-next-line no-console -- Error logging for API diagnostics
    console.error('Update progress error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      '進捗の更新に失敗しました',
      500
    );
  }
}
