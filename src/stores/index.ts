/**
 * ストアのエントリーポイント
 */

// ビデオストア
export {
  useVideoStore,
  selectPlaybackState,
  selectChoiceState,
  selectTransitionState,
  selectCurrentNode,
  selectChoiceHistory,
} from './videoStore';

// 型定義
export type { VideoStoreState, VideoStoreActions } from './videoStore';

// エディターストア
export { useEditorStore } from './editorStore';
export type { EditorStoreState, EditorStoreActions } from './editorStore';

// 進捗ストア
export { useProgressStore } from './progressStore';
export type {
  ProgressStoreState,
  ProgressStoreActions,
  UserProgressData,
  ProgressSummaryData,
  ChoiceHistoryItem,
} from './progressStore';
