/**
 * EndNode コンポーネント
 * フローチャート内の終了ノードを表示
 *
 * 対応設計書: DESIGN-FE-2026-001 セクション5.2
 * 対応タスク: phase4-002-custom-nodes.md
 */

'use client';

import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * EndNode のデータ型
 */
export type EndNodeData = {
  /** ノードのタイトル */
  title: string;
  /** インデックスシグネチャ */
  [key: string]: unknown;
};

/**
 * EndNode の型（React Flow Node型）
 */
export type EndNodeType = Node<EndNodeData, 'endNode'>;

/**
 * 終了ノードコンポーネント
 * React Flow上でフローの終点を表現するカスタムノード
 */
export const EndNode = memo(function EndNode({
  data,
  selected,
}: NodeProps<EndNodeType>) {
  return (
    <Card
      className={cn(
        'w-[150px] bg-green-50 dark:bg-green-900/20 transition-shadow',
        selected && 'ring-2 ring-green-500 shadow-lg'
      )}
    >
      {/* 入力ハンドル（終了ノードは入力のみ） */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />

      <CardContent className="p-4 text-center">
        <div className="text-2xl mb-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto text-green-600 dark:text-green-400"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div className="text-sm font-medium text-green-700 dark:text-green-300">
          {data.title || '終了'}
        </div>
      </CardContent>
    </Card>
  );
});
