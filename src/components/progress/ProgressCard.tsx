'use client';

/**
 * ProgressCard コンポーネント
 * 進捗情報を表示するカードコンポーネント
 *
 * 対応設計書: DESIGN-FE-2026-001 セクション4.2
 * 対応タスク: phase5-004-progress-page.md
 */

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UserProgressData } from '@/stores/progressStore';

/**
 * ProgressCard コンポーネントのProps
 */
export interface ProgressCardProps {
  /** 進捗データ */
  progress: UserProgressData;
  /** プロジェクトタイトル（オプション） */
  projectTitle?: string;
  /** 追加のクラス名 */
  className?: string;
}

/**
 * ステータス設定
 */
const statusConfig = {
  not_started: {
    label: '未開始',
    color: 'bg-gray-100 text-gray-800',
  },
  in_progress: {
    label: '進行中',
    color: 'bg-blue-100 text-blue-800',
  },
  completed: {
    label: '完了',
    color: 'bg-green-100 text-green-800',
  },
} as const;

/**
 * 視聴時間をフォーマット
 */
function formatWatchTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}時間 ${minutes}分 ${remainingSeconds}秒`;
  }

  return `${minutes}分 ${remainingSeconds}秒`;
}

/**
 * アクションボタンのラベルを取得
 */
function getActionLabel(
  status: UserProgressData['status']
): string {
  switch (status) {
    case 'not_started':
      return '視聴を開始';
    case 'in_progress':
      return '続きを見る';
    case 'completed':
      return 'もう一度見る';
  }
}

/**
 * ProgressCard コンポーネント
 * 進捗情報を表示するカード
 */
export function ProgressCard({
  progress,
  projectTitle,
  className,
}: ProgressCardProps) {
  const config = statusConfig[progress.status];
  const actionLabel = getActionLabel(progress.status);

  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg truncate">
            {projectTitle ?? progress.projectId}
          </CardTitle>
          <span
            className={cn(
              'px-2 py-1 text-xs font-medium rounded-full',
              config.color
            )}
          >
            {config.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">進捗</span>
            <span className="font-medium">
              {progress.completionRate.toFixed(0)}%
            </span>
          </div>
          <Progress value={progress.completionRate} />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">視聴時間</p>
            <p className="font-medium">
              {formatWatchTime(progress.totalWatchTime)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">最終アクセス</p>
            <p className="font-medium">
              {new Date(progress.lastAccessedAt).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2">
          <Button asChild className="w-full">
            <Link href={`/watch/${progress.projectId}`}>{actionLabel}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
