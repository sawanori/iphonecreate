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
            <NodeToolbar isMobile={isMobile} />
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
