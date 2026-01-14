import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'ログイン | Interactive Video Platform',
  description: 'アカウントにログインしてください',
};

export default async function LoginPage() {
  // 既にログイン済みの場合はリダイレクト
  const session = await auth();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="w-full max-w-md">
      <LoginForm />

      {/* 開発用：テストアカウント情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-sm">
          <p className="font-semibold text-yellow-800 dark:text-yellow-200">
            テストアカウント
          </p>
          <ul className="mt-2 space-y-1 text-yellow-700 dark:text-yellow-300">
            <li>管理者: admin@example.com / password123</li>
            <li>視聴者: viewer@example.com / password123</li>
          </ul>
        </div>
      )}
    </div>
  );
}
