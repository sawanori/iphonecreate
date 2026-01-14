'use client';

import { cn } from '@/lib/utils';

/**
 * ViewerLayout component Props
 * Design doc: DESIGN-FE-2026-001 Section 5.5
 * Task: phase2-007-responsive.md
 */
export interface ViewerLayoutProps {
  /** Title */
  title?: string;
  /** Children */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * Viewer screen layout
 * Provides consistent header/footer for the video viewing experience
 *
 * Responsive design:
 * - xs/mobile: Compact padding and smaller text
 * - sm+: Standard padding
 * - md+: Larger padding
 *
 * Features:
 * - Safe area support for notched devices
 * - Sticky header for better UX
 * - Responsive typography and spacing
 */
export function ViewerLayout({ title, children, className }: ViewerLayoutProps) {
  return (
    <div
      className={cn(
        'viewer-layout min-h-screen bg-gray-950 flex flex-col',
        className
      )}
    >
      {/* Header - Responsive with sticky positioning */}
      {title && (
        <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <h1 className="text-white text-sm sm:text-base md:text-lg font-semibold truncate">
              {title}
            </h1>
          </div>
        </header>
      )}

      {/* Main content - Responsive padding */}
      <main className="flex-1 container mx-auto px-2 sm:px-4 py-3 sm:py-4 md:py-6">
        {children}
      </main>

      {/* Footer - Responsive */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 text-center">
          <p className="text-gray-500 text-xs sm:text-sm">
            Interactive Video Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
