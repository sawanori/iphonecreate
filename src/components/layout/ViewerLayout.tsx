'use client';

import { cn } from '@/lib/utils';

/**
 * ViewerLayout component Props
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
 * Viewer screen layout with pop design
 * Provides consistent header/footer for the video viewing experience
 */
export function ViewerLayout({ title, children, className }: ViewerLayoutProps) {
  return (
    <div
      className={cn(
        'viewer-layout min-h-screen bg-[oklch(0.12_0.02_280)] flex flex-col relative overflow-hidden',
        className
      )}
    >
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-[oklch(0.75_0.18_25)] opacity-10 blob" />
        <div className="absolute top-1/2 -left-40 w-[300px] h-[300px] bg-[oklch(0.65_0.22_295)] opacity-10 blob-2" style={{ animationDelay: '-3s' }} />
        <div className="absolute -bottom-40 right-1/4 w-[350px] h-[350px] bg-[oklch(0.78_0.16_195)] opacity-10 blob" style={{ animationDelay: '-5s' }} />
      </div>

      {/* Header */}
      {title && (
        <header className="relative z-40 bg-[oklch(0.15_0.02_280)]/80 backdrop-blur-xl border-b border-white/10 sticky top-0">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] shadow-lg flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <h1 className="text-white text-sm sm:text-base md:text-lg font-semibold truncate">
              {title}
            </h1>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-40 bg-[oklch(0.15_0.02_280)]/80 backdrop-blur-xl border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)]" />
            <p className="text-white/50 text-xs sm:text-sm font-medium">
              Interactive Video Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
