/**
 * 進捗関連の型定義
 * 対応設計書: DESIGN-FE-2026-001 セクション9
 */

/**
 * 進捗ステータス
 */
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

/**
 * ユーザー進捗
 */
export type UserProgress = {
  /** ユーザーID */
  userId: string;
  /** 動画ID */
  videoId: string;
  /** ステータス */
  status: ProgressStatus;
  /** 現在のノードID */
  currentNodeId: string | null;
  /** 視聴済みノードID一覧 */
  watchedNodeIds: string[];
  /** 選択履歴 */
  choiceHistory: ChoiceRecord[];
  /** 総視聴時間（秒） */
  totalWatchTime: number;
  /** 開始日時 */
  startedAt: string | null;
  /** 完了日時 */
  completedAt: string | null;
  /** 最終アクセス日時 */
  lastAccessedAt: string;
};

/**
 * 選択履歴
 */
export type ChoiceRecord = {
  /** ノードID */
  nodeId: string;
  /** 選択した選択肢ID */
  choiceId: string;
  /** 選択日時 */
  selectedAt: string;
  /** 選択にかかった時間（秒） */
  timeSpent: number;
  /** タイムアウトによる選択か */
  isTimeout: boolean;
};

/**
 * 進捗サマリー（管理者ダッシュボード用）
 */
export type ProgressSummary = {
  /** 総ユーザー数 */
  totalUsers: number;
  /** 完了ユーザー数 */
  completedUsers: number;
  /** 進行中ユーザー数 */
  inProgressUsers: number;
  /** 未開始ユーザー数 */
  notStartedUsers: number;
  /** 平均視聴時間（秒） */
  averageWatchTime: number;
  /** 完了率（0-100） */
  completionRate: number;
};

/**
 * 分析データ
 */
export type AnalyticsData = {
  /** プロジェクトID */
  projectId: string;
  /** 総視聴回数 */
  totalViews: number;
  /** 完了率 */
  completionRate: number;
  /** 平均視聴時間（秒） */
  averageWatchTime: number;
  /** 選択肢別統計 */
  choiceStats: ChoiceStats[];
};

/**
 * 選択肢統計
 */
export type ChoiceStats = {
  /** ノードID */
  nodeId: string;
  /** 選択肢ID */
  choiceId: string;
  /** 選択肢テキスト */
  choiceText: string;
  /** 選択回数 */
  selectCount: number;
  /** 選択率（0-100） */
  selectRate: number;
  /** 平均回答時間（秒） */
  averageResponseTime: number;
};
