/**
 * サービスエントリーポイント
 * 対応設計書: DESIGN-BE-2026-001 セクション5.3, 5.4
 */

// 動画プロジェクトサービス
export {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectWithData,
} from './video.service';

// 分岐・ノードサービス
export {
  createNode,
  getNode,
  updateNode,
  deleteNode,
  saveChoices,
  getChoices,
  saveBranchConfig,
  getBranchConfig,
  deleteBranchConfig,
  saveEdges,
  getEdges,
} from './branch.service';

// 進捗サービス
export {
  getUserProgressList,
  getProgressByProject,
  getOrCreateProgress,
  updateProgress,
  startWatching,
  completeWatching,
  addWatchTime,
  getProgressSummary,
} from './progress.service';

// 選択履歴サービス
export {
  recordChoice,
  getChoiceHistoryByProgress,
  getChoiceStatsByNode,
  getUserChoicePattern,
} from './choice-history.service';

// 分析サービス
export {
  getOverallAnalytics,
  getProjectAnalytics,
  getChoiceTrends,
  type OverallAnalyticsResult,
  type ProjectAnalyticsResult,
  type NodeAnalyticsResult,
  type ChoiceTrendResult,
} from './analytics.service';
