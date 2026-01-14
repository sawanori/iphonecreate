import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { SessionProvider } from 'next-auth/react';

/**
 * Admin root layout
 * Design doc: DESIGN-FE-2026-001 Section 4.3
 * Task: phase4-006-admin-page.md
 *
 * Features:
 * - Authentication check (redirects to /login if not authenticated)
 * - Role check (redirects to /unauthorized if not admin)
 * - SessionProvider wrapper for client components
 * - AdminLayout wrapper for consistent navigation
 */
export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Redirect to unauthorized if not admin
  if (session.user.role !== 'admin') {
    redirect('/unauthorized');
  }

  return (
    <SessionProvider session={session}>
      <AdminLayout>{children}</AdminLayout>
    </SessionProvider>
  );
}
