import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { fileExists, getPublicUrl } from '@/lib/storage';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/index';

// リクエストスキーマ
const completeRequestSchema = z.object({
  fileKey: z.string().min(1, 'ファイルキーは必須です'),
  projectId: z.string().optional(),
});

/**
 * POST /api/upload/complete
 * アップロード完了を通知し、メタデータを返す
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    if (session.user.role !== 'admin') {
      return errorResponse(ErrorCodes.FORBIDDEN, '管理者のみ実行可能です', 403);
    }

    // リクエストボディをパース
    const body = await request.json();
    const result = completeRequestSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message).join(', ');
      return errorResponse(ErrorCodes.VALIDATION_ERROR, errors, 400);
    }

    const { fileKey } = result.data;

    // ファイルの存在確認
    const exists = await fileExists(fileKey);
    if (!exists) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        'アップロードされたファイルが見つかりません',
        404
      );
    }

    // 公開URLを取得
    const videoUrl = getPublicUrl(fileKey);

    // TODO: サムネイル生成（将来の拡張）
    // TODO: 動画メタデータ取得（duration, width, height）

    return successResponse({
      videoUrl,
      thumbnailUrl: null, // サムネイル生成は将来実装
      metadata: {
        duration: 0, // 動画解析は将来実装
        width: 0,
        height: 0,
      },
    });
  } catch {
    // Error details intentionally not logged to avoid exposing sensitive info
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'アップロード完了処理に失敗しました',
      500
    );
  }
}
