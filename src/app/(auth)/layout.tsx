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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[oklch(0.99_0.005_280)]">
      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[oklch(0.75_0.18_25)] opacity-20 blob animate-float" />
        <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-[oklch(0.65_0.22_295)] opacity-15 blob-2" style={{ animationDelay: '-3s' }} />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] bg-[oklch(0.78_0.16_195)] opacity-15 blob" style={{ animationDelay: '-5s' }} />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[oklch(0.90_0.18_95)] opacity-10 blob-2" />
      </div>

      {/* Logo */}
      <div className="absolute top-6 left-6 flex items-center gap-3 z-10">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] shadow-lg" />
        <span className="text-xl font-bold bg-gradient-to-r from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] bg-clip-text text-transparent">
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
