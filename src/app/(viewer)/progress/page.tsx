'use client';

/**
 * Progress Page
 * 進捗表示ページ
 *
 * 対応設計書: DESIGN-FE-2026-001 セクション4.2
 * 対応タスク: phase5-004-progress-page.md
 */

import { useEffect } from 'react';
import { useProgressStore } from '@/stores/progressStore';
import { ProgressCard } from '@/components/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * ProgressPage コンポーネント
 * ユーザーの進捗一覧と選択履歴を表示する
 */
export default function ProgressPage() {
  const { progressList, summary, isLoading, error, fetchProgressList } =
    useProgressStore();

  useEffect(() => {
    fetchProgressList();
  }, [fetchProgressList]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">学習進捗</h1>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                コンテンツ総数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summary.totalProjects}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                完了
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {summary.completedProjects}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                進行中
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {summary.inProgressProjects}
              </p>
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
                {Math.floor(summary.totalWatchTime / 60)}分
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress list */}
      {progressList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">視聴履歴がありません</p>
            <p className="text-sm text-gray-400">
              動画を視聴すると、ここに進捗が表示されます
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {progressList.map((progress) => (
            <ProgressCard key={progress.id} progress={progress} />
          ))}
        </div>
      )}
    </div>
  );
}
