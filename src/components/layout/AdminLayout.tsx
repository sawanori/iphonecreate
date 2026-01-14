'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * AdminLayout component Props
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
 * Admin layout with responsive sidebar navigation
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'ダッシュボード', icon: 'chart' },
    { href: '/editor', label: 'プロジェクト', icon: 'folder' },
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
    <div className="min-h-screen bg-[oklch(0.98_0.005_280)]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] shadow-md" />
            <span className="text-lg font-bold bg-gradient-to-r from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] bg-clip-text text-transparent">
              AかBか
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label={isSidebarOpen ? 'メニューを閉じる' : 'メニューを開く'}
            aria-expanded={isSidebarOpen}
          >
            {isSidebarOpen ? (
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-white flex flex-col border-r border-gray-100 transition-transform duration-300 ease-out',
          'lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ boxShadow: '4px 0 20px -5px rgba(0, 0, 0, 0.05)' }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] shadow-lg" />
            <span className="text-xl font-bold bg-gradient-to-r from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] bg-clip-text text-transparent">
              AかBか
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4" aria-label="メインナビゲーション">
          <p className="px-4 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            メニュー
          </p>
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group',
                      isActive
                        ? 'bg-gradient-to-r from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] text-white shadow-lg shadow-[oklch(0.75_0.18_25)]/30'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className={cn(
                      'transition-transform duration-300',
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    )}>
                      {renderIcon(item.icon)}
                    </span>
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-white animate-pulse" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-100">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[oklch(0.78_0.16_195)] to-[oklch(0.82_0.14_165)] flex items-center justify-center text-white font-bold shadow-lg">
                {user?.email?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                <p className="text-xs text-gray-500 capitalize flex items-center gap-1">
                  <span className={cn(
                    'h-2 w-2 rounded-full',
                    user?.role === 'admin' ? 'bg-[oklch(0.75_0.18_25)]' : 'bg-[oklch(0.78_0.16_195)]'
                  )} />
                  {user?.role === 'admin' ? '管理者' : '視聴者'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl border-2 border-gray-200 hover:border-[oklch(0.75_0.18_25)] hover:text-[oklch(0.75_0.18_25)] transition-all"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              ログアウト
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn(
        'min-h-screen transition-all duration-300',
        'pt-16 lg:pt-0', // Mobile header spacing
        'lg:ml-72' // Sidebar spacing on desktop
      )}>
        {children}
      </main>
    </div>
  );
}
