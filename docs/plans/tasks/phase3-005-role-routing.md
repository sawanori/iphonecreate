# タスク: 権限別ルーティング

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase3-005 |
| フェーズ | Phase 3: 認証機能 |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

管理者専用ルートの保護と、権限別ルーティングを実装する。AuthGuard コンポーネントと権限不足時のエラー表示を作成する。

---

## 前提条件

### 依存タスク
- phase3-004-middleware.md（Middleware 認証ガードが実装されていること）

### 前提成果物
- `src/middleware.ts`
- `src/lib/auth/guards.ts`
- `src/app/unauthorized/page.tsx`

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/components/auth/AuthGuard.tsx` | 新規作成 |
| `src/components/auth/RoleGuard.tsx` | 新規作成 |
| `src/components/auth/index.ts` | 更新 |
| `src/hooks/useAuth.ts` | 新規作成 |
| `src/hooks/index.ts` | 更新 |

---

## 実装詳細

### ステップ 1: useAuth フック作成

`src/hooks/useAuth.ts`:

```typescript
'use client';

import { useSession } from 'next-auth/react';
import type { UserRole, AuthStatus } from '@/types';

/**
 * useAuth フックの戻り値
 */
export interface UseAuthReturn {
  /** 認証状態 */
  status: AuthStatus;
  /** 認証済みかどうか */
  isAuthenticated: boolean;
  /** ローディング中かどうか */
  isLoading: boolean;
  /** ユーザー情報 */
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  } | null;
  /** 管理者かどうか */
  isAdmin: boolean;
  /** 視聴者かどうか */
  isViewer: boolean;
}

/**
 * 認証状態を取得するフック
 */
export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email ?? '',
        name: session.user.name ?? '',
        role: session.user.role,
      }
    : null;

  const isAdmin = user?.role === 'admin';
  const isViewer = user?.role === 'viewer';

  return {
    status,
    isAuthenticated,
    isLoading,
    user,
    isAdmin,
    isViewer,
  };
}
```

### ステップ 2: AuthGuard コンポーネント作成

`src/components/auth/AuthGuard.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * AuthGuard コンポーネントのProps
 */
export interface AuthGuardProps {
  /** 子要素 */
  children: React.ReactNode;
  /** リダイレクト先（デフォルト: /login） */
  redirectTo?: string;
  /** ローディング中の表示 */
  fallback?: React.ReactNode;
}

/**
 * 認証ガードコンポーネント
 * 未認証ユーザーをリダイレクトする
 */
export function AuthGuard({
  children,
  redirectTo = '/login',
  fallback,
}: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      const loginUrl = `${redirectTo}?callbackUrl=${encodeURIComponent(currentPath)}`;
      router.push(loginUrl);
    }
  }, [isLoading, isAuthenticated, redirectTo, router]);

  // ローディング中
  if (isLoading) {
    return (
      fallback ?? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      )
    );
  }

  // 未認証
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

### ステップ 3: RoleGuard コンポーネント作成

`src/components/auth/RoleGuard.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

/**
 * RoleGuard コンポーネントのProps
 */
export interface RoleGuardProps {
  /** 子要素 */
  children: React.ReactNode;
  /** 許可されたロール */
  allowedRoles: UserRole[];
  /** 権限不足時のリダイレクト先 */
  redirectTo?: string;
  /** ローディング中の表示 */
  fallback?: React.ReactNode;
  /** 権限不足時の表示（リダイレクトしない場合） */
  unauthorizedFallback?: React.ReactNode;
}

/**
 * ロールベースの認証ガードコンポーネント
 */
export function RoleGuard({
  children,
  allowedRoles,
  redirectTo = '/unauthorized',
  fallback,
  unauthorizedFallback,
}: RoleGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  const hasPermission = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasPermission && !unauthorizedFallback) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, hasPermission, redirectTo, router, unauthorizedFallback]);

  // ローディング中
  if (isLoading) {
    return (
      fallback ?? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      )
    );
  }

  // 未認証（AuthGuard と組み合わせて使用することを想定）
  if (!isAuthenticated) {
    return null;
  }

  // 権限不足
  if (!hasPermission) {
    if (unauthorizedFallback) {
      return <>{unauthorizedFallback}</>;
    }
    return null;
  }

  return <>{children}</>;
}

/**
 * 管理者専用ガード
 */
export function AdminGuard({
  children,
  ...props
}: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['admin']} {...props}>
      {children}
    </RoleGuard>
  );
}

/**
 * 視聴者専用ガード
 */
export function ViewerGuard({
  children,
  ...props
}: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['viewer', 'admin']} {...props}>
      {children}
    </RoleGuard>
  );
}
```

### ステップ 4: auth コンポーネントインデックス更新

`src/components/auth/index.ts`:

```typescript
export { LoginForm } from './LoginForm';
export type { LoginFormProps } from './LoginForm';

export { AuthGuard } from './AuthGuard';
export type { AuthGuardProps } from './AuthGuard';

export { RoleGuard, AdminGuard, ViewerGuard } from './RoleGuard';
export type { RoleGuardProps } from './RoleGuard';
```

### ステップ 5: hooks インデックス更新

`src/hooks/index.ts`:

```typescript
export { useChoiceTimer } from './useChoiceTimer';
export type { UseChoiceTimerOptions, UseChoiceTimerReturn } from './useChoiceTimer';

export { useVideoPlayer } from './useVideoPlayer';
export type { UseVideoPlayerOptions, UseVideoPlayerReturn } from './useVideoPlayer';

export { useAuth } from './useAuth';
export type { UseAuthReturn } from './useAuth';
```

---

## 完了条件

- [x] AuthGuard コンポーネントが作成されている
- [x] RoleGuard コンポーネントが作成されている
- [x] AC-AUTH-002: 管理者は管理画面にアクセスできる
- [x] AC-AUTH-003: 視聴者は管理画面にアクセスできない
- [x] useAuth フックが作成されている

---

## テスト方法

### 1. AuthGuard テスト

`src/app/test/guard/page.tsx`:

```typescript
'use client';

import { AuthGuard } from '@/components/auth';
import { useAuth } from '@/hooks';

function ProtectedContent() {
  const { user } = useAuth();

  return (
    <div className="p-4 bg-green-100 rounded-lg">
      <p className="text-green-800">
        認証済みユーザー: {user?.email}
      </p>
      <p className="text-green-800">
        ロール: {user?.role}
      </p>
    </div>
  );
}

export default function GuardTestPage() {
  return (
    <div className="container mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">認証ガードテスト</h1>

      <div className="p-4 bg-muted rounded-lg">
        <h2 className="font-semibold mb-2">AuthGuard</h2>
        <AuthGuard>
          <ProtectedContent />
        </AuthGuard>
      </div>
    </div>
  );
}
```

### 2. RoleGuard テスト

```typescript
'use client';

import { AdminGuard, ViewerGuard } from '@/components/auth';

export default function RoleGuardTestPage() {
  return (
    <div className="container mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">ロールガードテスト</h1>

      <div className="p-4 bg-muted rounded-lg">
        <h2 className="font-semibold mb-2">AdminGuard</h2>
        <AdminGuard
          unauthorizedFallback={
            <p className="text-red-500">管理者権限が必要です</p>
          }
        >
          <p className="text-green-500">管理者専用コンテンツ</p>
        </AdminGuard>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h2 className="font-semibold mb-2">ViewerGuard</h2>
        <ViewerGuard
          unauthorizedFallback={
            <p className="text-red-500">視聴者権限が必要です</p>
          }
        >
          <p className="text-green-500">視聴者向けコンテンツ</p>
        </ViewerGuard>
      </div>
    </div>
  );
}
```

### 3. 動作確認

```bash
npm run dev

# テストシナリオ:
# 1. 未認証でアクセス → ログインページにリダイレクト
# 2. viewer でログイン → AdminGuard でブロック
# 3. admin でログイン → すべてのコンテンツが表示
```

### 4. 統合テスト

```
1. viewer@example.com でログイン
2. /editor にアクセス
3. /unauthorized にリダイレクト
4. ログアウト

5. admin@example.com でログイン
6. /editor にアクセス
7. エディターページが表示される
```

---

## 参照設計書セクション

- DESIGN-BE-2026-001 セクション7.3: ルート保護

---

## 成果物

- `src/components/auth/AuthGuard.tsx`: 認証ガードコンポーネント
- `src/components/auth/RoleGuard.tsx`: ロールガードコンポーネント
- `src/hooks/useAuth.ts`: 認証フック

---

## 注意事項

- Middleware と組み合わせて二重の保護を実現
- クライアントサイドのガードは UX 向上のため
- 重要な保護は必ずサーバーサイド（Middleware/API）で行う

---

## 次のタスク

- phase3-completion.md: Phase 3 完了検証
