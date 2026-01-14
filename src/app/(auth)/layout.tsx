import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '認証 | Interactive Video Platform',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      {children}
    </div>
  );
}
