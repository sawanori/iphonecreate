import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { generateUploadUrl, getPublicUrl } from '@/lib/storage';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/index';

// リクエストスキーマ
const thumbnailUploadRequestSchema = z.object({
  projectId: z.string().min(1, 'プロジェクトIDは必須です'),
  contentType: z.string().refine(
    (type) => type === 'image/jpeg' || type === 'image/png',
    { message: 'JPEG/PNG形式のみアップロード可能です' }
  ),
});

/**
 * サムネイルキーを生成
 */
function generateThumbnailKey(projectId: string): string {
  const timestamp = Date.now();
  return `thumbnails/${projectId}/${timestamp}-thumbnail.jpg`;
}

/**
 * POST /api/upload/thumbnail
 * サムネイルアップロード用署名付きURLを発行
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    // 管理者のみアップロード可能
    if (session.user.role !== 'admin') {
      return errorResponse(ErrorCodes.FORBIDDEN, '管理者のみアップロード可能です', 403);
    }

    // リクエストボディをパース
    const body = await request.json();
    const result = thumbnailUploadRequestSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message).join(', ');
      return errorResponse(ErrorCodes.VALIDATION_ERROR, errors, 400);
    }

    const { projectId, contentType } = result.data;

    // サムネイルキーを生成
    const key = generateThumbnailKey(projectId);

    // 署名付きURLを生成
    const { uploadUrl, expiresAt } = await generateUploadUrl({
      key,
      contentType,
      expiresIn: 3600, // 1時間
    });

    // サムネイルの公開URLを生成
    const thumbnailUrl = getPublicUrl(key);

    return successResponse({
      uploadUrl,
      thumbnailUrl,
      fileKey: key,
      expiresAt,
    });
  } catch {
    // Error details intentionally not logged to avoid exposing sensitive info
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'サムネイルアップロードURLの生成に失敗しました',
      500
    );
  }
}
