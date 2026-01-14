/**
 * useVideoPlayer - 動画プレイヤーロジックフック
 *
 * 対応設計書: DESIGN-FE-2026-001 セクション8.1
 * 対応タスク: phase2-005-branch-transition.md
 *
 * 機能:
 * - 分岐データの管理
 * - 選択肢から次ノードへの遷移ロジック（BranchEdge経由）
 * - 動画プリロード
 * - 遷移アニメーション制御
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVideoStore } from '@/stores/videoStore';
import type { VideoNode, Choice } from '@/types';
import type { BranchConfig, BranchEdge } from '@/types/branch';

/**
 * useVideoPlayer フックのオプション
 */
export interface UseVideoPlayerOptions {
  /** 動画ノード一覧 */
  nodes: VideoNode[];
  /** 分岐設定一覧 */
  branchConfigs: BranchConfig[];
  /** 分岐エッジ一覧（設計書v1.1.0: 選択肢から次ノードへの遷移はBranchEdge経由） */
  branchEdges: BranchEdge[];
  /** 初期ノードID */
  initialNodeId: string;
  /** 遷移完了時のコールバック */
  onTransitionComplete?: (fromNodeId: string, toNodeId: string) => void;
  /** 選択時のコールバック */
  onChoice?: (nodeId: string, choice: Choice, isTimeout: boolean) => void;
  /** 動画終了時のコールバック */
  onEnd?: (nodeId: string) => void;
  /** プリロード有効化 */
  enablePreload?: boolean;
  /** 遷移時間（ミリ秒） */
  transitionDuration?: number;
  /** 選択確認遅延時間（ミリ秒） - 選択後、この時間待ってから遷移 */
  selectionDelay?: number;
}

/**
 * useVideoPlayer フックの戻り値
 */
export interface UseVideoPlayerReturn {
  /** 現在のノード */
  currentNode: VideoNode | null;
  /** 現在の動画URL */
  currentVideoUrl: string;
  /** 次の動画URLリスト（プリロード用） */
  nextVideoUrls: string[];
  /** 選択肢を処理 */
  handleChoiceSelect: (choice: Choice, isTimeout?: boolean) => void;
  /** 指定ノードに遷移 */
  navigateToNode: (nodeId: string) => void;
  /** 選択肢表示時間に達した時の処理 */
  handleChoiceDisplayTime: () => void;
  /** 動画終了時の処理 */
  handleVideoEnd: () => void;
  /** タイムアウト処理 */
  handleTimeout: () => void;
  /** 遷移中かどうか */
  isTransitioning: boolean;
  /** ローディング中かどうか */
  isLoading: boolean;
  /** プリロード対象の動画URL（選択確認中） */
  pendingTargetUrl: string | null;
  /** プリロード完了ハンドラー */
  handlePreloadComplete: () => void;
  /** プリロード進捗ハンドラー */
  handlePreloadProgress: (progress: number) => void;
}

/**
 * 動画プレイヤーのロジックをまとめたフック
 *
 * 選択肢から次ノードへの遷移はBranchEdge経由で解決します（設計書v1.1.0の修正内容）。
 * これにより、選択肢のnextNodeIdではなく、BranchEdgeのtargetNodeIdを使用して
 * 遷移先を特定します。
 */
export function useVideoPlayer({
  nodes,
  branchConfigs,
  branchEdges,
  initialNodeId,
  onTransitionComplete,
  onChoice,
  onEnd,
  enablePreload = true,
  transitionDuration = 100,
  selectionDelay = 2500,
}: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTargetUrl, setPendingTargetUrl] = useState<string | null>(null);
  const [isVideoPreloaded, setIsVideoPreloaded] = useState(false);
  const preloadedUrlsRef = useRef<Set<string>>(new Set());
  const transitionStartTimeRef = useRef<number>(0);
  const pendingTransitionRef = useRef<{
    targetNode: VideoNode;
    choice: Choice;
    isTimeout: boolean;
    startTime: number;
  } | null>(null);

  const {
    currentNodeId,
    isTransitioning,
    isConfirmingSelection,
    setCurrentNode,
    setIsTransitioning,
    setIsPlaying,
    showChoices,
    hideChoices,
    selectChoice,
    confirmSelection,
    clearSelection,
    setPreloadProgress,
  } = useVideoStore();

  // 現在のノードを取得
  const currentNode = nodes.find((n) => n.id === currentNodeId) ?? null;

  // 現在のノードの分岐設定を取得
  const currentBranchConfig = branchConfigs.find(
    (b) => b.nodeId === currentNodeId
  );

  // 現在の動画URL
  const currentVideoUrl = currentNode?.videoUrl ?? '';

  /**
   * BranchEdge経由で次のノードIDを解決する
   * 設計書v1.1.0の修正: 選択肢から次ノードへの遷移はBranchEdge経由
   */
  const resolveTargetNodeId = useCallback(
    (choiceId: string, sourceNodeId: string): string | null => {
      // BranchEdgeから対応するエッジを検索
      const edge = branchEdges.find(
        (e) => e.sourceNodeId === sourceNodeId && e.choiceId === choiceId
      );
      return edge?.targetNodeId ?? null;
    },
    [branchEdges]
  );

  // 次の動画URLリスト（プリロード用）- wrapped in useMemo to prevent unnecessary re-renders
  const nextVideoUrls = useMemo(
    () =>
      currentBranchConfig?.choices
        .map((choice) => {
          // BranchEdge経由でターゲットノードIDを解決
          const targetNodeId = resolveTargetNodeId(choice.id, currentNodeId);
          if (!targetNodeId) return null;
          const targetNode = nodes.find((n) => n.id === targetNodeId);
          return targetNode?.videoUrl;
        })
        .filter((url): url is string => !!url) ?? [],
    [currentBranchConfig?.choices, resolveTargetNodeId, currentNodeId, nodes]
  );

  // 初期ノードを設定
  useEffect(() => {
    if (initialNodeId && !currentNodeId) {
      const node = nodes.find((n) => n.id === initialNodeId);
      if (node) {
        setCurrentNode(node);
      }
    }
  }, [initialNodeId, currentNodeId, nodes, setCurrentNode]);

  // プリロード処理
  useEffect(() => {
    if (!enablePreload) return;

    nextVideoUrls.forEach((url) => {
      if (!preloadedUrlsRef.current.has(url)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = url;
        document.head.appendChild(link);
        preloadedUrlsRef.current.add(url);
      }
    });
  }, [nextVideoUrls, enablePreload]);

  // 選択肢表示時間に達した時の処理
  const handleChoiceDisplayTime = useCallback(() => {
    if (!currentBranchConfig) return;

    // 動画を一時停止して選択肢を表示
    setIsPlaying(false);
    showChoices(currentBranchConfig.choices, currentBranchConfig.timeLimit);
  }, [currentBranchConfig, setIsPlaying, showChoices]);

  /**
   * 遷移を実行する内部関数
   */
  const executeTransition = useCallback(
    (targetNode: VideoNode, choice: Choice, isTimeout: boolean) => {
      // 遷移開始
      setIsTransitioning(true);
      setIsLoading(true);

      // 選択をストアに記録
      selectChoice(choice.id, isTimeout);

      // 遷移アニメーション後に次のノードへ
      setTimeout(() => {
        setCurrentNode(targetNode);
        hideChoices();
        clearSelection();
        setPendingTargetUrl(null);
        setIsVideoPreloaded(false);
        pendingTransitionRef.current = null;

        // 遷移完了コールバック
        onTransitionComplete?.(currentNodeId, targetNode.id);

        // 遷移時間計測終了（パフォーマンス検証用）
        const transitionDurationActual =
          performance.now() - transitionStartTimeRef.current;
        void transitionDurationActual;

        setIsLoading(false);
        setIsTransitioning(false);

        // 少し待ってから再生開始
        setTimeout(() => {
          setIsPlaying(true);
        }, 100);
      }, transitionDuration);
    },
    [
      currentNodeId,
      onTransitionComplete,
      selectChoice,
      setIsTransitioning,
      setCurrentNode,
      hideChoices,
      clearSelection,
      setIsPlaying,
      transitionDuration,
    ]
  );

  /**
   * 遅延遷移を試行する
   * selectionDelay経過 かつ プリロード完了 の両方を満たしたら遷移
   */
  const attemptDelayedTransitionRef = useRef<() => void>(() => {});

  const attemptDelayedTransition = useCallback(() => {
    const pending = pendingTransitionRef.current;
    if (!pending) return;

    const elapsed = performance.now() - pending.startTime;
    const isDelayMet = elapsed >= selectionDelay;
    const isPreloaded = isVideoPreloaded || preloadedUrlsRef.current.has(pending.targetNode.videoUrl || '');

    // 進捗を更新（時間ベース、最大100%）
    const timeProgress = Math.min(100, (elapsed / selectionDelay) * 100);
    setPreloadProgress(timeProgress);

    if (isDelayMet && isPreloaded) {
      // 両方の条件を満たした - 遷移実行
      executeTransition(pending.targetNode, pending.choice, pending.isTimeout);
    } else if (elapsed < selectionDelay + 5000) {
      // まだ待機中（最大5秒追加で待つ）
      requestAnimationFrame(() => attemptDelayedTransitionRef.current());
    } else {
      // タイムアウト - 強制遷移
      executeTransition(pending.targetNode, pending.choice, pending.isTimeout);
    }
  }, [selectionDelay, isVideoPreloaded, executeTransition, setPreloadProgress]);

  // refを最新のコールバックで更新（effect内でのみ更新可能）
  useEffect(() => {
    attemptDelayedTransitionRef.current = attemptDelayedTransition;
  }, [attemptDelayedTransition]);

  // 選択処理
  const handleChoiceSelect = useCallback(
    (choice: Choice, isTimeout = false) => {
      if (isTransitioning || isConfirmingSelection) return;

      // 遷移時間計測開始
      transitionStartTimeRef.current = performance.now();

      // コールバック
      onChoice?.(currentNodeId, choice, isTimeout);

      // BranchEdge経由で次のノードIDを解決
      const targetNodeId = resolveTargetNodeId(choice.id, currentNodeId);

      if (!targetNodeId) {
        return;
      }

      const targetNode = nodes.find((n) => n.id === targetNodeId);

      if (!targetNode) {
        return;
      }

      // 選択確認モードを開始
      confirmSelection(choice.id);

      // プリロード対象URLを設定
      const targetUrl = targetNode.videoUrl || '';
      setPendingTargetUrl(targetUrl);
      setIsVideoPreloaded(preloadedUrlsRef.current.has(targetUrl));

      // 遷移情報を保存
      pendingTransitionRef.current = {
        targetNode,
        choice,
        isTimeout,
        startTime: performance.now(),
      };

      // 遅延遷移を開始
      requestAnimationFrame(attemptDelayedTransition);
    },
    [
      isTransitioning,
      isConfirmingSelection,
      currentNodeId,
      nodes,
      onChoice,
      confirmSelection,
      resolveTargetNodeId,
      attemptDelayedTransition,
    ]
  );

  // プリロード完了ハンドラー
  const handlePreloadComplete = useCallback(() => {
    setIsVideoPreloaded(true);
    if (pendingTargetUrl) {
      preloadedUrlsRef.current.add(pendingTargetUrl);
    }
  }, [pendingTargetUrl]);

  // プリロード進捗ハンドラー（VideoPreloaderから呼ばれる）
  const handlePreloadProgress = useCallback(
    (progress: number) => {
      // 時間ベースの進捗と組み合わせる（表示はChoiceOverlayで行う）
      void progress;
    },
    []
  );

  // タイムアウト処理
  const handleTimeout = useCallback(() => {
    if (!currentBranchConfig) return;

    const defaultChoiceId = currentBranchConfig.defaultChoiceId;

    if (defaultChoiceId) {
      // デフォルト選択肢で遷移
      const defaultChoice = currentBranchConfig.choices.find(
        (c) => c.id === defaultChoiceId
      );
      if (defaultChoice) {
        handleChoiceSelect(defaultChoice, true);
      }
    } else {
      // 動画を一時停止して待機（PRD要件: 制限時間超過時は動画を一時停止）
      setIsPlaying(false);
    }
  }, [currentBranchConfig, handleChoiceSelect, setIsPlaying]);

  // 動画終了処理
  const handleVideoEnd = useCallback(() => {
    // 終了ノードの場合
    if (currentNode?.isEndNode) {
      onEnd?.(currentNodeId);
      return;
    }

    // 選択肢がない場合は終了
    if (!currentBranchConfig || currentBranchConfig.choices.length === 0) {
      onEnd?.(currentNodeId);
      return;
    }

    // 選択肢表示時間が設定されていない場合は動画終了時に表示
    if (currentNode?.choiceTimestamp === null) {
      handleChoiceDisplayTime();
    }
  }, [
    currentNode,
    currentNodeId,
    currentBranchConfig,
    onEnd,
    handleChoiceDisplayTime,
  ]);

  // 指定ノードに遷移
  const navigateToNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setCurrentNode(node);
        setIsPlaying(true);
      }
    },
    [nodes, setCurrentNode, setIsPlaying]
  );

  return {
    currentNode,
    currentVideoUrl,
    nextVideoUrls,
    handleChoiceSelect,
    navigateToNode,
    handleChoiceDisplayTime,
    handleVideoEnd,
    handleTimeout,
    isTransitioning,
    isLoading,
    pendingTargetUrl,
    handlePreloadComplete,
    handlePreloadProgress,
  };
}
