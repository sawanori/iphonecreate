# タスク: Auth.js v5 設定

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase3-001 |
| フェーズ | Phase 3: 認証機能 |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

Auth.js（NextAuth）v5 をインストールし、Credentials Provider を使用した認証設定を行う。JWT セッション（8時間有効）の設定を実装する。

---

## 前提条件

### 依存タスク
- phase2-completion.md（Phase 2 が完了していること）

### 前提成果物
- Phase 1 で作成したデータベース接続設定
- 型定義ファイル（`src/types/user.ts`）

### 環境変数
```
AUTH_SECRET=your-auth-secret-key
AUTH_URL=http://localhost:3000
```

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/lib/auth/config.ts` | 新規作成 |
| `src/lib/auth/index.ts` | 新規作成 |
| `src/app/api/auth/[...nextauth]/route.ts` | 新規作成 |
| `.env.local` | 更新 |

---

## 実装詳細

### ステップ 1: パッケージインストール

```bash
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

### ステップ 2: 環境変数追加

`.env.local` に追加:

```
# Auth
AUTH_SECRET=your-very-long-random-string-here
AUTH_URL=http://localhost:3000
```

### ステップ 3: Auth.js 設定ファイル作成

`src/lib/auth/config.ts`:

```typescript
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { User, UserRole } from '@/types';

/**
 * ログインスキーマ
 */
const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

/**
 * ユーザー検証関数（仮実装：Phase 3-2 で DB 連携に変更）
 */
async function verifyUser(
  email: string,
  password: string
): Promise<User | null> {
  // TODO: Phase 3-2 で実際の DB クエリに置き換え
  // テスト用のハードコードされたユーザー
  const testUsers = [
    {
      id: 'admin-001',
      email: 'admin@example.com',
      name: '管理者',
      role: 'admin' as UserRole,
      // password: 'password123' のハッシュ
      passwordHash: '$2a$10$rQZqJ5Y.oVkXy5h5j5c5z.7F8F8h7v7v7v7v7v7v7v7v7v7v7v',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'viewer-001',
      email: 'viewer@example.com',
      name: '視聴者',
      role: 'viewer' as UserRole,
      // password: 'password123' のハッシュ
      passwordHash: '$2a$10$rQZqJ5Y.oVkXy5h5j5c5z.7F8F8h7v7v7v7v7v7v7v7v7v7v7v',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const user = testUsers.find((u) => u.email === email);
  if (!user) return null;

  // 開発時は簡易チェック（本番では bcrypt.compare を使用）
  const isValid = password === 'password123'; // 仮実装
  // const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Auth.js 設定
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        // バリデーション
        const result = loginSchema.safeParse(credentials);
        if (!result.success) {
          return null;
        }

        const { email, password } = result.data;

        // ユーザー検証
        const user = await verifyUser(email, password);
        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
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

### ステップ 4: Auth.js エントリーポイント作成

`src/lib/auth/index.ts`:

```typescript
import NextAuth from 'next-auth';
import { authConfig } from './config';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);

/**
 * 現在のセッションを取得（サーバーコンポーネント用）
 */
export { auth as getSession };

/**
 * サインインアクション
 */
export { signIn };

/**
 * サインアウトアクション
 */
export { signOut };
```

### ステップ 5: API ルート作成

`src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { GET, POST } from '@/lib/auth';

export { GET, POST };
```

### ステップ 6: 型拡張ファイル作成

`src/types/next-auth.d.ts`:

```typescript
import type { UserRole } from '@/types';

declare module 'next-auth' {
  interface User {
    id: string;
    role: UserRole;
  }

  interface Session {
    user: User & {
      id: string;
      role: UserRole;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
```

---

## 完了条件

- [x] Auth.js v5 がインストールされている
- [x] `lib/auth/config.ts` が作成されている
- [x] Credentials Provider が設定されている
- [x] JWT セッション（8時間有効）が設定されている
- [x] API ルート `/api/auth/*` が動作する

---

## テスト方法

### 1. インストール確認

```bash
npm list next-auth bcryptjs
```

### 2. API ルートテスト

```bash
npm run dev

# 認証エンドポイント確認
curl http://localhost:3000/api/auth/providers
# {"credentials":{"id":"credentials","name":"credentials",...}}
```

### 3. 認証フローテスト

一時的なテストページを作成:

`src/app/test/auth/page.tsx`:

```typescript
'use client';

import { signIn, signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function AuthTestPage() {
  const { data: session, status } = useSession();

  const handleLogin = async () => {
    await signIn('credentials', {
      email: 'admin@example.com',
      password: 'password123',
      redirect: false,
    });
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
  };

  return (
    <div className="container mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">認証テスト</h1>

      <div className="p-4 bg-muted rounded-lg">
        <p>ステータス: {status}</p>
        {session && (
          <>
            <p>ユーザー: {session.user?.email}</p>
            <p>ロール: {session.user?.role}</p>
          </>
        )}
      </div>

      <div className="flex gap-4">
        <Button onClick={handleLogin} disabled={status === 'authenticated'}>
          ログイン
        </Button>
        <Button
          onClick={handleLogout}
          variant="outline"
          disabled={status !== 'authenticated'}
        >
          ログアウト
        </Button>
      </div>
    </div>
  );
}
```

SessionProvider を追加:

`src/app/layout.tsx` を更新:

```typescript
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

### 4. セッション確認

```bash
# ログイン後、ブラウザの開発者ツールで Cookie を確認
# next-auth.session-token が設定されていることを確認
```

---

## 参照設計書セクション

- DESIGN-BE-2026-001 セクション7.2: 認証方式

---

## 成果物

- `src/lib/auth/config.ts`: Auth.js 設定
- `src/lib/auth/index.ts`: Auth.js エントリーポイント
- `src/app/api/auth/[...nextauth]/route.ts`: API ルート
- `src/types/next-auth.d.ts`: 型拡張

---

## 注意事項

- AUTH_SECRET は十分に長いランダム文字列を使用
- 本番環境では環境変数を Vercel で管理
- テスト用ユーザーは Phase 3-2 で DB 連携に変更

---

## 次のタスク

- phase3-002-user-schema.md: ユーザースキーマ定義
