/**
 * 動画プロジェクトAPI
 * GET /api/videos - プロジェクト一覧取得
 * POST /api/videos - プロジェクト作成
 * 対応設計書: DESIGN-BE-2026-001 セクション5.3
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getProjects, createProject } from '@/lib/services/video.service';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/index';

/**
 * プロジェクト作成バリデーションスキーマ
 */
const createProjectSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200, 'タイトルは200文字以内です'),
  description: z.string().optional(),
});

/**
 * GET /api/videos
 * プロジェクト一覧を取得
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    const projects = await getProjects();
    return successResponse({ projects });
  } catch (error) {
    // eslint-disable-next-line no-console -- Error logging for API diagnostics
    console.error('Get projects error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'プロジェクト取得に失敗しました',
      500
    );
  }
}

/**
 * POST /api/videos
 * プロジェクトを作成
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    if (session.user.role !== 'admin') {
      return errorResponse(ErrorCodes.FORBIDDEN, '管理者のみ作成可能です', 403);
    }

    const body = await request.json();
    const result = createProjectSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'バリデーションエラー',
        400,
        { errors: result.error.issues }
      );
    }

    const { title, description } = result.data;
    const project = await createProject({
      title,
      description,
      createdBy: session.user.id,
    });

    return successResponse({ project }, undefined, 201);
  } catch (error) {
    // eslint-disable-next-line no-console -- Error logging for API diagnostics
    console.error('Create project error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'プロジェクト作成に失敗しました',
      500
    );
  }
}
