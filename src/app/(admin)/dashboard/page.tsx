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
  title: 'Dashboard | Admin Panel',
  description: 'Manage your video projects',
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
  delay,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
  delay: number;
}) {
  return (
    <Card
      className="border-0 bg-white rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1"
      style={{
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 40px -15px rgba(0, 0, 0, 0.1)',
        animationDelay: `${delay}ms`,
      }}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-gray-500">
          {title}
        </CardTitle>
        <div className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg',
          gradient
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className={cn(
          'text-4xl font-extrabold bg-gradient-to-r bg-clip-text text-transparent',
          gradient
        )}>
          {value}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
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
    <div className="p-6 lg:p-10 bg-[oklch(0.98_0.005_280)] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Welcome back! Here&apos;s your overview.</p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] hover:opacity-90 text-white rounded-2xl font-semibold shadow-lg shadow-[oklch(0.75_0.18_25)]/30 transition-all hover:scale-105 h-12 px-6"
        >
          <Link href="/editor/new" className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Link>
        </Button>
      </div>

      {/* Analytics summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          title="Total Views"
          value={analytics.totalViews.toLocaleString()}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
          gradient="bg-gradient-to-r from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)]"
          delay={100}
        />

        <StatCard
          title="Completion Rate"
          value={`${analytics.overallCompletionRate.toFixed(1)}%`}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          gradient="bg-gradient-to-r from-[oklch(0.82_0.14_165)] to-[oklch(0.78_0.16_195)]"
          delay={200}
        />

        <StatCard
          title="Watch Time"
          value={`${Math.floor(analytics.totalWatchTime / 3600)}h`}
          subtitle={`${Math.floor((analytics.totalWatchTime % 3600) / 60)}m`}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          gradient="bg-gradient-to-r from-[oklch(0.78_0.16_195)] to-[oklch(0.65_0.22_295)]"
          delay={300}
        />

        <StatCard
          title="Published"
          value={publishedCount}
          subtitle={`${draftCount} drafts`}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          }
          gradient="bg-gradient-to-r from-[oklch(0.90_0.18_95)] to-[oklch(0.75_0.18_25)]"
          delay={400}
        />
      </div>

      {/* Project performance */}
      <Card className="mb-8 border-0 bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 40px -15px rgba(0, 0, 0, 0.1)' }}>
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-[oklch(0.65_0.22_295)] to-[oklch(0.78_0.16_195)] flex items-center justify-center text-white shadow-lg">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">Project Performance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {analytics.projectStats.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No viewing data yet</p>
              <p className="text-gray-400 text-sm mt-1">Data will appear once viewers start watching</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.projectStats.slice(0, 5).map((stat, index) => {
                const project = projects.find((p) => p.id === stat.projectId);
                const completionRate = stat.totalViews > 0
                  ? (Number(stat.completed) / stat.totalViews) * 100
                  : 0;

                const gradients = [
                  'from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)]',
                  'from-[oklch(0.78_0.16_195)] to-[oklch(0.82_0.14_165)]',
                  'from-[oklch(0.90_0.18_95)] to-[oklch(0.75_0.18_25)]',
                  'from-[oklch(0.65_0.22_295)] to-[oklch(0.78_0.16_195)]',
                  'from-[oklch(0.82_0.14_165)] to-[oklch(0.78_0.16_195)]',
                ];

                return (
                  <div
                    key={stat.projectId}
                    className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-2xl hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn(
                        'h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform group-hover:scale-110',
                        gradients[index % gradients.length]
                      )}>
                        {(project?.title ?? 'P')[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {project?.title ?? stat.projectId}
                        </h3>
                        <div className="flex gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {stat.totalViews} views
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {Number(stat.completed)} completed
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-40 mr-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Completion</span>
                        <span className={cn(
                          'font-semibold bg-gradient-to-r bg-clip-text text-transparent',
                          gradients[index % gradients.length]
                        )}>
                          {completionRate.toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={completionRate}
                        className="h-2 bg-gray-100"
                      />
                    </div>
                    <Button asChild size="sm" variant="outline" className="rounded-xl border-2 hover:bg-gray-50 transition-all">
                      <Link href={`/editor/${stat.projectId}`}>Details</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent projects list */}
      <Card className="border-0 bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 40px -15px rgba(0, 0, 0, 0.1)' }}>
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] flex items-center justify-center text-white shadow-lg">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">Recent Projects</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No projects yet</p>
              <p className="text-gray-400 text-sm mt-1">Create your first project to get started</p>
              <Button
                asChild
                className="mt-4 bg-gradient-to-r from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] hover:opacity-90 text-white rounded-xl font-semibold shadow-lg transition-all hover:scale-105"
              >
                <Link href="/editor/new">Create Project</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 5).map((project, index) => {
                const gradients = [
                  'from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)]',
                  'from-[oklch(0.78_0.16_195)] to-[oklch(0.82_0.14_165)]',
                  'from-[oklch(0.90_0.18_95)] to-[oklch(0.75_0.18_25)]',
                  'from-[oklch(0.65_0.22_295)] to-[oklch(0.78_0.16_195)]',
                  'from-[oklch(0.82_0.14_165)] to-[oklch(0.78_0.16_195)]',
                ];

                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-2xl hover:shadow-md transition-all group"
                  >
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
                          {new Date(project.createdAt).toLocaleDateString('en-US', {
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
                            ? 'bg-[oklch(0.92_0.10_165)] text-[oklch(0.45_0.12_165)]'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {project.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <Button asChild size="sm" variant="outline" className="rounded-xl border-2 hover:bg-gray-50 transition-all">
                        <Link href={`/editor/${project.id}`}>Edit</Link>
                      </Button>
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
