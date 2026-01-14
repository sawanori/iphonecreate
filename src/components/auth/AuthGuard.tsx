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
