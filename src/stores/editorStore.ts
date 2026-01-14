/**
 * エディターストア
 * Zustandを使用したフローエディター状態の管理
 *
 * 対応設計書: DESIGN-FE-2026-001 セクション5.2
 * 対応タスク: phase4-001-reactflow-editor.md
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Node, Edge, Connection, NodeChange, EdgeChange } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

/**
 * エディターストアの状態
 */
export interface EditorStoreState {
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
export interface EditorStoreActions {
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

/**
 * ストアの初期状態
 */
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
    (set) => ({
      ...initialState,

      // ノード操作
      setNodes: (nodes) => set({ nodes, isDirty: true }, false, 'setNodes'),

      onNodesChange: (changes) => {
        // 実際の編集操作のみisDirtyをtrueにする
        // dimensions（初期測定）やselect（選択変更）は編集ではない
        const isActualEdit = changes.some(
          (change) =>
            change.type === 'position' ||
            change.type === 'remove' ||
            change.type === 'add' ||
            change.type === 'replace'
        );

        set(
          (state) => ({
            nodes: applyNodeChanges(changes, state.nodes),
            isDirty: isActualEdit ? true : state.isDirty,
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
                id: crypto.randomUUID(),
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
