/**
 * VideoNode コンポーネント
 * フローチャート内の動画ノードを表示
 *
 * 対応設計書: DESIGN-FE-2026-001 セクション5.2
 * 対応タスク: phase4-002-custom-nodes.md
 */

'use client';

import { memo } from 'react';
import Image from 'next/image';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * VideoNode のデータ型
 */
export type VideoNodeData = {
  /** ノードのタイトル */
  title: string;
  /** 動画URL */
  videoUrl?: string;
  /** サムネイルURL */
  thumbnailUrl?: string;
  /** 選択肢リスト */
  choices?: Array<{ id: string; text: string }>;
  /** 制限時間（秒） */
  timeLimit?: number;
  /** インデックスシグネチャ */
  [key: string]: unknown;
};

/**
 * VideoNode の型（React Flow Node型）
 */
export type VideoNodeType = Node<VideoNodeData, 'videoNode'>;

/**
 * 動画ノードコンポーネント
 * React Flow上で動画コンテンツを表現するカスタムノード
 */
export const VideoNode = memo(function VideoNode({
  data,
  selected,
}: NodeProps<VideoNodeType>) {
  return (
    <Card
      className={cn(
        'w-[200px] transition-shadow',
        selected && 'ring-2 ring-[oklch(0.45_0.15_165)] shadow-lg'
      )}
    >
      {/* 入力ハンドル */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-[oklch(0.80_0.12_165)] border-2 border-white"
      />

      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm font-medium truncate">
          {data.title || '動画ノード'}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        {/* サムネイル/動画プレビュー */}
        {data.thumbnailUrl ? (
          <div className="aspect-video bg-gray-200 rounded overflow-hidden mb-2 relative">
            <Image
              src={data.thumbnailUrl}
              alt={data.title}
              fill
              sizes="200px"
              className="object-cover"
            />
          </div>
        ) : data.videoUrl ? (
          <div className="aspect-video bg-[oklch(0.92_0.08_165)] rounded flex items-center justify-center mb-2">
            <div className="text-center">
              <svg
                className="w-8 h-8 mx-auto text-[oklch(0.45_0.15_165)] mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-[oklch(0.35_0.12_165)] text-xs">動画アップロード済み</span>
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-gray-200 rounded flex items-center justify-center mb-2">
            <span className="text-gray-400 text-xs">サムネイルなし</span>
          </div>
        )}

        {/* 選択肢情報 */}
        {data.choices && data.choices.length > 0 && (
          <div className="text-xs text-gray-500">
            選択肢: {data.choices.length}個
          </div>
        )}

        {/* 制限時間 */}
        {data.timeLimit && (
          <div className="text-xs text-gray-500">
            制限時間: {data.timeLimit}秒
          </div>
        )}
      </CardContent>

      {/* 出力ハンドル */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-[oklch(0.45_0.15_165)] border-2 border-white"
      />
    </Card>
  );
});
