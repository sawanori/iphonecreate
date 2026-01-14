'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * AdminLayout component Props
 * Design doc: DESIGN-FE-2026-001 Section 4.3
 * Task: phase4-006-admin-page.md
 */
export interface AdminLayoutProps {
  /** Children */
  children: React.ReactNode;
}

/**
 * Navigation item definition
 */
interface NavItem {
  href: string;
  label: string;
  icon: string;
}

/**
 * Admin layout with sidebar navigation
 * Provides consistent navigation and user info display for admin pages
 *
 * Features:
 * - Sidebar with navigation items
 * - User info display with role
 * - Logout button
 * - Active navigation highlighting
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: 'chart' },
    { href: '/editor', label: 'Projects', icon: 'folder' },
  ];

  /**
   * Render navigation icon
   */
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'chart':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
      case 'folder':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>

        <nav className="flex-1 p-4" aria-label="Main navigation">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {renderIcon(item.icon)}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="mb-4">
            <p className="text-sm text-gray-400 truncate">{user?.email}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-100 dark:bg-gray-950">{children}</main>
    </div>
  );
}
