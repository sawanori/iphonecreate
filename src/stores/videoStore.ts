/**
 * ビデオストア
 * Zustandを使用した動画再生状態の管理
 *
 * 対応設計書: DESIGN-FE-2026-001 セクション7.2
 * 対応タスク: phase2-002-video-store.md
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { VideoPlayerState, VideoNode, Choice } from '@/types';

/**
 * ビデオストアの状態
 */
interface VideoStoreState extends VideoPlayerState {
  /** 現在の動画ノード情報 */
  currentNode: VideoNode | null;
  /** 利用可能な選択肢 */
  choices: Choice[];
  /** 残り時間（秒） */
  remainingTime: number;
  /** 制限時間（秒） */
  timeLimit: number;
  /** 選択済みの選択肢履歴 */
  choiceHistory: Array<{
    nodeId: string;
    choiceId: string;
    timestamp: number;
    isTimeout: boolean;
  }>;
  /** 選択確認中の選択肢ID */
  selectedChoiceId: string | null;
  /** 選択確認中フラグ */
  isConfirmingSelection: boolean;
  /** プリロード進捗 (0-100) */
  preloadProgress: number;
}

/**
 * ビデオストアのアクション
 */
interface VideoStoreActions {
  // 再生制御
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlay: () => void;

  // 音量制御
  setVolume: (volume: number) => void;
  setIsMuted: (isMuted: boolean) => void;
  toggleMute: () => void;

  // 時間制御
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;

  // ノード制御
  setCurrentNode: (node: VideoNode | null) => void;
  setCurrentNodeId: (nodeId: string) => void;

  // 選択肢制御
  setChoices: (choices: Choice[]) => void;
  setIsChoiceVisible: (isVisible: boolean) => void;
  showChoices: (choices: Choice[], timeLimit: number) => void;
  hideChoices: () => void;

  // タイマー制御
  setRemainingTime: (time: number) => void;
  decrementRemainingTime: () => void;

  // 遷移制御
  setIsTransitioning: (isTransitioning: boolean) => void;

  // 選択処理
  selectChoice: (choiceId: string, isTimeout?: boolean) => void;

  // 履歴
  addToHistory: (nodeId: string, choiceId: string, isTimeout: boolean) => void;
  clearHistory: () => void;

  // 選択確認
  confirmSelection: (choiceId: string) => void;
  clearSelection: () => void;
  setPreloadProgress: (progress: number) => void;

  // リセット
  reset: () => void;
}

/**
 * ストアの初期状態
 */
const initialState: VideoStoreState = {
  currentNodeId: '',
  isPlaying: false,
  isChoiceVisible: false,
  isTransitioning: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  currentNode: null,
  choices: [],
  remainingTime: 0,
  timeLimit: 0,
  choiceHistory: [],
  selectedChoiceId: null,
  isConfirmingSelection: false,
  preloadProgress: 0,
};

/**
 * ビデオストア
 */
export const useVideoStore = create<VideoStoreState & VideoStoreActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // 再生制御
      setIsPlaying: (isPlaying) => set({ isPlaying }, false, 'setIsPlaying'),

      togglePlay: () =>
        set((state) => ({ isPlaying: !state.isPlaying }), false, 'togglePlay'),

      // 音量制御
      setVolume: (volume) =>
        set({ volume: Math.max(0, Math.min(1, volume)) }, false, 'setVolume'),

      setIsMuted: (isMuted) => set({ isMuted }, false, 'setIsMuted'),

      toggleMute: () =>
        set((state) => ({ isMuted: !state.isMuted }), false, 'toggleMute'),

      // 時間制御
      setCurrentTime: (currentTime) =>
        set({ currentTime }, false, 'setCurrentTime'),

      setDuration: (duration) => set({ duration }, false, 'setDuration'),

      // ノード制御
      setCurrentNode: (currentNode) =>
        set(
          {
            currentNode,
            currentNodeId: currentNode?.id ?? '',
          },
          false,
          'setCurrentNode'
        ),

      setCurrentNodeId: (currentNodeId) =>
        set({ currentNodeId }, false, 'setCurrentNodeId'),

      // 選択肢制御
      setChoices: (choices) => set({ choices }, false, 'setChoices'),

      setIsChoiceVisible: (isChoiceVisible) =>
        set({ isChoiceVisible }, false, 'setIsChoiceVisible'),

      showChoices: (choices, timeLimit) =>
        set(
          {
            choices,
            timeLimit,
            remainingTime: timeLimit,
            isChoiceVisible: true,
            isPlaying: false, // 選択肢表示時は動画を一時停止
          },
          false,
          'showChoices'
        ),

      hideChoices: () =>
        set(
          {
            isChoiceVisible: false,
            choices: [],
            remainingTime: 0,
            timeLimit: 0,
          },
          false,
          'hideChoices'
        ),

      // タイマー制御
      setRemainingTime: (remainingTime) =>
        set({ remainingTime }, false, 'setRemainingTime'),

      decrementRemainingTime: () =>
        set(
          (state) => ({
            remainingTime: Math.max(0, state.remainingTime - 0.1),
          }),
          false,
          'decrementRemainingTime'
        ),

      // 遷移制御
      setIsTransitioning: (isTransitioning) =>
        set({ isTransitioning }, false, 'setIsTransitioning'),

      // 選択処理
      selectChoice: (choiceId, isTimeout = false) => {
        const state = get();
        const choice = state.choices.find((c) => c.id === choiceId);

        if (!choice) return;

        // 履歴に追加
        get().addToHistory(state.currentNodeId, choiceId, isTimeout);

        // 選択肢を非表示にして遷移開始
        set(
          {
            isChoiceVisible: false,
            isTransitioning: true,
          },
          false,
          'selectChoice'
        );
      },

      // 履歴
      addToHistory: (nodeId, choiceId, isTimeout) =>
        set(
          (state) => ({
            choiceHistory: [
              ...state.choiceHistory,
              {
                nodeId,
                choiceId,
                timestamp: Date.now(),
                isTimeout,
              },
            ],
          }),
          false,
          'addToHistory'
        ),

      clearHistory: () => set({ choiceHistory: [] }, false, 'clearHistory'),

      // 選択確認
      confirmSelection: (choiceId) =>
        set(
          {
            selectedChoiceId: choiceId,
            isConfirmingSelection: true,
            preloadProgress: 0,
          },
          false,
          'confirmSelection'
        ),

      clearSelection: () =>
        set(
          {
            selectedChoiceId: null,
            isConfirmingSelection: false,
            preloadProgress: 0,
          },
          false,
          'clearSelection'
        ),

      setPreloadProgress: (preloadProgress) =>
        set({ preloadProgress }, false, 'setPreloadProgress'),

      // リセット
      reset: () => set(initialState, false, 'reset'),
    })),
    { name: 'video-store' }
  )
);

/**
 * セレクター: 再生状態のみを取得
 */
export const selectPlaybackState = (state: VideoStoreState) => ({
  isPlaying: state.isPlaying,
  currentTime: state.currentTime,
  duration: state.duration,
  volume: state.volume,
  isMuted: state.isMuted,
});

/**
 * セレクター: 選択肢状態のみを取得
 */
export const selectChoiceState = (state: VideoStoreState) => ({
  isChoiceVisible: state.isChoiceVisible,
  choices: state.choices,
  remainingTime: state.remainingTime,
  timeLimit: state.timeLimit,
  selectedChoiceId: state.selectedChoiceId,
  isConfirmingSelection: state.isConfirmingSelection,
  preloadProgress: state.preloadProgress,
});

/**
 * セレクター: 遷移状態のみを取得
 */
export const selectTransitionState = (state: VideoStoreState) => ({
  isTransitioning: state.isTransitioning,
  currentNodeId: state.currentNodeId,
});

/**
 * セレクター: 現在のノード情報を取得
 */
export const selectCurrentNode = (state: VideoStoreState) => state.currentNode;

/**
 * セレクター: 選択肢履歴を取得
 */
export const selectChoiceHistory = (state: VideoStoreState) =>
  state.choiceHistory;

/**
 * ストアの型エクスポート（テスト用）
 */
export type { VideoStoreState, VideoStoreActions };
