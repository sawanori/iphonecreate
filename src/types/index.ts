/**
 * 型定義のエントリーポイント
 */

// 動画関連
export type {
  VideoNodeType,
  VideoProject,
  VideoData,
  VideoNode,
  Choice,
  VideoPlayerState,
  VideoLoadingState,
  VideoMetadata,
} from './video';

// 分岐関連
export type {
  VideoNodeData,
  ChoiceNodeData,
  EndNodeData,
  BranchNode,
  BranchData,
  BranchEdge,
  FlowNode,
  FlowEdge,
  FlowData,
  FlowVideoNodeData,
  FlowChoiceNodeData,
  FlowEndNodeData,
  BranchTransitionEvent,
  BranchConfig,
} from './branch';

// ユーザー関連
export type {
  UserRole,
  User,
  Session,
  AuthStatus,
  LoginRequest,
  LoginResponse,
  PermissionCheck,
} from './user';

// 進捗関連
export type {
  ProgressStatus,
  UserProgress,
  ChoiceRecord,
  ProgressSummary,
  AnalyticsData,
  ChoiceStats,
} from './progress';

// API関連
export type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginationParams,
  PaginationMeta,
  VideoProjectListResponse,
  VideoProjectDetailResponse,
  UploadUrlRequest,
  UploadUrlResponse,
  UploadCompleteRequest,
  UploadCompleteResponse,
  SaveBranchConfigRequest,
  RecordProgressRequest,
  RecordChoiceRequest,
  ProgressListResponse,
  ProgressDetailResponse,
  AnalyticsResponse,
} from './api';
