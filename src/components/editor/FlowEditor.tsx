/**
 * フローエディターコンポーネント
 * React Flowを使用したフローチャートエディター
 *
 * 対応設計書: DESIGN-FE-2026-001 セクション5.2
 * 対応タスク: phase4-001-reactflow-editor.md, phase4-002-custom-nodes.md
 */

'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    deleteEdge,
  } = useFlowEditor();

  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

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
    setSelectedEdgeId(null);
  }, [selectNode]);

  // エッジクリック（選択 → 削除確認）
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: { id: string }) => {
      if (readOnly) return;

      // モバイルの場合は確認ダイアログを表示
      if (isMobile) {
        if (window.confirm('この接続を削除しますか？')) {
          deleteEdge(edge.id);
        }
      } else {
        // デスクトップはエッジを選択（Delete/Backspaceで削除）
        setSelectedEdgeId(edge.id);
        selectNode(null);
      }
    },
    [readOnly, isMobile, deleteEdge, selectNode]
  );

  // モバイル用：クリックでノード追加（ビューポート中央付近にランダム配置）
  const handleAddVideoNodeClick = useCallback(() => {
    if (!reactFlowInstance.current) return;
    const position = reactFlowInstance.current.screenToFlowPosition({
      x: window.innerWidth / 2 + Math.random() * 100 - 50,
      y: window.innerHeight / 2 + Math.random() * 100 - 50,
    });
    addVideoNode(position);
  }, [addVideoNode]);

  const handleAddEndNodeClick = useCallback(() => {
    if (!reactFlowInstance.current) return;
    const position = reactFlowInstance.current.screenToFlowPosition({
      x: window.innerWidth / 2 + Math.random() * 100 - 50,
      y: window.innerHeight / 2 + Math.random() * 100 - 50,
    });
    addEndNode(position);
  }, [addEndNode]);

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
        } else if (selectedEdgeId) {
          deleteEdge(selectedEdgeId);
          setSelectedEdgeId(null);
        }
      }
    },
    [readOnly, selectedNodeId, selectedEdgeId, deleteNode, deleteEdge]
  );

  // readOnly時は変更ハンドラーを無効化
  const editableProps = readOnly
    ? {}
    : {
        onNodesChange,
        onEdgesChange,
        onConnect,
      };

  return (
    <div
      className={cn('w-full h-full', className)}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        {...editableProps}
        onInit={onInit}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
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
        edgesFocusable={!readOnly}
        panOnScroll={!isMobile}
        panOnDrag={isMobile}
        selectionOnDrag={!isMobile}
        zoomOnPinch
        zoomOnDoubleClick={false}
      >
        <Background color="#aaa" gap={16} />
        <Controls showInteractive={!readOnly} position={isMobile ? 'bottom-right' : 'bottom-left'} />
        {!isMobile && (
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
        )}

        {/* ツールバー */}
        {!readOnly && (
          <Panel position="top-left">
            <NodeToolbar
              isMobile={isMobile}
              onAddVideoNode={handleAddVideoNodeClick}
              onAddEndNode={handleAddEndNodeClick}
            />
          </Panel>
        )}

        {/* 変更インジケーター */}
        {isDirty && !isMobile && (
          <Panel
            position="top-right"
            className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-lg"
          >
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              未保存の変更があります
            </span>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
