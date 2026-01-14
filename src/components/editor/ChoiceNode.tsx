/**
 * ChoiceNode コンポーネント
 * フローチャート内の選択肢ノードを表示
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
 * ChoiceNode のデータ型
 */
export type ChoiceNodeData = {
  /** 選択肢のテキスト */
  text: string;
  /** 表示順序（0から開始） */
  order: number;
  /** インデックスシグネチャ */
  [key: string]: unknown;
};

/**
 * ChoiceNode の型（React Flow Node型）
 */
export type ChoiceNodeType = Node<ChoiceNodeData, 'choiceNode'>;

/**
 * 選択肢ノードコンポーネント
 * React Flow上で動画の分岐選択肢を表現するカスタムノード
 */
export const ChoiceNode = memo(function ChoiceNode({
  data,
  selected,
}: NodeProps<ChoiceNodeType>) {
  return (
    <Card
      className={cn(
        'w-[180px] bg-blue-50 dark:bg-blue-900/20 transition-shadow',
        selected && 'ring-2 ring-blue-500 shadow-lg'
      )}
    >
      {/* 入力ハンドル */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />

      <CardContent className="p-3 text-center">
        <div className="text-xs text-blue-500 mb-1">
          選択肢 {data.order + 1}
        </div>
        <div className="text-sm font-medium truncate">
          {data.text || '選択肢テキスト'}
        </div>
      </CardContent>

      {/* 出力ハンドル */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </Card>
  );
});
