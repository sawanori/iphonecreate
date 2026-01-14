/**
 * ユーザーリポジトリ
 * ユーザーテーブルへのデータアクセス操作
 * 対応設計書: DESIGN-BE-2026-001 セクション6.2
 */
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, type User, type NewUser } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/password';

/**
 * メールアドレスでユーザーを検索
 * @param email - メールアドレス
 * @returns ユーザーまたは null
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0] ?? null;
}

/**
 * IDでユーザーを検索
 * @param id - ユーザーID
 * @returns ユーザーまたは null
 */
export async function findUserById(id: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result[0] ?? null;
}

/**
 * ユーザーを作成
 * @param data - ユーザー作成データ（passwordは平文）
 * @returns 作成されたユーザー
 */
export async function createUser(
  data: Omit<NewUser, 'passwordHash'> & { password: string }
): Promise<User> {
  const passwordHash = await hashPassword(data.password);

  const result = await db
    .insert(users)
    .values({
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role,
    })
    .returning();

  return result[0];
}

/**
 * ユーザーを更新
 * @param id - ユーザーID
 * @param data - 更新データ
 * @returns 更新されたユーザーまたは null
 */
export async function updateUser(
  id: string,
  data: Partial<Omit<NewUser, 'id' | 'passwordHash'>>
): Promise<User | null> {
  const result = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return result[0] ?? null;
}

/**
 * 最終ログイン日時を更新
 * @param id - ユーザーID
 * @returns 更新されたユーザーまたは null
 */
export async function updateLastLoginAt(id: string): Promise<User | null> {
  const result = await db
    .update(users)
    .set({
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return result[0] ?? null;
}
