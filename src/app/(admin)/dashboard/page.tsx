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
  description: '動画プロジェクトを管理',
};

/**
 * Stat Card with colorful gradient
 */
function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <Card
      className="border-0 bg-white rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1"
      style={{
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 40px -15px rgba(0, 0, 0, 0.1)',
      }}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">
          {title}
        </CardTitle>
        <div className={cn(
          'h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-lg',
          gradient
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className={cn(
          'text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r bg-clip-text text-transparent',
          gradient
        )}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Admin dashboard page with analytics
 */
export default async function DashboardPage() {
  const session = await auth();
  const projects = await getProjects(session?.user?.id);
  const analytics = await getOverallAnalytics();

  const publishedCount = projects.filter((p) => p.isPublished).length;
  const draftCount = projects.length - publishedCount;

  return (
    <div className="p-4 sm:p-6 lg:p-10 bg-[oklch(0.98_0.005_280)] min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900">
              ダッシュボード
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">おかえりなさい！概要をご確認ください。</p>
          </div>
          <Button
            asChild
            className="bg-gradient-to-r from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] hover:opacity-90 text-white rounded-xl sm:rounded-2xl font-semibold shadow-lg shadow-[oklch(0.45_0.15_165)]/30 transition-all hover:scale-105 h-11 sm:h-12 px-4 sm:px-6 w-full sm:w-auto"
          >
            <Link href="/editor/new" className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新規プロジェクト
            </Link>
          </Button>
        </div>
      </div>

      {/* Analytics summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-10">
        <StatCard
          title="総視聴回数"
          value={analytics.totalViews.toLocaleString()}
          icon={
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
          gradient="bg-gradient-to-r from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)]"
        />

        <StatCard
          title="完了率"
          value={`${analytics.overallCompletionRate.toFixed(1)}%`}
          icon={
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          gradient="bg-gradient-to-r from-[oklch(0.80_0.12_165)] to-[oklch(0.45_0.15_165)]"
        />

        <StatCard
          title="総視聴時間"
          value={`${Math.floor(analytics.totalWatchTime / 3600)}時間`}
          subtitle={`${Math.floor((analytics.totalWatchTime % 3600) / 60)}分`}
          icon={
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          gradient="bg-gradient-to-r from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)]"
        />

        <StatCard
          title="公開中"
          value={publishedCount}
          subtitle={`下書き: ${draftCount}`}
          icon={
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          }
          gradient="bg-gradient-to-r from-[oklch(0.80_0.12_165)] to-[oklch(0.45_0.15_165)]"
        />
      </div>

      {/* Project performance */}
      <Card className="mb-6 sm:mb-8 border-0 bg-white rounded-2xl sm:rounded-3xl overflow-hidden" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 40px -15px rgba(0, 0, 0, 0.1)' }}>
        <CardHeader className="border-b border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-r from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] flex items-center justify-center text-white shadow-lg">
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">プロジェクト実績</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {analytics.projectStats.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="mx-auto mb-4 h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">まだ視聴データがありません</p>
              <p className="text-gray-400 text-sm mt-1">視聴者が視聴を開始するとデータが表示されます</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {analytics.projectStats.slice(0, 5).map((stat, index) => {
                const project = projects.find((p) => p.id === stat.projectId);
                const completionRate = stat.totalViews > 0
                  ? (Number(stat.completed) / stat.totalViews) * 100
                  : 0;

                const gradients = [
                  'from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)]',
                  'from-[oklch(0.80_0.12_165)] to-[oklch(0.45_0.15_165)]',
                  'from-[oklch(0.45_0.15_165)] to-[oklch(0.60_0.13_165)]',
                  'from-[oklch(0.60_0.13_165)] to-[oklch(0.80_0.12_165)]',
                  'from-[oklch(0.80_0.12_165)] to-[oklch(0.60_0.13_165)]',
                ];

                return (
                  <div
                    key={stat.projectId}
                    className="p-3 sm:p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl sm:rounded-2xl hover:shadow-md transition-all group"
                  >
                    {/* Mobile Layout */}
                    <div className="flex flex-col gap-3 sm:hidden">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold shadow-lg shrink-0',
                          gradients[index % gradients.length]
                        )}>
                          {(project?.title ?? 'P')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {project?.title ?? stat.projectId}
                          </h3>
                          <div className="flex gap-3 text-xs text-gray-500">
                            <span>{stat.totalViews}回視聴</span>
                            <span>{Number(stat.completed)}回完了</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">完了率</span>
                            <span className={cn(
                              'font-semibold bg-gradient-to-r bg-clip-text text-transparent',
                              gradients[index % gradients.length]
                            )}>
                              {completionRate.toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={completionRate} className="h-1.5 bg-gray-100" />
                        </div>
                        <Button asChild size="sm" variant="outline" className="rounded-lg text-xs h-8 px-3 shrink-0">
                          <Link href={`/editor/${stat.projectId}`}>詳細</Link>
                        </Button>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={cn(
                          'h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform group-hover:scale-110 shrink-0',
                          gradients[index % gradients.length]
                        )}>
                          {(project?.title ?? 'P')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {project?.title ?? stat.projectId}
                          </h3>
                          <div className="flex gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {stat.totalViews}回視聴
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {Number(stat.completed)}回完了
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-32 lg:w-40 mx-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-500">完了率</span>
                          <span className={cn(
                            'font-semibold bg-gradient-to-r bg-clip-text text-transparent',
                            gradients[index % gradients.length]
                          )}>
                            {completionRate.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={completionRate} className="h-2 bg-gray-100" />
                      </div>
                      <Button asChild size="sm" variant="outline" className="rounded-xl border-2 hover:bg-gray-50 transition-all shrink-0">
                        <Link href={`/editor/${stat.projectId}`}>詳細</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent projects list */}
      <Card className="border-0 bg-white rounded-2xl sm:rounded-3xl overflow-hidden" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 40px -15px rgba(0, 0, 0, 0.1)' }}>
        <CardHeader className="border-b border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-r from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] flex items-center justify-center text-white shadow-lg">
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">最近のプロジェクト</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {projects.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="mx-auto mb-4 h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">プロジェクトがありません</p>
              <p className="text-gray-400 text-sm mt-1">最初のプロジェクトを作成しましょう</p>
              <Button
                asChild
                className="mt-4 bg-gradient-to-r from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] hover:opacity-90 text-white rounded-xl font-semibold shadow-lg transition-all hover:scale-105"
              >
                <Link href="/editor/new">プロジェクトを作成</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {projects.slice(0, 5).map((project, index) => {
                const gradients = [
                  'from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)]',
                  'from-[oklch(0.80_0.12_165)] to-[oklch(0.45_0.15_165)]',
                  'from-[oklch(0.45_0.15_165)] to-[oklch(0.60_0.13_165)]',
                  'from-[oklch(0.60_0.13_165)] to-[oklch(0.80_0.12_165)]',
                  'from-[oklch(0.80_0.12_165)] to-[oklch(0.60_0.13_165)]',
                ];

                return (
                  <div
                    key={project.id}
                    className="p-3 sm:p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl sm:rounded-2xl hover:shadow-md transition-all group"
                  >
                    {/* Mobile Layout */}
                    <div className="flex flex-col gap-3 sm:hidden">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold shadow-lg shrink-0',
                          gradients[index % gradients.length]
                        )}>
                          {project.title[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
                          <p className="text-xs text-gray-500">
                            {new Date(project.createdAt).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'px-2.5 py-1 text-xs font-semibold rounded-lg',
                            project.isPublished
                              ? 'bg-[oklch(0.90_0.08_165)] text-[oklch(0.35_0.12_165)]'
                              : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {project.isPublished ? '公開中' : '下書き'}
                        </span>
                        <Button asChild size="sm" variant="outline" className="rounded-lg text-xs h-8 px-3">
                          <Link href={`/editor/${project.id}`}>編集</Link>
                        </Button>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform group-hover:scale-110',
                          gradients[index % gradients.length]
                        )}>
                          {project.title[0].toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{project.title}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(project.createdAt).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            'px-3 py-1.5 text-xs font-semibold rounded-xl',
                            project.isPublished
                              ? 'bg-[oklch(0.90_0.08_165)] text-[oklch(0.35_0.12_165)]'
                              : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {project.isPublished ? '公開中' : '下書き'}
                        </span>
                        <Button asChild size="sm" variant="outline" className="rounded-xl border-2 hover:bg-gray-50 transition-all">
                          <Link href={`/editor/${project.id}`}>編集</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
