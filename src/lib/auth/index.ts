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
