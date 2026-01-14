import { z } from 'zod';

/**
 * 共通バリデーションスキーマ
 */

// ID (UUID)
export const uuidSchema = z.string().uuid('有効なUUID形式で入力してください');

// ID (数値)
export const idSchema = z
  .number()
  .int()
  .positive('IDは正の整数である必要があります');

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

  const errors = result.error.issues.reduce(
    (acc: Record<string, string>, issue) => {
      const path = issue.path.join('.') || '_root';
      acc[path] = issue.message;
      return acc;
    },
    {} as Record<string, string>
  );

  return { success: false, errors };
}
