/**
 * 進捗ストア
 * Zustandを使用した進捗状態の管理
 *
 * 対応設計書: DESIGN-FE-2026-001 セクション7.2
 * 対応タスク: phase5-004-progress-page.md
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * ユーザー進捗データ（API応答に合わせた型）
 */
export interface UserProgressData {
  id: string;
  userId: string;
  projectId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  currentNodeId: string | null;
  totalWatchTime: number;
  completionRate: number;
  startedAt: string | null;
  completedAt: string | null;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 進捗サマリー（API応答に合わせた型）
 */
export interface ProgressSummaryData {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  totalWatchTime: number;
}

/**
 * 選択履歴アイテム（API応答に合わせた型）
 */
export interface ChoiceHistoryItem {
  id: string;
  progressId: string;
  nodeId: string;
  choiceId: string;
  responseTime: number;
  isTimeout: boolean;
  selectedAt: string;
}

/**
 * 進捗ストアの状態
 */
interface ProgressStoreState {
  progressList: UserProgressData[];
  summary: ProgressSummaryData | null;
  selectedProgress: UserProgressData | null;
  choiceHistory: ChoiceHistoryItem[];
  isLoading: boolean;
  error: string | null;
}

/**
 * 進捗ストアのアクション
 */
interface ProgressStoreActions {
  setProgressList: (list: UserProgressData[]) => void;
  setSummary: (summary: ProgressSummaryData) => void;
  setSelectedProgress: (progress: UserProgressData | null) => void;
  setChoiceHistory: (history: ChoiceHistoryItem[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchProgressList: () => Promise<void>;
  fetchProgressDetail: (projectId: string) => Promise<void>;
  reset: () => void;
}

/**
 * 初期状態
 */
const initialState: ProgressStoreState = {
  progressList: [],
  summary: null,
  selectedProgress: null,
  choiceHistory: [],
  isLoading: false,
  error: null,
};

/**
 * 進捗ストア
 */
export const useProgressStore = create<
  ProgressStoreState & ProgressStoreActions
>()(
  devtools(
    (set) => ({
      ...initialState,

      setProgressList: (list) =>
        set({ progressList: list }, false, 'setProgressList'),

      setSummary: (summary) => set({ summary }, false, 'setSummary'),

      setSelectedProgress: (progress) =>
        set({ selectedProgress: progress }, false, 'setSelectedProgress'),

      setChoiceHistory: (history) =>
        set({ choiceHistory: history }, false, 'setChoiceHistory'),

      setIsLoading: (isLoading) =>
        set({ isLoading }, false, 'setIsLoading'),

      setError: (error) => set({ error }, false, 'setError'),

      fetchProgressList: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/progress?summary=true');
          const data = await response.json();

          if (data.success) {
            set({
              progressList: data.data.progress,
              summary: data.data.summary,
              isLoading: false,
            });
          } else {
            set({
              error: data.error?.message ?? 'Failed to fetch progress',
              isLoading: false,
            });
          }
        } catch {
          set({
            error: 'Network error',
            isLoading: false,
          });
        }
      },

      fetchProgressDetail: async (projectId: string) => {
        set({ isLoading: true, error: null });

        try {
          const [progressRes, historyRes] = await Promise.all([
            fetch(`/api/progress/${projectId}`),
            fetch(`/api/progress/${projectId}/choice`),
          ]);

          const [progressData, historyData] = await Promise.all([
            progressRes.json(),
            historyRes.json(),
          ]);

          if (progressData.success && historyData.success) {
            set({
              selectedProgress: progressData.data.progress,
              choiceHistory: historyData.data.history,
              isLoading: false,
            });
          } else {
            set({
              error: 'Detail fetch failed',
              isLoading: false,
            });
          }
        } catch {
          set({
            error: 'Network error',
            isLoading: false,
          });
        }
      },

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'progress-store' }
  )
);

/**
 * 型エクスポート（テスト用）
 */
export type { ProgressStoreState, ProgressStoreActions };
