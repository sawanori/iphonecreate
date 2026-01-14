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
export const adminRoutes = ['/editor', '/dashboard', '/admin'];

/**
 * 公開ルート（認証不要）
 */
export const publicRoutes = ['/login', '/api/auth'];

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
