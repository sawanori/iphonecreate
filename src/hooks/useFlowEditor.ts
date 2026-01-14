/**
 * フローエディターフック
 * フローエディターの操作ロジックを提供
 *
 * 対応設計書: DESIGN-FE-2026-001 セクション8.3
 * 対応タスク: phase4-001-reactflow-editor.md
 */

import { useCallback } from 'react';
import type { Node, Edge, Connection, NodeChange, EdgeChange } from '@xyflow/react';
import { useEditorStore } from '@/stores/editorStore';

/**
 * useFlowEditor フックの戻り値
 */
export interface UseFlowEditorReturn {
  /** ノード一覧 */
  nodes: Node[];
  /** エッジ一覧 */
  edges: Edge[];
  /** 選択中のノードID */
  selectedNodeId: string | null;
  /** 変更があるかどうか */
  isDirty: boolean;
  /** ノード変更ハンドラー */
  onNodesChange: (changes: NodeChange[]) => void;
  /** エッジ変更ハンドラー */
  onEdgesChange: (changes: EdgeChange[]) => void;
  /** 接続ハンドラー */
  onConnect: (connection: Connection) => void;
  /** 動画ノード追加 */
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
      const id = crypto.randomUUID();
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
      const id = crypto.randomUUID();
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
