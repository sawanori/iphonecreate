/**
 * 選択履歴API
 * GET /api/progress/[videoId]/choice - 選択履歴を取得
 * POST /api/progress/[videoId]/choice - 選択を記録
 * 対応設計書: DESIGN-BE-2026-001 セクション5.5
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getProgressByProject } from '@/lib/services/progress.service';
import {
  recordChoice,
  getChoiceHistoryByProgress,
} from '@/lib/services/choice-history.service';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/index';

/**
 * 選択記録バリデーションスキーマ
 */
const recordChoiceSchema = z.object({
  nodeId: z.string().min(1, 'ノードIDは必須です'),
  choiceId: z.string().min(1, '選択肢IDは必須です'),
  responseTime: z.number().min(0, '応答時間は0以上である必要があります'),
  isTimeout: z.boolean().default(false),
});

type RouteContext = {
  params: Promise<{ videoId: string }>;
};

/**
 * GET /api/progress/[videoId]/choice
 * 選択履歴を取得
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    const { videoId } = await context.params;

    // 自分の進捗を取得
    const progress = await getProgressByProject(session.user.id, videoId);

    if (!progress) {
      return successResponse({ history: [] });
    }

    const history = await getChoiceHistoryByProgress(progress.id);

    return successResponse({ history });
  } catch (error) {
    // eslint-disable-next-line no-console -- Error logging for API diagnostics
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
 * AC-PROGRESS-002: 選択履歴が時刻とともに記録される
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    const body = await request.json();
    const result = recordChoiceSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message).join(', ');
      return errorResponse(ErrorCodes.VALIDATION_ERROR, errors, 400);
    }

    const { videoId } = await context.params;

    // 進捗を取得
    const progress = await getProgressByProject(session.user.id, videoId);

    if (!progress) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        '進捗が見つかりません。先に視聴を開始してください。',
        404
      );
    }

    // AC-PROGRESS-002: 選択履歴が時刻とともに記録される
    // responseTime と isTimeout が正しく記録される
    const choice = await recordChoice({
      progressId: progress.id,
      nodeId: result.data.nodeId,
      choiceId: result.data.choiceId,
      responseTime: result.data.responseTime,
      isTimeout: result.data.isTimeout,
    });

    return successResponse({ choice }, undefined, 201);
  } catch (error) {
    // eslint-disable-next-line no-console -- Error logging for API diagnostics
    console.error('Record choice error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      '選択の記録に失敗しました',
      500
    );
  }
}
