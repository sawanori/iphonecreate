# タスク: ユーザースキーマ定義

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase3-002 |
| フェーズ | Phase 3: 認証機能 |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

Drizzle ORM でユーザーテーブルのスキーマを定義し、マイグレーションを実行する。roleEnum（admin, viewer）を定義し、bcrypt によるパスワードハッシュ化を実装する。

---

## 前提条件

### 依存タスク
- phase3-001-authjs-setup.md（Auth.js 設定が完了していること）

### 前提成果物
- `src/lib/db/index.ts`（DB接続設定）
- `src/lib/auth/config.ts`（Auth.js 設定）

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/lib/db/schema/users.ts` | 新規作成 |
| `src/lib/db/schema/index.ts` | 更新 |
| `src/lib/auth/config.ts` | 更新 |
| `drizzle/` | マイグレーションファイル生成 |

---

## 実装詳細

### ステップ 1: ユーザースキーマ作成

`src/lib/db/schema/users.ts`:

```typescript
import {
  pgTable,
  varchar,
  text,
  timestamp,
  pgEnum,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * ユーザーロールEnum
 */
export const roleEnum = pgEnum('user_role', ['admin', 'viewer']);

/**
 * ユーザーテーブル
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull().default('viewer'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * ユーザー挿入スキーマ
 */
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email('有効なメールアドレスを入力してください'),
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください'),
  passwordHash: z.string().min(1),
});

/**
 * ユーザー選択スキーマ
 */
export const selectUserSchema = createSelectSchema(users);

/**
 * ユーザー型
 */
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
```

### ステップ 2: スキーマインデックス更新

`src/lib/db/schema/index.ts`:

```typescript
// ユーザー関連
export * from './users';

// 今後追加されるスキーマ
// export * from './videos';
// export * from './progress';
```

### ステップ 3: パスワードユーティリティ作成

`src/lib/auth/password.ts`:

```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * パスワードをハッシュ化
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * パスワードを検証
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### ステップ 4: ユーザーリポジトリ作成

`src/lib/db/repositories/user.repository.ts`:

```typescript
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, type InsertUser, type SelectUser } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/password';

/**
 * メールアドレスでユーザーを検索
 */
export async function findUserByEmail(
  email: string
): Promise<SelectUser | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0] ?? null;
}

/**
 * IDでユーザーを検索
 */
export async function findUserById(id: string): Promise<SelectUser | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result[0] ?? null;
}

/**
 * ユーザーを作成
 */
export async function createUser(
  data: Omit<InsertUser, 'passwordHash'> & { password: string }
): Promise<SelectUser> {
  const passwordHash = await hashPassword(data.password);

  const result = await db
    .insert(users)
    .values({
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role,
      avatarUrl: data.avatarUrl,
    })
    .returning();

  return result[0];
}

/**
 * ユーザーを更新
 */
export async function updateUser(
  id: string,
  data: Partial<Omit<InsertUser, 'id' | 'passwordHash'>>
): Promise<SelectUser | null> {
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
```

### ステップ 5: Auth.js 設定更新（DB連携）

`src/lib/auth/config.ts` を更新:

```typescript
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { findUserByEmail } from '@/lib/db/repositories/user.repository';
import { verifyPassword } from './password';
import type { UserRole } from '@/types';

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        const result = loginSchema.safeParse(credentials);
        if (!result.success) {
          return null;
        }

        const { email, password } = result.data;

        // DBからユーザーを検索
        const user = await findUserByEmail(email);
        if (!user) {
          return null;
        }

        // パスワード検証
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8時間
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  trustHost: true,
};
```

### ステップ 6: シードスクリプト作成

`src/lib/db/seed.ts`:

```typescript
import { db } from './index';
import { users } from './schema';
import { hashPassword } from '@/lib/auth/password';

async function seed() {
  console.log('Seeding database...');

  // 管理者ユーザー
  const adminPassword = await hashPassword('password123');
  await db.insert(users).values({
    email: 'admin@example.com',
    name: '管理者',
    passwordHash: adminPassword,
    role: 'admin',
  }).onConflictDoNothing();

  // 視聴者ユーザー
  const viewerPassword = await hashPassword('password123');
  await db.insert(users).values({
    email: 'viewer@example.com',
    name: '視聴者',
    passwordHash: viewerPassword,
    role: 'viewer',
  }).onConflictDoNothing();

  console.log('Seeding completed!');
}

seed().catch(console.error);
```

### ステップ 7: マイグレーション実行

```bash
# マイグレーションファイル生成
npm run db:generate

# データベースに適用
npm run db:push

# シード実行（package.json にスクリプト追加後）
npm run db:seed
```

`package.json` にスクリプト追加:

```json
{
  "scripts": {
    "db:seed": "npx tsx src/lib/db/seed.ts"
  }
}
```

---

## 完了条件

- [x] users テーブルが作成されている
- [x] roleEnum（admin, viewer）が定義されている
- [x] bcrypt パスワードハッシュ化が動作する
- [x] テストユーザーが作成されている
- [x] Auth.js が DB 連携で動作する

---

## テスト方法

### 1. マイグレーション確認

```bash
npm run db:studio
# Drizzle Studio で users テーブルを確認
```

### 2. シード実行確認

```bash
npm run db:seed
# テストユーザーが作成されることを確認
```

### 3. 認証フローテスト

```bash
npm run dev
# http://localhost:3000/test/auth でログインテスト

# テストユーザー:
# - admin@example.com / password123 (管理者)
# - viewer@example.com / password123 (視聴者)
```

### 4. パスワードハッシュ確認

```bash
# Drizzle Studio で password_hash カラムを確認
# $2a$ で始まる bcrypt ハッシュが保存されていることを確認
```

---

## 参照設計書セクション

- DESIGN-BE-2026-001 セクション6.2: データモデル（users）
- DESIGN-BE-2026-001 セクション7.2: 認証方式

---

## 成果物

- `src/lib/db/schema/users.ts`: ユーザースキーマ
- `src/lib/auth/password.ts`: パスワードユーティリティ
- `src/lib/db/repositories/user.repository.ts`: ユーザーリポジトリ
- `src/lib/db/seed.ts`: シードスクリプト

---

## 注意事項

- パスワードは必ずハッシュ化して保存
- テストユーザーのパスワードは本番では変更必須
- roleEnum の値を変更する場合はマイグレーションが必要

---

## 次のタスク

- phase3-003-login-page.md: ログイン画面実装
