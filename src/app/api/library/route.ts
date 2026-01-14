/**
 * 動画ライブラリAPI
 * GET /api/library - ライブラリ一覧取得
 * POST /api/library - ライブラリに追加
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getVideoLibrary, addToLibrary } from '@/lib/services/library.service';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/index';

/**
 * 動画追加バリデーションスキーマ
 */
const addVideoSchema = z.object({
  title: z.string().min(1).max(200),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  fileSize: z.number().optional(),
  duration: z.number().optional(),
});

/**
 * GET /api/library
 * ユーザーの動画ライブラリを取得
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    const videos = await getVideoLibrary(session.user.id);

    return successResponse({ videos });
  } catch (error) {
    console.error('Get library error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'ライブラリ取得に失敗しました',
      500
    );
  }
}

/**
 * POST /api/library
 * 動画をライブラリに追加
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    const body = await request.json();
    const result = addVideoSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'バリデーションエラー',
        400,
        { errors: result.error.issues }
      );
    }

    const video = await addToLibrary({
      ...result.data,
      ownerId: session.user.id,
    });

    return successResponse({ video }, undefined, 201);
  } catch (error) {
    console.error('Add to library error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'ライブラリ追加に失敗しました',
      500
    );
  }
}
