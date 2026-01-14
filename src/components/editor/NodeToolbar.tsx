/**
 * NodeToolbar コンポーネント
 * ドラッグ可能なノードボタンを提供するツールバー
 *
 * 対応設計書: DESIGN-FE-2026-001 セクション5.2
 * 対応タスク: phase4-002-custom-nodes.md
 */

'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * NodeToolbar コンポーネントのProps
 */
export interface NodeToolbarProps {
  /** 追加のクラス名 */
  className?: string;
  /** モバイル表示かどうか */
  isMobile?: boolean;
}

/**
 * ノード追加ツールバー
 * ドラッグ&ドロップでノードをキャンバスに追加できる
 */
export function NodeToolbar({ className, isMobile = false }: NodeToolbarProps) {
  /**
   * ドラッグ開始時にノードタイプを設定
   */
  const handleDragStart = (
    event: React.DragEvent,
    nodeType: string
  ) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Mobile: compact horizontal layout
  if (isMobile) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg',
          'flex flex-row gap-2',
          className
        )}
      >
        <Button
          size="sm"
          variant="outline"
          className="px-3"
          draggable
          onDragStart={(e) => handleDragStart(e, 'video')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="px-3"
          draggable
          onDragStart={(e) => handleDragStart(e, 'end')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-600"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </Button>
      </div>
    );
  }

  // Desktop: full layout
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg',
        'flex flex-col gap-2',
        className
      )}
    >
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
        ノードを追加
      </div>

      <Button
        size="sm"
        variant="outline"
        className="justify-start"
        draggable
        onDragStart={(e) => handleDragStart(e, 'video')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
        動画ノード
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="justify-start"
        draggable
        onDragStart={(e) => handleDragStart(e, 'end')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 text-green-600"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        終了ノード
      </Button>

      <div className="border-t pt-2 mt-2">
        <p className="text-xs text-gray-400">
          ドラッグしてキャンバスにドロップ
        </p>
      </div>
    </div>
  );
}
