# タスク: 共通ユーティリティ実装

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase1-004 |
| フェーズ | Phase 1: プロジェクト基盤 |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

APIレスポンスヘルパー、エラーハンドリング、バリデーションスキーマなど、プロジェクト全体で使用する共通ユーティリティを実装する。

---

## 前提条件

### 依存タスク
- phase1-002-tailwind-setup.md（`cn` ユーティリティが存在すること）
- phase1-003-drizzle-setup.md（データベース接続設定が完了していること）

### 前提成果物
- `src/lib/utils.ts` が存在すること（shadcn/ui により生成）

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/lib/utils/api-response.ts` | 新規作成 |
| `src/lib/utils/error-handler.ts` | 新規作成 |
| `src/lib/utils/validation.ts` | 新規作成 |
| `src/lib/utils/index.ts` | 新規作成 |

---

## 実装詳細

### ステップ 1: Zod インストール

```bash
npm install zod
```

### ステップ 2: APIレスポンスヘルパー作成

`src/lib/utils/api-response.ts`:

```typescript
import { NextResponse } from 'next/server';

/**
 * API成功レスポンスの型
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

/**
 * APIエラーレスポンスの型
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * APIレスポンス型（成功またはエラー）
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * 成功レスポンスを生成
 */
export function successResponse<T>(
  data: T,
  meta?: ApiSuccessResponse<T>['meta'],
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return NextResponse.json(response, { status });
}

/**
 * エラーレスポンスを生成
 */
export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * 共通エラーコード
 */
export const ErrorCodes = {
  // 認証関連
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // バリデーション関連
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // リソース関連
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // サーバー関連
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // ファイル関連
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
```

### ステップ 3: エラーハンドラー作成

`src/lib/utils/error-handler.ts`:

```typescript
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { errorResponse, ErrorCodes, type ApiErrorResponse } from './api-response';

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
    return errorResponse(error.code, error.message, error.statusCode, error.details);
  }

  // Zod バリデーションエラーの場合
  if (error instanceof ZodError) {
    const details = error.errors.reduce(
      (acc, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
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
```

### ステップ 4: バリデーションスキーマ作成

`src/lib/utils/validation.ts`:

```typescript
import { z } from 'zod';

/**
 * 共通バリデーションスキーマ
 */

// ID (UUID)
export const uuidSchema = z.string().uuid('有効なUUID形式で入力してください');

// ID (数値)
export const idSchema = z.number().int().positive('IDは正の整数である必要があります');

// メールアドレス
export const emailSchema = z
  .string()
  .email('有効なメールアドレスを入力してください')
  .max(255, 'メールアドレスは255文字以内で入力してください');

// パスワード
export const passwordSchema = z
  .string()
  .min(8, 'パスワードは8文字以上で入力してください')
  .max(100, 'パスワードは100文字以内で入力してください')
  .regex(
    /^(?=.*[a-zA-Z])(?=.*[0-9])/,
    'パスワードは英字と数字を含む必要があります'
  );

// ページネーション
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// 動画ID
export const videoIdSchema = z
  .string()
  .min(1, '動画IDは必須です')
  .max(50, '動画IDは50文字以内で入力してください');

// 選択肢テキスト
export const choiceTextSchema = z
  .string()
  .min(1, '選択肢テキストは必須です')
  .max(100, '選択肢テキストは100文字以内で入力してください');

// 制限時間（秒）
export const timeLimitSchema = z
  .number()
  .int()
  .min(5, '制限時間は5秒以上に設定してください')
  .max(300, '制限時間は300秒以内に設定してください');

/**
 * バリデーション結果の型
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

/**
 * スキーマでバリデーションを実行
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.reduce(
    (acc, err) => {
      const path = err.path.join('.') || '_root';
      acc[path] = err.message;
      return acc;
    },
    {} as Record<string, string>
  );

  return { success: false, errors };
}
```

### ステップ 5: インデックスファイル作成

`src/lib/utils/index.ts`:

```typescript
// 既存のcn関数を再エクスポート
export { cn } from '../utils';

// APIレスポンス
export {
  successResponse,
  errorResponse,
  ErrorCodes,
  type ApiResponse,
  type ApiSuccessResponse,
  type ApiErrorResponse,
  type ErrorCode,
} from './api-response';

// エラーハンドリング
export {
  AppError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  handleApiError,
  withErrorHandler,
} from './error-handler';

// バリデーション
export {
  uuidSchema,
  idSchema,
  emailSchema,
  passwordSchema,
  paginationSchema,
  videoIdSchema,
  choiceTextSchema,
  timeLimitSchema,
  validate,
  type ValidationResult,
} from './validation';
```

---

## 完了条件

- [x] `api-response.ts` が作成され、成功/エラーレスポンス関数が利用可能
- [x] `error-handler.ts` が作成され、各種エラークラスが定義されている
- [x] `validation.ts` が作成され、共通バリデーションスキーマが定義されている
- [x] TypeScript コンパイルエラーがない
- [ ] 単体テストが合格する（テストファイル作成時）

---

## テスト方法

### 1. TypeScript コンパイル確認

```bash
npm run type-check
# エラーが0件であることを確認
```

### 2. インポートテスト

`src/app/page.tsx` で一時的にテスト:

```typescript
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  AppError,
  validate,
  emailSchema,
} from '@/lib/utils';

// コンパイルエラーがないことを確認
console.log(ErrorCodes);
```

### 3. APIルートでのテスト

`src/app/api/test/route.ts` を作成してテスト:

```typescript
import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  handleApiError,
  validate,
  emailSchema,
} from '@/lib/utils';

export async function GET() {
  return successResponse({ message: 'テスト成功' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = validate(emailSchema, body.email);

    if (!result.success) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'バリデーションエラー',
        400,
        result.errors
      );
    }

    return successResponse({ email: result.data });
  } catch (error) {
    return handleApiError(error);
  }
}
```

```bash
# テスト実行
curl http://localhost:3000/api/test
# {"success":true,"data":{"message":"テスト成功"}}

curl -X POST http://localhost:3000/api/test -H "Content-Type: application/json" -d '{"email":"invalid"}'
# {"success":false,"error":{"code":"VALIDATION_ERROR",...}}

curl -X POST http://localhost:3000/api/test -H "Content-Type: application/json" -d '{"email":"test@example.com"}'
# {"success":true,"data":{"email":"test@example.com"}}
```

---

## 参照設計書セクション

- DESIGN-BE-2026-001 セクション9: エラーハンドリング
- DESIGN-BE-2026-001 セクション10.1: バリデーション

---

## 成果物

- APIレスポンスヘルパー（`api-response.ts`）
- エラーハンドリングユーティリティ（`error-handler.ts`）
- 共通バリデーションスキーマ（`validation.ts`）
- エクスポート用インデックスファイル（`index.ts`）

---

## 次のタスク

- phase1-005-types.md: 型定義ファイル作成
