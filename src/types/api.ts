/**
 * API関連の型定義
 * 対応設計書: DESIGN-BE-2026-001 セクション5
 */

import type { User } from './user';
import type { VideoProject, VideoNode } from './video';
import type { BranchConfig, Choice } from './branch';
import type { UserProgress, ChoiceRecord, AnalyticsData } from './progress';

/**
 * APIレスポンスの再エクスポート
 */
export type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
} from '@/lib/utils/api-response';

/**
 * ページネーションパラメータ
 */
export type PaginationParams = {
  /** ページ番号 */
  page: number;
  /** 1ページあたりの件数 */
  limit: number;
};

/**
 * ページネーションメタ
 */
export type PaginationMeta = {
  /** ページ番号 */
  page: number;
  /** 1ページあたりの件数 */
  limit: number;
  /** 総件数 */
  total: number;
  /** 総ページ数 */
  totalPages: number;
};

/**
 * 動画プロジェクト一覧レスポンス
 */
export type VideoProjectListResponse = {
  /** プロジェクト一覧 */
  projects: VideoProject[];
  /** ページネーションメタ */
  meta: PaginationMeta;
};

/**
 * 動画プロジェクト詳細レスポンス
 */
export type VideoProjectDetailResponse = {
  /** プロジェクト */
  project: VideoProject;
  /** ノード一覧 */
  nodes: VideoNode[];
  /** 分岐設定一覧 */
  branchConfigs: BranchConfig[];
};

/**
 * 動画アップロードURLリクエスト
 */
export type UploadUrlRequest = {
  /** ファイル名 */
  filename: string;
  /** コンテンツタイプ */
  contentType: string;
  /** ファイルサイズ（バイト） */
  size: number;
};

/**
 * 動画アップロードURLレスポンス
 */
export type UploadUrlResponse = {
  /** アップロードURL */
  uploadUrl: string;
  /** ファイルキー */
  fileKey: string;
  /** 有効期限 */
  expiresAt: string;
};

/**
 * 動画アップロード完了リクエスト
 */
export type UploadCompleteRequest = {
  /** ファイルキー */
  fileKey: string;
  /** プロジェクトID（オプション） */
  projectId?: string;
};

/**
 * 動画アップロード完了レスポンス
 */
export type UploadCompleteResponse = {
  /** 動画URL */
  videoUrl: string;
  /** サムネイルURL */
  thumbnailUrl?: string;
  /** メタデータ */
  metadata: {
    /** 動画の長さ（秒） */
    duration: number;
    /** 幅（ピクセル） */
    width: number;
    /** 高さ（ピクセル） */
    height: number;
  };
};

/**
 * 分岐設定保存リクエスト
 */
export type SaveBranchConfigRequest = {
  /** ノードID */
  nodeId: string;
  /** 選択肢一覧（IDなし） */
  choices: Omit<Choice, 'id'>[];
  /** 制限時間（秒） */
  timeLimit: number;
  /** タイムアウト時のデフォルト選択肢ID */
  defaultChoiceId: string | null;
};

/**
 * 進捗記録リクエスト
 */
export type RecordProgressRequest = {
  /** プロジェクトID */
  projectId: string;
  /** 現在のノードID */
  currentNodeId: string;
  /** 視聴時間（秒） */
  watchTime: number;
};

/**
 * 選択履歴記録リクエスト
 */
export type RecordChoiceRequest = {
  /** 進捗ID */
  progressId: string;
  /** ノードID */
  nodeId: string;
  /** 選択肢ID */
  choiceId: string;
  /** 回答時間（秒） */
  responseTime: number;
  /** タイムアウトによる選択か */
  isTimeout: boolean;
};

/**
 * 進捗一覧レスポンス
 */
export type ProgressListResponse = {
  /** 進捗一覧 */
  progress: UserProgress[];
  /** ページネーションメタ */
  meta: PaginationMeta;
};

/**
 * 進捗詳細レスポンス
 */
export type ProgressDetailResponse = {
  /** 進捗 */
  progress: UserProgress;
  /** 選択履歴 */
  history: ChoiceRecord[];
};

/**
 * 分析データレスポンス
 */
export type AnalyticsResponse = {
  /** 分析データ */
  analytics: AnalyticsData;
};

// 使用される型を明示的に記載（未使用警告を回避）
export type { User, VideoProject, VideoNode, BranchConfig, Choice, UserProgress, ChoiceRecord, AnalyticsData };
