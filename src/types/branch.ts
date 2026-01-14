/**
 * 分岐関連の型定義
 * 対応設計書: DESIGN-FE-2026-001 セクション9
 */

import type { Choice } from './video';

/**
 * 動画ノードデータ（分岐ノード用）
 */
export type VideoNodeData = {
  /** 動画URL */
  videoUrl: string;
  /** サムネイルURL */
  thumbnailUrl?: string;
  /** 動画の長さ（秒）- 未設定時はnull */
  duration: number | null;
  /** 選択肢が表示される時間（秒）- 終了ノードではnull */
  choiceTimestamp: number | null;
  /** 制限時間（秒） */
  timeLimit: number;
};

/**
 * 選択肢ノードデータ（分岐ノード用）
 */
export type ChoiceNodeData = {
  /** 選択肢一覧 */
  choices: Choice[];
  /** 制限時間（秒） */
  timeLimit: number;
};

/**
 * 終了ノードデータ（分岐ノード用）
 */
export type EndNodeData = {
  /** 終了メッセージ */
  message?: string;
};

/**
 * 分岐ノード（汎用）
 */
export type BranchNode = {
  /** ノードID */
  id: string;
  /** ノードタイプ */
  type: 'video' | 'choice' | 'end';
  /** ラベル */
  label: string;
  /** 座標 */
  position: { x: number; y: number };
  /** ノードデータ */
  data: VideoNodeData | ChoiceNodeData | EndNodeData;
};

/**
 * 分岐データ
 */
export type BranchData = {
  /** 動画ID */
  videoId: string;
  /** ノード一覧 */
  nodes: BranchNode[];
  /** エッジ一覧 */
  edges: BranchEdge[];
};

/**
 * 分岐エッジ
 */
export type BranchEdge = {
  /** エッジID */
  id: string;
  /** 元ノードID */
  sourceNodeId: string;
  /** 先ノードID */
  targetNodeId: string;
  /** 対応する選択肢ID */
  choiceId: string;
};

/**
 * React Flow ノードの基本型（@xyflow/reactがインストールされるまでの代替）
 */
export type FlowNode<T = Record<string, unknown>> = {
  /** ノードID */
  id: string;
  /** ノードタイプ */
  type?: string;
  /** 座標 */
  position: { x: number; y: number };
  /** ノードデータ */
  data: T;
};

/**
 * React Flow エッジの基本型（@xyflow/reactがインストールされるまでの代替）
 */
export type FlowEdge = {
  /** エッジID */
  id: string;
  /** 元ノードID */
  source: string;
  /** 先ノードID */
  target: string;
  /** ソースハンドルID */
  sourceHandle?: string | null;
  /** ターゲットハンドルID */
  targetHandle?: string | null;
  /** エッジタイプ */
  type?: string;
};

/**
 * フローデータ（React Flow用）
 */
export type FlowData = {
  /** ノード一覧 */
  nodes: FlowNode[];
  /** エッジ一覧 */
  edges: FlowEdge[];
};

/**
 * 動画ノードデータ（React Flow UI用）
 */
export type FlowVideoNodeData = {
  /** ラベル */
  label: string;
  /** 動画URL */
  videoUrl: string;
  /** サムネイルURL */
  thumbnailUrl: string;
  /** 動画の長さ（秒） */
  duration?: number | null;
  /** 選択肢が表示される時間（秒） */
  choiceTimestamp?: number | null;
  /** 編集コールバック */
  onEdit: () => void;
};

/**
 * 選択肢ノードデータ（React Flow UI用）
 */
export type FlowChoiceNodeData = {
  /** ラベル */
  label: string;
  /** 選択肢一覧 */
  choices: Choice[];
  /** 制限時間（秒） */
  timeLimit: number;
};

/**
 * 終了ノードデータ（React Flow UI用）
 */
export type FlowEndNodeData = {
  /** ラベル */
  label: string;
  /** 終了メッセージ */
  message?: string;
};

/**
 * 分岐遷移イベント
 */
export type BranchTransitionEvent = {
  /** 元ノードID */
  fromNodeId: string;
  /** 先ノードID */
  toNodeId: string;
  /** 選択された選択肢ID */
  selectedChoiceId: string;
  /** タイムアウトによる遷移かどうか */
  isTimeout: boolean;
  /** 遷移時刻 */
  timestamp: string;
};

/**
 * 分岐設定
 */
export type BranchConfig = {
  /** ノードID */
  nodeId: string;
  /** 選択肢一覧 */
  choices: Choice[];
  /** 制限時間（秒） */
  timeLimit: number;
  /** タイムアウト時のデフォルト選択肢ID（nullの場合は一時停止） */
  defaultChoiceId: string | null;
};

// Choiceを再エクスポート（video.tsで定義済み）
export type { Choice } from './video';
