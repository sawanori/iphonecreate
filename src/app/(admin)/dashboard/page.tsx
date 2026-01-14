import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getProjects } from '@/lib/services/video.service';
import { getOverallAnalytics } from '@/lib/services/analytics.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

/**
 * Dashboard page metadata
 */
export const metadata = {
  title: 'ダッシュボード | 管理パネル',
  description: '動画プロジェクトを管理する管理画面',
};

/**
 * Admin dashboard page with analytics
 * Design doc: DESIGN-FE-2026-001 Section 4.2
 * Task: phase5-005-analytics-dashboard.md
 *
 * Features:
 * - Analytics summary (total views, completion rate, watch time)
 * - Project performance statistics
 * - Recent projects list
 * - New project creation button
 */
export default async function DashboardPage() {
  const session = await auth();
  const projects = await getProjects(session?.user?.id);
  const analytics = await getOverallAnalytics();

  const publishedCount = projects.filter((p) => p.isPublished).length;
  const draftCount = projects.length - publishedCount;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        <Button asChild>
          <Link href="/editor/new">新規プロジェクト</Link>
        </Button>
      </div>

      {/* Analytics summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              総視聴回数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.totalViews}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              完了率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {analytics.overallCompletionRate.toFixed(1)}%
            </p>
            <Progress value={analytics.overallCompletionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              総視聴時間
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {Math.floor(analytics.totalWatchTime / 3600)}時間
            </p>
            <p className="text-sm text-gray-500">
              {Math.floor((analytics.totalWatchTime % 3600) / 60)}分
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              公開コンテンツ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{publishedCount}</p>
            <p className="text-sm text-gray-500">下書き: {draftCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Project performance */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>プロジェクト実績</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.projectStats.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              まだ視聴データがありません
            </p>
          ) : (
            <div className="space-y-4">
              {analytics.projectStats.slice(0, 5).map((stat) => {
                const project = projects.find((p) => p.id === stat.projectId);
                const completionRate = stat.totalViews > 0
                  ? (Number(stat.completed) / stat.totalViews) * 100
                  : 0;

                return (
                  <div
                    key={stat.projectId}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {project?.title ?? stat.projectId}
                      </h3>
                      <div className="flex gap-4 mt-1 text-sm text-gray-500">
                        <span>視聴: {stat.totalViews}回</span>
                        <span>完了: {Number(stat.completed)}回</span>
                      </div>
                    </div>
                    <div className="w-32">
                      <p className="text-sm text-right mb-1">
                        {completionRate.toFixed(0)}%
                      </p>
                      <Progress value={completionRate} />
                    </div>
                    <Button asChild size="sm" variant="outline" className="ml-4">
                      <Link href={`/editor/${stat.projectId}`}>詳細</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent projects list */}
      <Card>
        <CardHeader>
          <CardTitle>最近のプロジェクト</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              プロジェクトがありません。新規プロジェクトを作成してください。
            </p>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{project.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(project.createdAt).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
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
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/editor/${project.id}`}>編集</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
