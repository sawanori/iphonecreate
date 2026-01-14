import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '視聴 | AかBか',
  description: 'インタラクティブ動画を視聴',
};

export default function ViewerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
