import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watch | Interactive Video Platform',
  description: 'Watch interactive videos',
};

export default function ViewerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
