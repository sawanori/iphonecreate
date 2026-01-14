/**
 * 進捗一覧API
 * GET /api/progress - 自分の進捗一覧を取得
 * 対応設計書: DESIGN-BE-2026-001 セクション5.5
 */
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserProgressList, getProgressSummary } from '@/lib/services/progress.service';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/index';

/**
 * GET /api/progress
 * 自分の進捗一覧を取得
 * AC-PROGRESS-004: 自分以外の進捗データは取得できない（userIdで自動フィルタ）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    const searchParams = request.nextUrl.searchParams;
    const includeSummary = searchParams.get('summary') === 'true';

    const progressList = await getUserProgressList(session.user.id);

    const response: Record<string, unknown> = { progress: progressList };

    if (includeSummary) {
      const summary = await getProgressSummary(session.user.id);
      response.summary = summary;
    }

    return successResponse(response);
  } catch (error) {
    // eslint-disable-next-line no-console -- Error logging for API diagnostics
    console.error('Get progress list error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      '進捗一覧の取得に失敗しました',
      500
    );
  }
}
