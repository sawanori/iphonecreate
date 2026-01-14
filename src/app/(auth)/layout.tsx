import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '認証 | AかBか',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[oklch(0.99_0.005_165)]">
      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[oklch(0.45_0.15_165)] opacity-15 blob animate-float" />
        <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-[oklch(0.80_0.12_165)] opacity-15 blob-2" style={{ animationDelay: '-3s' }} />
      </div>

      {/* Logo */}
      <div className="absolute top-6 left-6 flex items-center gap-3 z-10">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] shadow-lg" />
        <span className="text-xl font-bold bg-gradient-to-r from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] bg-clip-text text-transparent">
          AかBか
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-4">
        {children}
      </div>
    </div>
  );
}
