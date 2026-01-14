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
 * 視聴者専用ガード（管理者も含む）
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
