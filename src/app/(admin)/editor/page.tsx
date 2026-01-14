import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getProjects } from '@/lib/services/video.service';
import { Button } from '@/components/ui/button';
import { EditorProjectGrid } from '@/components/editor';

/**
 * Projects list page metadata
 */
export const metadata = {
  title: 'プロジェクト | 管理パネル',
  description: '動画プロジェクトを管理',
};

/**
 * Projects list page
 * Shows all projects with edit and preview actions
 */
export default async function ProjectsPage() {
  const session = await auth();
  const projects = await getProjects(session?.user?.id);

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">プロジェクト</h1>
        <Button asChild size="sm" className="sm:size-default">
          <Link href="/editor/new">
            <span className="hidden sm:inline">新規プロジェクト</span>
            <span className="sm:hidden">+ 新規</span>
          </Link>
        </Button>
      </div>

      <EditorProjectGrid projects={projects} />
    </div>
  );
}
