# タスク: 型定義ファイル作成

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase1-005 |
| フェーズ | Phase 1: プロジェクト基盤 |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

動画、分岐、ユーザー、進捗、APIレスポンスに関する型定義ファイルを作成する。設計書の型定義と一致させ、プロジェクト全体で使用する。

---

## 前提条件

### 依存タスク
- phase1-004-utils.md（APIレスポンス型が定義されていること）

### 前提成果物
- `src/lib/utils/api-response.ts` が存在すること

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/types/video.ts` | 新規作成 |
| `src/types/branch.ts` | 新規作成 |
| `src/types/user.ts` | 新規作成 |
| `src/types/progress.ts` | 新規作成 |
| `src/types/api.ts` | 新規作成 |
| `src/types/index.ts` | 新規作成 |

---

## 実装詳細

### ステップ 1: 動画関連型定義

`src/types/video.ts`:

```typescript
/**
 * 動画関連の型定義
 * 対応設計書: DESIGN-FE-2026-001 セクション9
 */

/**
 * 動画ノードの種類
 */
export type VideoNodeType = 'video' | 'choice' | 'end';

/**
 * 動画ノードの基本情報
 */
export interface VideoNode {
  /** ノードID */
  id: string;
  /** ノードタイプ */
  type: VideoNodeType;
  /** 動画URL */
  videoUrl: string;
  /** サムネイルURL */
  thumbnailUrl?: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** 選択肢が表示される時間（秒） */
  choiceDisplayTime?: number;
  /** 動画の長さ（秒） */
  duration?: number;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * 動画プロジェクト
 */
export interface VideoProject {
  /** プロジェクトID */
  id: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** サムネイルURL */
  thumbnailUrl?: string;
  /** 開始ノードID */
  startNodeId: string;
  /** 公開状態 */
  isPublished: boolean;
  /** 作成者ID */
  createdBy: string;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * 動画プレイヤーの状態
 */
export interface VideoPlayerState {
  /** 現在のノードID */
  currentNodeId: string;
  /** 再生中かどうか */
  isPlaying: boolean;
  /** 選択肢表示中かどうか */
  isChoiceVisible: boolean;
  /** 遷移中かどうか */
  isTransitioning: boolean;
  /** 現在の再生位置（秒） */
  currentTime: number;
  /** 動画の長さ（秒） */
  duration: number;
  /** 音量（0-1） */
  volume: number;
  /** ミュート状態 */
  isMuted: boolean;
}

/**
 * 動画読み込み状態
 */
export type VideoLoadingState = 'idle' | 'loading' | 'ready' | 'error';

/**
 * 動画メタデータ
 */
export interface VideoMetadata {
  /** ファイル名 */
  filename: string;
  /** MIMEタイプ */
  mimeType: string;
  /** ファイルサイズ（バイト） */
  size: number;
  /** 動画の長さ（秒） */
  duration: number;
  /** 幅（ピクセル） */
  width: number;
  /** 高さ（ピクセル） */
  height: number;
}
```

### ステップ 2: 分岐関連型定義

`src/types/branch.ts`:

```typescript
/**
 * 分岐関連の型定義
 * 対応設計書: DESIGN-FE-2026-001 セクション9
 */

/**
 * 選択肢
 */
export interface Choice {
  /** 選択肢ID */
  id: string;
  /** 選択肢テキスト */
  text: string;
  /** 遷移先ノードID */
  targetNodeId: string;
  /** 表示順序 */
  order: number;
}

/**
 * 分岐設定
 */
export interface BranchConfig {
  /** ノードID */
  nodeId: string;
  /** 選択肢一覧 */
  choices: Choice[];
  /** 制限時間（秒） */
  timeLimit: number;
  /** タイムアウト時のデフォルト選択肢ID（nullの場合は一時停止） */
  defaultChoiceId: string | null;
}

/**
 * 分岐エッジ（ノード間の接続）
 */
export interface BranchEdge {
  /** エッジID */
  id: string;
  /** 元ノードID */
  sourceNodeId: string;
  /** 先ノードID */
  targetNodeId: string;
  /** 対応する選択肢ID */
  choiceId: string;
}

/**
 * フローチャートデータ
 */
export interface FlowchartData {
  /** プロジェクトID */
  projectId: string;
  /** ノード一覧 */
  nodes: VideoNodePosition[];
  /** エッジ一覧 */
  edges: BranchEdge[];
}

/**
 * ノード位置情報（React Flow用）
 */
export interface VideoNodePosition {
  /** ノードID */
  id: string;
  /** ノードタイプ */
  type: string;
  /** X座標 */
  x: number;
  /** Y座標 */
  y: number;
  /** ノードデータ */
  data: {
    title: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    choices?: Choice[];
    timeLimit?: number;
  };
}

/**
 * 分岐遷移イベント
 */
export interface BranchTransitionEvent {
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
}
```

### ステップ 3: ユーザー関連型定義

`src/types/user.ts`:

```typescript
/**
 * ユーザー関連の型定義
 * 対応設計書: DESIGN-FE-2026-001 セクション9
 */

/**
 * ユーザーロール
 */
export type UserRole = 'admin' | 'viewer';

/**
 * ユーザー情報
 */
export interface User {
  /** ユーザーID */
  id: string;
  /** メールアドレス */
  email: string;
  /** 表示名 */
  name: string;
  /** ロール */
  role: UserRole;
  /** プロフィール画像URL */
  avatarUrl?: string;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * セッション情報
 */
export interface Session {
  /** ユーザー情報 */
  user: User;
  /** セッション有効期限 */
  expires: string;
}

/**
 * 認証状態
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * ログインリクエスト
 */
export interface LoginRequest {
  /** メールアドレス */
  email: string;
  /** パスワード */
  password: string;
}

/**
 * ログインレスポンス
 */
export interface LoginResponse {
  /** ユーザー情報 */
  user: User;
  /** アクセストークン */
  accessToken: string;
}

/**
 * 権限チェック結果
 */
export interface PermissionCheck {
  /** 許可されているか */
  allowed: boolean;
  /** 拒否理由（許可されていない場合） */
  reason?: string;
}
```

### ステップ 4: 進捗関連型定義

`src/types/progress.ts`:

```typescript
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
export interface UserProgress {
  /** 進捗ID */
  id: string;
  /** ユーザーID */
  userId: string;
  /** プロジェクトID */
  projectId: string;
  /** ステータス */
  status: ProgressStatus;
  /** 現在のノードID */
  currentNodeId: string;
  /** 総視聴時間（秒） */
  totalWatchTime: number;
  /** 完了率（0-100） */
  completionRate: number;
  /** 開始日時 */
  startedAt: string;
  /** 完了日時 */
  completedAt?: string;
  /** 最終アクセス日時 */
  lastAccessedAt: string;
}

/**
 * 選択履歴
 */
export interface ChoiceHistory {
  /** 履歴ID */
  id: string;
  /** 進捗ID */
  progressId: string;
  /** ノードID */
  nodeId: string;
  /** 選択した選択肢ID */
  choiceId: string;
  /** 選択までの時間（秒） */
  responseTime: number;
  /** タイムアウトによる選択か */
  isTimeout: boolean;
  /** 選択日時 */
  selectedAt: string;
}

/**
 * 進捗サマリー
 */
export interface ProgressSummary {
  /** 総プロジェクト数 */
  totalProjects: number;
  /** 完了プロジェクト数 */
  completedProjects: number;
  /** 進行中プロジェクト数 */
  inProgressProjects: number;
  /** 総視聴時間（秒） */
  totalWatchTime: number;
}

/**
 * 分析データ
 */
export interface AnalyticsData {
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
}

/**
 * 選択肢統計
 */
export interface ChoiceStats {
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
}
```

### ステップ 5: API型定義

`src/types/api.ts`:

```typescript
/**
 * API関連の型定義
 * 対応設計書: DESIGN-BE-2026-001 セクション5
 */

import type { User } from './user';
import type { VideoProject, VideoNode } from './video';
import type { BranchConfig, Choice } from './branch';
import type { UserProgress, ChoiceHistory, AnalyticsData } from './progress';

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
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * ページネーションメタ
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * 動画プロジェクト一覧レスポンス
 */
export interface VideoProjectListResponse {
  projects: VideoProject[];
  meta: PaginationMeta;
}

/**
 * 動画プロジェクト詳細レスポンス
 */
export interface VideoProjectDetailResponse {
  project: VideoProject;
  nodes: VideoNode[];
  branchConfigs: BranchConfig[];
}

/**
 * 動画アップロードURLリクエスト
 */
export interface UploadUrlRequest {
  filename: string;
  contentType: string;
  size: number;
}

/**
 * 動画アップロードURLレスポンス
 */
export interface UploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  expiresAt: string;
}

/**
 * 動画アップロード完了リクエスト
 */
export interface UploadCompleteRequest {
  fileKey: string;
  projectId?: string;
}

/**
 * 動画アップロード完了レスポンス
 */
export interface UploadCompleteResponse {
  videoUrl: string;
  thumbnailUrl?: string;
  metadata: {
    duration: number;
    width: number;
    height: number;
  };
}

/**
 * 分岐設定保存リクエスト
 */
export interface SaveBranchConfigRequest {
  nodeId: string;
  choices: Omit<Choice, 'id'>[];
  timeLimit: number;
  defaultChoiceId: string | null;
}

/**
 * 進捗記録リクエスト
 */
export interface RecordProgressRequest {
  projectId: string;
  currentNodeId: string;
  watchTime: number;
}

/**
 * 選択履歴記録リクエスト
 */
export interface RecordChoiceRequest {
  progressId: string;
  nodeId: string;
  choiceId: string;
  responseTime: number;
  isTimeout: boolean;
}

/**
 * 進捗一覧レスポンス
 */
export interface ProgressListResponse {
  progress: UserProgress[];
  meta: PaginationMeta;
}

/**
 * 進捗詳細レスポンス
 */
export interface ProgressDetailResponse {
  progress: UserProgress;
  history: ChoiceHistory[];
}

/**
 * 分析データレスポンス
 */
export interface AnalyticsResponse {
  analytics: AnalyticsData;
}
```

### ステップ 6: インデックスファイル作成

`src/types/index.ts`:

```typescript
/**
 * 型定義のエントリーポイント
 */

// 動画関連
export type {
  VideoNodeType,
  VideoNode,
  VideoProject,
  VideoPlayerState,
  VideoLoadingState,
  VideoMetadata,
} from './video';

// 分岐関連
export type {
  Choice,
  BranchConfig,
  BranchEdge,
  FlowchartData,
  VideoNodePosition,
  BranchTransitionEvent,
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
  ChoiceHistory,
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
```

---

## 完了条件

- [x] すべての型定義ファイルが作成されている
- [x] TypeScript コンパイルエラーがない
- [x] 設計書（DESIGN-FE-2026-001, DESIGN-BE-2026-001）の型定義と一致している
- [x] インデックスファイルから全ての型がエクスポートされている

---

## テスト方法

### 1. TypeScript コンパイル確認

```bash
npm run type-check
# エラーが0件であることを確認
```

### 2. インポートテスト

`src/app/page.tsx` で一時的にテスト:

```typescript
import type {
  VideoNode,
  VideoProject,
  Choice,
  BranchConfig,
  User,
  UserProgress,
  AnalyticsData,
} from '@/types';

// 型が正しくインポートできることを確認
const testNode: VideoNode = {
  id: 'test',
  type: 'video',
  videoUrl: 'https://example.com/video.mp4',
  title: 'テスト動画',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

console.log(testNode);
```

### 3. 型整合性確認

各型定義ファイルで、必須プロパティが漏れていないか、設計書と照合して確認する。

---

## 参照設計書セクション

- DESIGN-FE-2026-001 セクション9: 型定義
- DESIGN-BE-2026-001 セクション6: データモデル

---

## 成果物

- `src/types/video.ts`: 動画関連型
- `src/types/branch.ts`: 分岐関連型
- `src/types/user.ts`: ユーザー関連型
- `src/types/progress.ts`: 進捗関連型
- `src/types/api.ts`: APIレスポンス型
- `src/types/index.ts`: エクスポート用インデックス

---

## 次のタスク

- phase1-completion.md: Phase 1 完了検証
