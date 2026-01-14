/**
 * パスワードユーティリティ
 * bcrypt によるパスワードハッシュ化と検証
 * 対応設計書: DESIGN-BE-2026-001 セクション6.2
 */
import bcrypt from 'bcryptjs';

/** bcrypt のソルトラウンド数 */
const SALT_ROUNDS = 10;

/**
 * パスワードをハッシュ化
 * @param password - 平文パスワード
 * @returns ハッシュ化されたパスワード
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * パスワードを検証
 * @param password - 平文パスワード
 * @param hash - ハッシュ化されたパスワード
 * @returns 一致する場合 true
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
