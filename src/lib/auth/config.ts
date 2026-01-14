import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import type { UserRole } from '@/types';
import { findUserByEmail } from '@/lib/db/repositories/user.repository';
import { verifyPassword } from './password';

/**
 * ログインスキーマ
 */
const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

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
