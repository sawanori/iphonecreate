import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { generateUploadUrl, generateVideoKey } from '@/lib/storage';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/index';

// リクエストスキーマ
const uploadRequestSchema = z.object({
  filename: z.string().min(1, 'ファイル名は必須です'),
  contentType: z.string().refine(
    (type) => type === 'video/mp4' || type === 'video/quicktime',
    { message: 'MP4またはMOV形式のみアップロード可能です' }
  ),
  size: z.number()
    .positive('ファイルサイズは正の数である必要があります')
    .max(500 * 1024 * 1024, 'ファイルサイズは500MB以下である必要があります'),
  projectId: z.string().optional(),
});

/**
 * POST /api/upload
 * アップロード用署名付きURLを発行
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
    const result = uploadRequestSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message).join(', ');
      return errorResponse(ErrorCodes.VALIDATION_ERROR, errors, 400);
    }

    const { filename, contentType, projectId } = result.data;

    // ファイルキーを生成
    const key = generateVideoKey(
      projectId ?? `temp-${session.user.id}`,
      filename
    );

    // 署名付きURLを生成
    const { uploadUrl, expiresAt } = await generateUploadUrl({
      key,
      contentType,
      expiresIn: 3600, // 1時間
    });

    return successResponse({
      uploadUrl,
      fileKey: key,
      expiresAt,
    });
  } catch {
    // Error details intentionally not logged to avoid exposing sensitive info
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'アップロードURLの生成に失敗しました',
      500
    );
  }
}
