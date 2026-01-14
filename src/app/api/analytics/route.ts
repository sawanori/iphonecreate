/**
 * 全体分析API
 * GET /api/analytics - 全体の分析データを取得（管理者のみ）
 * 対応設計書: DESIGN-BE-2026-001 セクション5.6
 */
import { auth } from '@/lib/auth';
import { getOverallAnalytics } from '@/lib/services/analytics.service';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/index';

/**
 * GET /api/analytics
 * 全体の分析データを取得（管理者のみ）
 * AC-ANALYTICS-001: 管理者は全体の完了率を取得できる
 * AC-ANALYTICS-003: 視聴者は分析データにアクセスできない
 */
export async function GET() {
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
    // eslint-disable-next-line no-console -- Error logging for API diagnostics
    console.error('Get analytics error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      '分析データの取得に失敗しました',
      500
    );
  }
}
