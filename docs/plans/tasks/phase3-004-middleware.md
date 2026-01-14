# タスク: Middleware 認証ガード

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase3-004 |
| フェーズ | Phase 3: 認証機能 |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

Next.js Middleware を使用して認証必須ルートを保護する。未認証ユーザーをログインページにリダイレクトし、レート制限（Upstash）を設定する。

---

## 前提条件

### 依存タスク
- phase3-003-login-page.md（ログイン画面が実装されていること）

### 前提成果物
- `src/lib/auth/index.ts`
- `src/app/(auth)/login/page.tsx`

### 環境変数
```
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/middleware.ts` | 新規作成 |
| `src/lib/auth/guards.ts` | 新規作成 |
| `.env.local` | 更新 |

---

## 実装詳細

### ステップ 1: Upstash パッケージインストール

```bash
npm install @upstash/ratelimit @upstash/redis
```

### ステップ 2: 認証ガード関数作成

`src/lib/auth/guards.ts`:

```typescript
import { auth } from '@/lib/auth';
import type { UserRole } from '@/types';

/**
 * 認証チェック結果
 */
export interface AuthCheckResult {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  } | null;
}

/**
 * 現在のセッションから認証状態を取得
 */
export async function checkAuth(): Promise<AuthCheckResult> {
  const session = await auth();

  if (!session?.user) {
    return {
      isAuthenticated: false,
      user: null,
    };
  }

  return {
    isAuthenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email ?? '',
      name: session.user.name ?? '',
      role: session.user.role,
    },
  };
}

/**
 * 管理者権限チェック
 */
export async function checkAdminAuth(): Promise<AuthCheckResult> {
  const result = await checkAuth();

  if (!result.isAuthenticated) {
    return result;
  }

  if (result.user?.role !== 'admin') {
    return {
      isAuthenticated: false,
      user: null,
    };
  }

  return result;
}

/**
 * 認証必須ルート
 */
export const protectedRoutes = [
  '/watch',
  '/progress',
  '/editor',
  '/dashboard',
  '/admin',
];

/**
 * 管理者専用ルート
 */
export const adminRoutes = [
  '/editor',
  '/dashboard',
  '/admin',
];

/**
 * 公開ルート（認証不要）
 */
export const publicRoutes = [
  '/login',
  '/api/auth',
];

/**
 * パスが保護されたルートかチェック
 */
export function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

/**
 * パスが管理者専用ルートかチェック
 */
export function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some((route) => pathname.startsWith(route));
}

/**
 * パスが公開ルートかチェック
 */
export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route));
}
```

### ステップ 3: Middleware 作成

`src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  isProtectedRoute,
  isAdminRoute,
  isPublicRoute,
} from '@/lib/auth/guards';

/**
 * レート制限設定（Upstash）
 */
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis,
    // 1分間に60リクエストまで
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true,
  });
}

/**
 * Middleware
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的ファイル、API、_next は除外
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') // 静的ファイル
  ) {
    return NextResponse.next();
  }

  // レート制限チェック
  if (ratelimit) {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);

    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });
    }
  }

  // 公開ルートは認証不要
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // セッション取得
  const session = await auth();

  // 保護されたルートの認証チェック
  if (isProtectedRoute(pathname)) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 管理者専用ルートの権限チェック
  if (isAdminRoute(pathname)) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.user.role !== 'admin') {
      // 権限不足エラーページへリダイレクト
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

/**
 * Middleware が適用されるパス
 */
export const config = {
  matcher: [
    /*
     * 以下を除くすべてのパスに適用:
     * - api/auth (認証API)
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化)
     * - favicon.ico (ファビコン)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### ステップ 4: 権限不足ページ作成

`src/app/unauthorized/page.tsx`:

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600">
            アクセス権限がありません
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            このページにアクセスする権限がありません。
            管理者権限が必要です。
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link href="/">トップページへ</Link>
            </Button>
            <Button asChild>
              <Link href="/login">ログインページへ</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### ステップ 5: 環境変数追加

`.env.local` に追加:

```
# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

---

## 完了条件

- [x] Middleware が作成されている
- [x] 未認証ユーザーがログインページにリダイレクトされる
- [x] AC-AUTH-004: 8時間でセッションがタイムアウトする
- [x] レート制限が機能する（Upstash 設定時）
- [x] 権限不足ページが表示される

---

## テスト方法

### 1. 未認証リダイレクトテスト

```bash
npm run dev

# 未認証状態で保護されたルートにアクセス
# http://localhost:3000/watch/test
# → /login?callbackUrl=/watch/test にリダイレクト
```

### 2. 認証後アクセステスト

```
1. /login でログイン
2. 保護されたルートにアクセス
3. 正常にページが表示される
```

### 3. 権限チェックテスト

```
1. viewer@example.com でログイン
2. /editor（管理者専用）にアクセス
3. /unauthorized にリダイレクトされる

4. admin@example.com でログイン
5. /editor にアクセス
6. 正常にページが表示される
```

### 4. セッションタイムアウトテスト

```
1. ログイン
2. 8時間待機（または開発用に短縮設定）
3. ページリロード
4. ログインページにリダイレクトされる
```

### 5. レート制限テスト

```bash
# 短時間に大量のリクエストを送信
for i in {1..100}; do curl http://localhost:3000/; done

# 429 Too Many Requests が返ることを確認
```

---

## 参照設計書セクション

- DESIGN-BE-2026-001 セクション7.3: ルート保護
- DESIGN-BE-2026-001 セクション7.4: レート制限

---

## 成果物

- `src/middleware.ts`: Next.js Middleware
- `src/lib/auth/guards.ts`: 認証ガード関数
- `src/app/unauthorized/page.tsx`: 権限不足ページ

---

## 注意事項

- Middleware は Edge Runtime で実行される
- Upstash Redis は無料枠で十分な場合が多い
- レート制限は IP ベース（プロキシ環境では注意）

---

## 次のタスク

- phase3-005-role-routing.md: 権限別ルーティング
