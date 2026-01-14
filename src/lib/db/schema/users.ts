/**
 * ユーザースキーマ
 * 対応設計書: DESIGN-BE-2026-001 セクション6.2
 */
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';

/**
 * ユーザーロールEnum
 * - admin: 管理者（動画管理、分析閲覧が可能）
 * - viewer: 視聴者（動画視聴のみ）
 */
export const roleEnum = pgEnum('role', ['admin', 'viewer']);

/**
 * ユーザーテーブル
 */
export const users = pgTable('users', {
  /** ユーザーID (UUID) */
  id: uuid('id').defaultRandom().primaryKey(),
  /** メールアドレス（ユニーク） */
  email: varchar('email', { length: 255 }).notNull().unique(),
  /** パスワードハッシュ（bcrypt） */
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  /** 表示名 */
  name: varchar('name', { length: 255 }).notNull(),
  /** ロール */
  role: roleEnum('role').notNull().default('viewer'),
  /** 作成日時 */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  /** 更新日時 */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  /** 最終ログイン日時 */
  lastLoginAt: timestamp('last_login_at'),
});

/**
 * ユーザー選択型（SELECT用）
 */
export type User = typeof users.$inferSelect;

/**
 * ユーザー挿入型（INSERT用）
 */
export type NewUser = typeof users.$inferInsert;
