/**
 * 動画関連の型定義
 * 対応設計書: DESIGN-FE-2026-001 セクション9
 */

/**
 * 動画ノードの種類
 */
export type VideoNodeType = 'video' | 'choice' | 'end';

/**
 * 動画プロジェクト
 */
export type VideoProject = {
  /** プロジェクトID */
  id: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description: string;
  /** サムネイルURL */
  thumbnailUrl: string;
  /** 公開ステータス */
  status: 'draft' | 'published' | 'archived';
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
  /** 作成者ID */
  createdBy: string;
};

/**
 * 動画データ
 */
export type VideoData = {
  /** 動画ID */
  id: string;
  /** タイトル */
  title: string;
  /** 動画の説明文 */
  description: string;
  /** サムネイルURL（null許容） */
  thumbnailUrl: string | null;
  /** 公開ステータス */
  status: 'draft' | 'published' | 'archived';
  /** ノード一覧 */
  nodes: VideoNode[];
  /** 開始ノードID（初期状態ではnull） */
  startNodeId: string | null;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
  /** 作成者情報 */
  createdBy: { id: string; name: string };
};

/**
 * 動画ノード
 */
export type VideoNode = {
  /** ノードID */
  id: string;
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
  /** 選択肢一覧 */
  choices?: Choice[];
  /** 終了ノードかどうか */
  isEndNode: boolean;
  /** フローエディタ上の座標 */
  position: { x: number; y: number };
};

/**
 * 選択肢（2択固定）
 */
export type Choice = {
  /** 選択肢ID */
  id: string;
  /** 選択肢ラベル */
  label: string;
  /** 遷移先ノードID */
  nextNodeId: string;
};

/**
 * 動画プレイヤーの状態
 */
export type VideoPlayerState = {
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
};

/**
 * 動画読み込み状態
 */
export type VideoLoadingState = 'idle' | 'loading' | 'ready' | 'error';

/**
 * 動画メタデータ
 */
export type VideoMetadata = {
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
};
