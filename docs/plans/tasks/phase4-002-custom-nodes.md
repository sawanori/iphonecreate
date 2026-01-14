# タスク: カスタムノード実装

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase4-002 |
| フェーズ | Phase 4: 管理画面 |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

React Flow 用のカスタムノード（VideoNode, ChoiceNode, EndNode）とノードツールバーを作成する。ドラッグ&ドロップとノード間接続の機能を実装する。

---

## 前提条件

### 依存タスク
- phase4-001-reactflow-editor.md（FlowEditor が存在すること）

### 前提成果物
- `src/components/editor/FlowEditor.tsx`
- `src/stores/editorStore.ts`

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/components/editor/VideoNode.tsx` | 新規作成 |
| `src/components/editor/ChoiceNode.tsx` | 新規作成 |
| `src/components/editor/EndNode.tsx` | 新規作成 |
| `src/components/editor/NodeToolbar.tsx` | 新規作成 |
| `src/components/editor/FlowEditor.tsx` | 更新 |
| `src/components/editor/index.ts` | 更新 |

---

## 実装詳細

### ステップ 1: VideoNode コンポーネント作成

`src/components/editor/VideoNode.tsx`:

```typescript
'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * VideoNode のデータ型
 */
export interface VideoNodeData {
  title: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  choices?: Array<{ id: string; text: string }>;
  timeLimit?: number;
}

/**
 * 動画ノードコンポーネント
 */
export const VideoNode = memo(function VideoNode({
  data,
  selected,
}: NodeProps<VideoNodeData>) {
  return (
    <Card
      className={cn(
        'w-[200px] transition-shadow',
        selected && 'ring-2 ring-blue-500 shadow-lg'
      )}
    >
      {/* 入力ハンドル */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />

      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm font-medium truncate">
          {data.title || '動画ノード'}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        {/* サムネイル */}
        {data.thumbnailUrl ? (
          <div className="aspect-video bg-gray-200 rounded overflow-hidden mb-2">
            <img
              src={data.thumbnailUrl}
              alt={data.title}
              className="w-full h-full object-cover"
            />
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

      {/* 出力ハンドル（選択肢ごと） */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </Card>
  );
});
```

### ステップ 2: EndNode コンポーネント作成

`src/components/editor/EndNode.tsx`:

```typescript
'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * EndNode のデータ型
 */
export interface EndNodeData {
  title: string;
}

/**
 * 終了ノードコンポーネント
 */
export const EndNode = memo(function EndNode({
  data,
  selected,
}: NodeProps<EndNodeData>) {
  return (
    <Card
      className={cn(
        'w-[150px] bg-green-50 dark:bg-green-900/20 transition-shadow',
        selected && 'ring-2 ring-green-500 shadow-lg'
      )}
    >
      {/* 入力ハンドル */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />

      <CardContent className="p-4 text-center">
        <div className="text-2xl mb-1">🏁</div>
        <div className="text-sm font-medium text-green-700 dark:text-green-300">
          {data.title || '終了'}
        </div>
      </CardContent>
    </Card>
  );
});
```

### ステップ 3: ChoiceNode コンポーネント作成（オプション）

`src/components/editor/ChoiceNode.tsx`:

```typescript
'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * ChoiceNode のデータ型
 */
export interface ChoiceNodeData {
  text: string;
  order: number;
}

/**
 * 選択肢ノードコンポーネント
 */
export const ChoiceNode = memo(function ChoiceNode({
  data,
  selected,
}: NodeProps<ChoiceNodeData>) {
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
```

### ステップ 4: NodeToolbar コンポーネント作成

`src/components/editor/NodeToolbar.tsx`:

```typescript
'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * NodeToolbar コンポーネントのProps
 */
export interface NodeToolbarProps {
  /** 追加のクラス名 */
  className?: string;
}

/**
 * ノード追加ツールバー
 */
export function NodeToolbar({ className }: NodeToolbarProps) {
  const handleDragStart = (
    event: React.DragEvent,
    nodeType: string
  ) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

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
        <span className="mr-2">🎬</span>
        動画ノード
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="justify-start"
        draggable
        onDragStart={(e) => handleDragStart(e, 'end')}
      >
        <span className="mr-2">🏁</span>
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
```

### ステップ 5: FlowEditor 更新

`src/components/editor/FlowEditor.tsx` を更新:

```typescript
'use client';

import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type Node,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowEditor } from '@/hooks/useFlowEditor';
import { VideoNode } from './VideoNode';
import { EndNode } from './EndNode';
import { ChoiceNode } from './ChoiceNode';
import { NodeToolbar } from './NodeToolbar';
import { cn } from '@/lib/utils';

// カスタムノードタイプを登録
const nodeTypes = {
  videoNode: VideoNode,
  endNode: EndNode,
  choiceNode: ChoiceNode,
};

export interface FlowEditorProps {
  className?: string;
  readOnly?: boolean;
}

export function FlowEditor({ className, readOnly = false }: FlowEditorProps) {
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const {
    nodes,
    edges,
    selectedNodeId,
    isDirty,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addVideoNode,
    addEndNode,
    selectNode,
    deleteNode,
  } = useFlowEditor();

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance.current) return;

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (type === 'video') {
        addVideoNode(position);
      } else if (type === 'end') {
        addEndNode(position);
      }
    },
    [addVideoNode, addEndNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (readOnly) return;

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNodeId) {
          deleteNode(selectedNodeId);
        }
      }
    },
    [readOnly, selectedNodeId, deleteNode]
  );

  return (
    <div
      className={cn('w-full h-full', className)}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        onInit={onInit}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        panOnScroll
        selectionOnDrag
      >
        <Background color="#aaa" gap={16} />
        <Controls showInteractive={!readOnly} />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'videoNode':
                return '#3b82f6';
              case 'endNode':
                return '#10b981';
              case 'choiceNode':
                return '#8b5cf6';
              default:
                return '#6b7280';
            }
          }}
        />

        {/* ツールバー */}
        {!readOnly && (
          <Panel position="top-left">
            <NodeToolbar />
          </Panel>
        )}

        {/* 変更インジケーター */}
        {isDirty && (
          <Panel position="top-right" className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-lg">
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              未保存の変更があります
            </span>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
```

### ステップ 6: インデックスファイル更新

`src/components/editor/index.ts`:

```typescript
export { FlowEditor } from './FlowEditor';
export type { FlowEditorProps } from './FlowEditor';

export { VideoNode } from './VideoNode';
export type { VideoNodeData } from './VideoNode';

export { EndNode } from './EndNode';
export type { EndNodeData } from './EndNode';

export { ChoiceNode } from './ChoiceNode';
export type { ChoiceNodeData } from './ChoiceNode';

export { NodeToolbar } from './NodeToolbar';
export type { NodeToolbarProps } from './NodeToolbar';
```

---

## 完了条件

- [x] VideoNode コンポーネントが作成されている
- [x] EndNode コンポーネントが作成されている
- [x] AC-A-001: フローチャート上でノードをドラッグ&ドロップできる
- [x] AC-A-002: ノード間を線で接続できる
- [x] 選択状態がビジュアルで表示される

---

## テスト方法

### 1. カスタムノードテスト

```bash
npm run dev
# http://localhost:3000/test/editor にアクセス

# 確認項目:
# - ツールバーから動画ノードをドラッグ&ドロップできる
# - ツールバーから終了ノードをドラッグ&ドロップできる
# - ノードをクリックで選択できる
# - 選択時にリングが表示される
```

### 2. 接続テスト

```
1. 動画ノードを2つ追加
2. 1つ目のノードの出力ハンドル（下）から
   2つ目のノードの入力ハンドル（上）にドラッグ
3. エッジ（線）が作成されることを確認
```

### 3. 削除テスト

```
1. ノードを選択
2. Delete キーを押す
3. ノードと関連するエッジが削除されることを確認
```

---

## 参照設計書セクション

- DESIGN-FE-2026-001 セクション5.2: 管理画面コンポーネント

---

## 成果物

- `src/components/editor/VideoNode.tsx`
- `src/components/editor/EndNode.tsx`
- `src/components/editor/ChoiceNode.tsx`
- `src/components/editor/NodeToolbar.tsx`

---

## 次のタスク

- phase4-003-r2-storage.md: R2 ストレージ接続
