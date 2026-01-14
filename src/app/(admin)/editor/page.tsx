import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getProjects } from '@/lib/services/video.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">プロジェクト</h1>
        <Button asChild>
          <Link href="/editor/new">新規プロジェクト</Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-gray-500 mb-4">
              プロジェクトがありません。最初のプロジェクトを作成してください。
            </p>
            <Button asChild>
              <Link href="/editor/new">プロジェクト作成</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg truncate">{project.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                  {project.thumbnailUrl ? (
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-gray-400">サムネイルなし</span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span
                    className={cn(
                      'px-2 py-1 text-xs rounded',
                      project.isPublished
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    )}
                  >
                    {project.isPublished ? '公開中' : '下書き'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(project.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/editor/${project.id}`}>編集</Link>
                  </Button>
                  {project.isPublished && (
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link href={`/watch/${project.id}`} target="_blank">
                        プレビュー
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
