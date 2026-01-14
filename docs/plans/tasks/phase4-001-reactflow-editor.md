# タスク: React Flow エディタ基盤

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase4-001 |
| フェーズ | Phase 4: 管理画面 |
| 作成日 | 2026-01-14 |
| 想定工数 | 2日 |
| 検証レベル | L1（単体） |

---

## 概要

React Flow をインストールし、フローチャートエディタの基盤コンポーネントを作成する。ノードの追加・削除・移動、ズーム・パン操作の基本機能を実装する。

---

## 前提条件

### 依存タスク
- phase3-completion.md（Phase 3 が完了していること）

### 前提成果物
- 認証機能（AdminGuard）
- 型定義ファイル（`src/types/branch.ts`）

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/components/editor/FlowEditor.tsx` | 新規作成 |
| `src/components/editor/index.ts` | 新規作成 |
| `src/hooks/useFlowEditor.ts` | 新規作成 |
| `src/stores/editorStore.ts` | 新規作成 |

---

## 実装詳細

### ステップ 1: React Flow インストール

```bash
npm install @xyflow/react
```

### ステップ 2: editorStore 作成

`src/stores/editorStore.ts`:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Node, Edge, Connection, NodeChange, EdgeChange } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

/**
 * エディターストアの状態
 */
interface EditorStoreState {
  /** ノード一覧 */
  nodes: Node[];
  /** エッジ一覧 */
  edges: Edge[];
  /** 選択中のノードID */
  selectedNodeId: string | null;
  /** プロジェクトID */
  projectId: string | null;
  /** 変更があるかどうか */
  isDirty: boolean;
  /** 保存中かどうか */
  isSaving: boolean;
}

/**
 * エディターストアのアクション
 */
interface EditorStoreActions {
  // ノード操作
  setNodes: (nodes: Node[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, data: Partial<Node['data']>) => void;
  removeNode: (id: string) => void;

  // エッジ操作
  setEdges: (edges: Edge[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  removeEdge: (id: string) => void;

  // 選択
  setSelectedNodeId: (id: string | null) => void;

  // プロジェクト
  setProjectId: (id: string | null) => void;
  setIsDirty: (isDirty: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;

  // 初期化・リセット
  initializeEditor: (projectId: string, nodes: Node[], edges: Edge[]) => void;
  reset: () => void;
}

const initialState: EditorStoreState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  projectId: null,
  isDirty: false,
  isSaving: false,
};

/**
 * エディターストア
 */
export const useEditorStore = create<EditorStoreState & EditorStoreActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ノード操作
      setNodes: (nodes) => set({ nodes, isDirty: true }, false, 'setNodes'),

      onNodesChange: (changes) => {
        set(
          (state) => ({
            nodes: applyNodeChanges(changes, state.nodes),
            isDirty: true,
          }),
          false,
          'onNodesChange'
        );
      },

      addNode: (node) => {
        set(
          (state) => ({
            nodes: [...state.nodes, node],
            isDirty: true,
          }),
          false,
          'addNode'
        );
      },

      updateNode: (id, data) => {
        set(
          (state) => ({
            nodes: state.nodes.map((node) =>
              node.id === id
                ? { ...node, data: { ...node.data, ...data } }
                : node
            ),
            isDirty: true,
          }),
          false,
          'updateNode'
        );
      },

      removeNode: (id) => {
        set(
          (state) => ({
            nodes: state.nodes.filter((node) => node.id !== id),
            edges: state.edges.filter(
              (edge) => edge.source !== id && edge.target !== id
            ),
            selectedNodeId:
              state.selectedNodeId === id ? null : state.selectedNodeId,
            isDirty: true,
          }),
          false,
          'removeNode'
        );
      },

      // エッジ操作
      setEdges: (edges) => set({ edges, isDirty: true }, false, 'setEdges'),

      onEdgesChange: (changes) => {
        set(
          (state) => ({
            edges: applyEdgeChanges(changes, state.edges),
            isDirty: true,
          }),
          false,
          'onEdgesChange'
        );
      },

      onConnect: (connection) => {
        set(
          (state) => ({
            edges: addEdge(
              {
                ...connection,
                id: `edge-${connection.source}-${connection.target}`,
                type: 'smoothstep',
              },
              state.edges
            ),
            isDirty: true,
          }),
          false,
          'onConnect'
        );
      },

      removeEdge: (id) => {
        set(
          (state) => ({
            edges: state.edges.filter((edge) => edge.id !== id),
            isDirty: true,
          }),
          false,
          'removeEdge'
        );
      },

      // 選択
      setSelectedNodeId: (id) =>
        set({ selectedNodeId: id }, false, 'setSelectedNodeId'),

      // プロジェクト
      setProjectId: (id) => set({ projectId: id }, false, 'setProjectId'),
      setIsDirty: (isDirty) => set({ isDirty }, false, 'setIsDirty'),
      setIsSaving: (isSaving) => set({ isSaving }, false, 'setIsSaving'),

      // 初期化
      initializeEditor: (projectId, nodes, edges) => {
        set(
          {
            projectId,
            nodes,
            edges,
            selectedNodeId: null,
            isDirty: false,
            isSaving: false,
          },
          false,
          'initializeEditor'
        );
      },

      // リセット
      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'editor-store' }
  )
);
```

### ステップ 3: useFlowEditor フック作成

`src/hooks/useFlowEditor.ts`:

```typescript
import { useCallback } from 'react';
import type { Node, Connection } from '@xyflow/react';
import { useEditorStore } from '@/stores/editorStore';

/**
 * useFlowEditor フックの戻り値
 */
export interface UseFlowEditorReturn {
  /** ノード一覧 */
  nodes: Node[];
  /** エッジ一覧 */
  edges: ReturnType<typeof useEditorStore>['edges'];
  /** 選択中のノードID */
  selectedNodeId: string | null;
  /** 変更があるかどうか */
  isDirty: boolean;
  /** ノード変更ハンドラー */
  onNodesChange: ReturnType<typeof useEditorStore>['onNodesChange'];
  /** エッジ変更ハンドラー */
  onEdgesChange: ReturnType<typeof useEditorStore>['onEdgesChange'];
  /** 接続ハンドラー */
  onConnect: (connection: Connection) => void;
  /** ノード追加 */
  addVideoNode: (position: { x: number; y: number }) => void;
  /** 終了ノード追加 */
  addEndNode: (position: { x: number; y: number }) => void;
  /** ノード選択 */
  selectNode: (id: string | null) => void;
  /** ノード削除 */
  deleteNode: (id: string) => void;
  /** エッジ削除 */
  deleteEdge: (id: string) => void;
}

/**
 * フローエディタのロジックをまとめたフック
 */
export function useFlowEditor(): UseFlowEditorReturn {
  const {
    nodes,
    edges,
    selectedNodeId,
    isDirty,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    removeNode,
    removeEdge,
    setSelectedNodeId,
  } = useEditorStore();

  // 動画ノードを追加
  const addVideoNode = useCallback(
    (position: { x: number; y: number }) => {
      const id = `node-${Date.now()}`;
      const newNode: Node = {
        id,
        type: 'videoNode',
        position,
        data: {
          title: '新しい動画',
          videoUrl: '',
          thumbnailUrl: '',
          choices: [],
          timeLimit: 15,
        },
      };
      addNode(newNode);
      setSelectedNodeId(id);
    },
    [addNode, setSelectedNodeId]
  );

  // 終了ノードを追加
  const addEndNode = useCallback(
    (position: { x: number; y: number }) => {
      const id = `end-${Date.now()}`;
      const newNode: Node = {
        id,
        type: 'endNode',
        position,
        data: {
          title: '終了',
        },
      };
      addNode(newNode);
    },
    [addNode]
  );

  // ノード選択
  const selectNode = useCallback(
    (id: string | null) => {
      setSelectedNodeId(id);
    },
    [setSelectedNodeId]
  );

  // ノード削除
  const deleteNode = useCallback(
    (id: string) => {
      removeNode(id);
    },
    [removeNode]
  );

  // エッジ削除
  const deleteEdge = useCallback(
    (id: string) => {
      removeEdge(id);
    },
    [removeEdge]
  );

  return {
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
    deleteEdge,
  };
}
```

### ステップ 4: FlowEditor コンポーネント作成

`src/components/editor/FlowEditor.tsx`:

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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// カスタムノードタイプ（後続タスクで実装）
const nodeTypes = {
  // videoNode: VideoNode,
  // endNode: EndNode,
};

/**
 * FlowEditor コンポーネントのProps
 */
export interface FlowEditorProps {
  /** 追加のクラス名 */
  className?: string;
  /** 読み取り専用モード */
  readOnly?: boolean;
}

/**
 * フローチャートエディタコンポーネント
 */
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

  // ReactFlow インスタンスを保存
  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  // ノードクリック
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // ペーンクリック（選択解除）
  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // ドロップでノード追加
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

  // ドラッグオーバー
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // キーボードショートカット
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
              default:
                return '#6b7280';
            }
          }}
        />

        {/* ツールバー */}
        {!readOnly && (
          <Panel position="top-left" className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/reactflow', 'video');
                }}
              >
                動画ノード
              </Button>
              <Button
                size="sm"
                variant="outline"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/reactflow', 'end');
                }}
              >
                終了ノード
              </Button>
            </div>
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

### ステップ 5: インデックスファイル作成

`src/components/editor/index.ts`:

```typescript
export { FlowEditor } from './FlowEditor';
export type { FlowEditorProps } from './FlowEditor';
```

---

## 完了条件

- [x] React Flow がインストールされている
- [x] FlowEditor コンポーネントが作成されている
- [x] ノード追加・削除・移動が動作する
- [x] ズーム・パン操作が動作する
- [x] editorStore で状態管理ができている

---

## テスト方法

### 1. エディタ表示テスト

`src/app/test/editor/page.tsx`:

```typescript
'use client';

import { FlowEditor } from '@/components/editor';

export default function EditorTestPage() {
  return (
    <div className="h-screen">
      <FlowEditor />
    </div>
  );
}
```

### 2. 動作確認

```bash
npm run dev
# http://localhost:3000/test/editor にアクセス

# 確認項目:
# - エディタが表示される
# - ズーム（マウスホイール）が動作する
# - パン（ドラッグ）が動作する
# - ノードをドロップで追加できる
# - ノードをドラッグで移動できる
```

---

## 参照設計書セクション

- DESIGN-FE-2026-001 セクション5.2: 管理画面コンポーネント
- DESIGN-FE-2026-001 セクション8.3: エディタ操作

---

## 成果物

- `src/components/editor/FlowEditor.tsx`: フローエディタコンポーネント
- `src/hooks/useFlowEditor.ts`: エディタロジックフック
- `src/stores/editorStore.ts`: エディタ状態ストア

---

## 次のタスク

- phase4-002-custom-nodes.md: カスタムノード実装
