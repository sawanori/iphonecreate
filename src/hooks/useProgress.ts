'use client';

import { useCallback, useState } from 'react';

/**
 * 進捗データの状態型（API応答に合わせた型）
 */
interface ProgressData {
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
 * 選択履歴アイテムの型
 */
interface ChoiceHistoryItem {
  id: string;
  progressId: string;
  nodeId: string;
  choiceId: string;
  responseTime: number;
  isTimeout: boolean;
  selectedAt: string;
}

/**
 * useProgress フックの戻り値
 */
export interface UseProgressReturn {
  /** 現在の進捗データ */
  progress: ProgressData | null;
  /** ローディング状態 */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;
  /** 選択履歴 */
  choiceHistory: ChoiceHistoryItem[];
  /** 視聴を開始 */
  startWatching: (projectId: string, startNodeId: string) => Promise<void>;
  /** 進捗を更新 */
  updateProgress: (
    projectId: string,
    data: { currentNodeId?: string; completionRate?: number }
  ) => Promise<void>;
  /** 視聴時間を追加 */
  addWatchTime: (projectId: string, seconds: number) => Promise<void>;
  /** 視聴を完了 */
  completeWatching: (projectId: string) => Promise<void>;
  /** 進捗を取得 */
  fetchProgress: (projectId: string) => Promise<void>;
  /** 選択を記録 */
  recordChoice: (
    projectId: string,
    data: {
      nodeId: string;
      choiceId: string;
      responseTime: number;
      isTimeout: boolean;
    }
  ) => Promise<void>;
  /** 選択履歴を取得 */
  fetchChoiceHistory: (projectId: string) => Promise<void>;
}

/**
 * 進捗管理フック
 */
export function useProgress(): UseProgressReturn {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choiceHistory, setChoiceHistory] = useState<ChoiceHistoryItem[]>([]);

  const fetchProgress = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/progress/${projectId}`);
      const data = await response.json();

      if (data.success) {
        setProgress(data.data.progress);
      } else {
        setError(data.error?.message ?? '進捗の取得に失敗しました');
      }
    } catch {
      setError('ネットワークエラー');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startWatching = useCallback(
    async (projectId: string, startNodeId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/progress/${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start', currentNodeId: startNodeId }),
        });

        const data = await response.json();

        if (data.success) {
          setProgress(data.data.progress);
        } else {
          setError(data.error?.message ?? '視聴開始の記録に失敗しました');
        }
      } catch {
        setError('ネットワークエラー');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateProgress = useCallback(
    async (
      projectId: string,
      updateData: { currentNodeId?: string; completionRate?: number }
    ) => {
      try {
        const response = await fetch(`/api/progress/${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update', ...updateData }),
        });

        const data = await response.json();

        if (data.success) {
          setProgress(data.data.progress);
        }
      } catch (e) {
        // eslint-disable-next-line no-console -- Error logging for debugging
        console.error('Progress update error:', e);
      }
    },
    []
  );

  const addWatchTime = useCallback(async (projectId: string, seconds: number) => {
    try {
      await fetch(`/api/progress/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addTime', watchTime: seconds }),
      });
    } catch (e) {
      // eslint-disable-next-line no-console -- Error logging for debugging
      console.error('Add watch time error:', e);
    }
  }, []);

  const completeWatching = useCallback(async (projectId: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/progress/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });

      const data = await response.json();

      if (data.success) {
        setProgress(data.data.progress);
      }
    } catch (e) {
      // eslint-disable-next-line no-console -- Error logging for debugging
      console.error('Complete watching error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 選択履歴を取得
   */
  const fetchChoiceHistory = useCallback(async (projectId: string) => {
    try {
      const response = await fetch(`/api/progress/${projectId}/choice`);
      const data = await response.json();

      if (data.success) {
        setChoiceHistory(data.data.history);
      }
    } catch (e) {
      // eslint-disable-next-line no-console -- Error logging for debugging
      console.error('Fetch choice history error:', e);
    }
  }, []);

  /**
   * 選択を記録
   * AC-PROGRESS-002: 選択履歴が時刻とともに記録される
   */
  const recordChoice = useCallback(
    async (
      projectId: string,
      choiceData: {
        nodeId: string;
        choiceId: string;
        responseTime: number;
        isTimeout: boolean;
      }
    ) => {
      try {
        const response = await fetch(`/api/progress/${projectId}/choice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(choiceData),
        });

        const data = await response.json();

        if (data.success) {
          // 履歴に追加（最新を先頭に）
          setChoiceHistory((prev) => [data.data.choice, ...prev]);
        }
      } catch (e) {
        // eslint-disable-next-line no-console -- Error logging for debugging
        console.error('Record choice error:', e);
      }
    },
    []
  );

  return {
    progress,
    isLoading,
    error,
    choiceHistory,
    startWatching,
    updateProgress,
    addWatchTime,
    completeWatching,
    fetchProgress,
    recordChoice,
    fetchChoiceHistory,
  };
}
