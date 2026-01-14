import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  errorResponse,
  ErrorCodes,
  type ApiErrorResponse,
} from './api-response';

/**
 * アプリケーションエラークラス
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * 認証エラー
 */
export class AuthError extends AppError {
  constructor(message = '認証が必要です') {
    super(ErrorCodes.UNAUTHORIZED, message, 401);
    this.name = 'AuthError';
  }
}

/**
 * 権限エラー
 */
export class ForbiddenError extends AppError {
  constructor(message = 'アクセス権限がありません') {
    super(ErrorCodes.FORBIDDEN, message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * リソース未検出エラー
 */
export class NotFoundError extends AppError {
  constructor(resource = 'リソース') {
    super(ErrorCodes.NOT_FOUND, `${resource}が見つかりません`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCodes.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * エラーをAPIレスポンスに変換
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // AppError の場合
  if (error instanceof AppError) {
    return errorResponse(
      error.code,
      error.message,
      error.statusCode,
      error.details
    );
  }

  // Zod バリデーションエラーの場合
  if (error instanceof ZodError) {
    const details = error.issues.reduce(
      (acc: Record<string, string>, issue) => {
        const path = issue.path.join('.');
        acc[path] = issue.message;
        return acc;
      },
      {} as Record<string, string>
    );

    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      'バリデーションエラー',
      400,
      details
    );
  }

  // 一般的なエラーの場合
  if (error instanceof Error) {
    // eslint-disable-next-line no-console -- Error logging for unhandled errors
    console.error('Unhandled error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      process.env.NODE_ENV === 'development'
        ? error.message
        : 'サーバーエラーが発生しました',
      500
    );
  }

  // 不明なエラー
  // eslint-disable-next-line no-console -- Error logging for unknown errors
  console.error('Unknown error:', error);
  return errorResponse(
    ErrorCodes.INTERNAL_ERROR,
    'サーバーエラーが発生しました',
    500
  );
}

/**
 * 非同期API処理のラッパー
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiErrorResponse>> {
  return handler().catch((error) => handleApiError(error));
}
