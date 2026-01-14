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
    status: status as AuthStatus,
    isAuthenticated,
    isLoading,
    user,
    isAdmin,
    isViewer,
  };
}
