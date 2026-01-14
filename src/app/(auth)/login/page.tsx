import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'ログイン | AかBか',
  description: 'アカウントにログイン',
};

export default async function LoginPage() {
  // Redirect if already logged in
  const session = await auth();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <LoginForm />

      {/* Dev: Test account info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-5 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-[oklch(0.80_0.12_165)]/30 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] flex items-center justify-center">
              <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-semibold text-[oklch(0.35_0.10_165)]">
              Test Accounts
            </p>
          </div>
          <ul className="space-y-2 text-sm text-[oklch(0.30_0.05_165)]">
            <li className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[oklch(0.45_0.15_165)]/10 text-[oklch(0.35_0.12_165)] rounded-lg text-xs font-medium">Admin</span>
              admin@example.com / password123
            </li>
            <li className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[oklch(0.80_0.12_165)]/10 text-[oklch(0.45_0.10_165)] rounded-lg text-xs font-medium">Viewer</span>
              viewer@example.com / password123
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
