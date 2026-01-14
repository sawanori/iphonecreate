import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  isProtectedRoute,
  isAdminRoute,
  isPublicRoute,
} from '@/lib/auth/guards';

/**
 * Middleware - 認証ガード
 * Edge Runtime で実行される
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
