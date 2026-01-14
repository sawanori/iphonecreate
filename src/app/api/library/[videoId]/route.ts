/**
 * 動画ライブラリ個別API
 * DELETE /api/library/[videoId] - 動画削除
 * PATCH /api/library/[videoId] - 動画更新
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { removeFromLibrary, updateLibraryItem } from '@/lib/services/library.service';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/index';

type RouteContext = {
  params: Promise<{ videoId: string }>;
};

/**
 * 更新バリデーションスキーマ
 */
const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  thumbnailUrl: z.string().url().optional(),
});

/**
 * DELETE /api/library/[videoId]
 * 動画をライブラリから削除
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    const { videoId } = await context.params;

    await removeFromLibrary(videoId, session.user.id);

    return successResponse({ success: true });
  } catch (error) {
    console.error('Delete from library error:', error);
    if (error instanceof Error && error.message === 'Permission denied') {
      return errorResponse(ErrorCodes.FORBIDDEN, '権限がありません', 403);
    }
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      '削除に失敗しました',
      500
    );
  }
}

/**
 * PATCH /api/library/[videoId]
 * 動画情報を更新
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    const { videoId } = await context.params;
    const body = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'バリデーションエラー',
        400,
        { errors: result.error.issues }
      );
    }

    const video = await updateLibraryItem(videoId, session.user.id, result.data);

    if (!video) {
      return errorResponse(ErrorCodes.NOT_FOUND, '動画が見つかりません', 404);
    }

    return successResponse({ video });
  } catch (error) {
    console.error('Update library item error:', error);
    if (error instanceof Error && error.message === 'Permission denied') {
      return errorResponse(ErrorCodes.FORBIDDEN, '権限がありません', 403);
    }
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      '更新に失敗しました',
      500
    );
  }
}
