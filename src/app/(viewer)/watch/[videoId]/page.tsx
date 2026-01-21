'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  VideoPlayer,
  ChoiceOverlay,
  CountdownTimer,
  BranchTransition,
  VideoPreloader,
} from '@/components/video';
import { ViewerLayout } from '@/components/layout';
import { useVideoPlayer } from '@/hooks';
import { useVideoStore } from '@/stores/videoStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Maximize, Minimize } from 'lucide-react';
import type { Choice, VideoNode, BranchConfig, BranchEdge } from '@/types';

/**
 * API response types
 */
interface ApiVideoNode {
  id: string;
  type: string;
  title: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  positionX: number;
  positionY: number;
}

interface ApiChoice {
  id: string;
  nodeId: string;
  label: string;
  targetNodeId: string | null;
}

interface ApiBranchConfig {
  nodeId: string;
  timeLimit: number | null;
}

interface ApiEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
}

interface ApiProjectData {
  project: {
    id: string;
    title: string;
    description: string | null;
    startNodeId: string | null;
    aspectRatio?: 'landscape' | 'portrait';
  };
  nodes: ApiVideoNode[];
  choices: ApiChoice[];
  branchConfigs: ApiBranchConfig[];
  edges: ApiEdge[];
}

/**
 * Transformed data for player
 */
interface PlayerData {
  project: { id: string; title: string; aspectRatio: 'landscape' | 'portrait' };
  nodes: VideoNode[];
  branchConfigs: BranchConfig[];
  branchEdges: BranchEdge[];
  startNodeId: string;
  getNodeTitle: (nodeId: string) => string;
  getNodeDescription: (nodeId: string) => string;
}

/**
 * Completion state
 */
interface CompletionState {
  isCompleted: boolean;
  totalTime: number;
  choiceCount: number;
}

/**
 * Transform API data to player format
 */
function transformApiData(apiData: ApiProjectData): PlayerData {
  const { project, nodes, choices, branchConfigs, edges } = apiData;

  // Find start node (specified, or first video node, or first node)
  const videoNodes = nodes.filter(
    (n) => n.type === 'video' || n.type === 'videoNode'
  );
  const startNodeId =
    project.startNodeId || videoNodes[0]?.id || nodes[0]?.id || '';

  // Transform nodes to VideoNode format
  const transformedNodes = nodes.map((node): VideoNode => {
    const nodeChoices = choices
      .filter((c) => c.nodeId === node.id)
      .map((c) => {
        // choiceにtargetNodeIdがあればそれを使う、なければedgesから探す
        let nextNodeId = c.targetNodeId;
        if (!nextNodeId) {
          const edge = edges.find((e) => e.sourceNodeId === c.nodeId);
          if (edge) {
            nextNodeId = edge.targetNodeId;
          }
        }
        return {
          id: c.id,
          label: c.label,
          nextNodeId: nextNodeId || '',
        };
      });

    const config = branchConfigs.find((bc) => bc.nodeId === node.id);

    // 終了ノードかどうかは明示的なタイプのみで判断
    const isEndNode = node.type === 'end' || node.type === 'endNode';

    const result: VideoNode = {
      id: node.id,
      videoUrl: node.videoUrl || '',
      duration: 0,
      choiceTimestamp: nodeChoices.length > 0 ? 5 : null, // Show choices 5s before end
      timeLimit: config?.timeLimit || 15,
      choices: nodeChoices,
      isEndNode,
      position: { x: node.positionX, y: node.positionY },
    };
    if (node.thumbnailUrl) {
      result.thumbnailUrl = node.thumbnailUrl;
    }
    return result;
  });

  // Transform branchConfigs
  const transformedBranchConfigs: BranchConfig[] = nodes
    .filter((node) => {
      const nodeChoices = choices.filter((c) => c.nodeId === node.id);
      return nodeChoices.length > 0;
    })
    .map((node) => {
      const nodeChoices = choices
        .filter((c) => c.nodeId === node.id)
        .map((c) => {
          // choiceにtargetNodeIdがあればそれを使う、なければedgesから探す
          let nextNodeId = c.targetNodeId;
          if (!nextNodeId) {
            const edge = edges.find((e) => e.sourceNodeId === c.nodeId);
            if (edge) {
              nextNodeId = edge.targetNodeId;
            }
          }
          return {
            id: c.id,
            label: c.label,
            nextNodeId: nextNodeId || '',
          };
        });
      const config = branchConfigs.find((bc) => bc.nodeId === node.id);

      return {
        nodeId: node.id,
        choices: nodeChoices,
        timeLimit: config?.timeLimit || 15,
        defaultChoiceId: nodeChoices[0]?.id || null,
      };
    });

  // Transform choices to BranchEdge format
  // choiceにtargetNodeIdがある場合はそれを使う
  // なければedgesからsourceNodeIdが一致するedgeを探してtargetNodeIdを使う
  const transformedEdges: BranchEdge[] = choices
    .map((choice) => {
      let targetNodeId = choice.targetNodeId;
      if (!targetNodeId) {
        // edgesからこのノードから出ているエッジを探す
        const edge = edges.find((e) => e.sourceNodeId === choice.nodeId);
        if (edge) {
          targetNodeId = edge.targetNodeId;
        }
      }
      if (!targetNodeId) return null;

      return {
        id: choice.id,
        sourceNodeId: choice.nodeId,
        targetNodeId: targetNodeId,
        choiceId: choice.id,
      };
    })
    .filter((edge): edge is BranchEdge => edge !== null);

  // Title/description helpers
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const getNodeTitle = (nodeId: string) => nodeMap.get(nodeId)?.title || 'Unknown';
  const getNodeDescription = (_nodeId: string) => '';

  return {
    project: { id: project.id, title: project.title, aspectRatio: project.aspectRatio || 'landscape' },
    nodes: transformedNodes,
    branchConfigs: transformedBranchConfigs,
    branchEdges: transformedEdges,
    startNodeId,
    getNodeTitle,
    getNodeDescription,
  };
}

/**
 * Watch page component
 * Integrates VideoPlayer, ChoiceOverlay, CountdownTimer, and BranchTransition
 */
export default function WatchPage() {
  const params = useParams();
  const videoId = params.videoId as string;

  // Data state
  const [data, setData] = useState<PlayerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completion, setCompletion] = useState<CompletionState | null>(null);

  // Fullscreen state
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Store state
  const { isChoiceVisible, choices, remainingTime, timeLimit, choiceHistory } =
    useVideoStore();
  const { setIsPlaying, reset: resetStore } = useVideoStore();

  // Load data from API
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const response = await fetch(`/api/videos/${videoId}`);
        if (!response.ok) {
          throw new Error('動画データの読み込みに失敗しました');
        }

        const { data: apiData } = (await response.json()) as { data: ApiProjectData };

        if (isMounted) {
          const transformed = transformApiData(apiData);
          setData(transformed);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : '動画データの読み込みに失敗しました');
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  // Completion handler
  const handleEnd = useCallback(
    (nodeId: string) => {
      const node = data?.nodes.find((n) => n.id === nodeId);
      if (node?.isEndNode) {
        setCompletion({
          isCompleted: true,
          totalTime: choiceHistory.length * 10,
          choiceCount: choiceHistory.length,
        });
      }
    },
    [data?.nodes, choiceHistory]
  );

  // Choice handler
  const handleChoice = useCallback(
    (_nodeId: string, choice: Choice, isTimeout: boolean) => {
      void choice;
      void isTimeout;
    },
    []
  );

  // Transition complete handler
  const handleTransitionComplete = useCallback(
    (fromNodeId: string, toNodeId: string) => {
      void fromNodeId;
      void toNodeId;
    },
    []
  );

  // useVideoPlayer hook
  const {
    currentNode,
    currentVideoUrl,
    handleChoiceSelect,
    handleChoiceDisplayTime,
    handleVideoEnd,
    handleTimeout,
    isTransitioning,
    isLoading,
    pendingTargetUrl,
    handlePreloadComplete,
    handlePreloadProgress,
  } = useVideoPlayer({
    nodes: data?.nodes ?? [],
    branchConfigs: data?.branchConfigs ?? [],
    branchEdges: data?.branchEdges ?? [],
    initialNodeId: data?.startNodeId ?? '',
    onTransitionComplete: handleTransitionComplete,
    onChoice: handleChoice,
    onEnd: handleEnd,
    selectionDelay: 5000, // 選択後5秒待ってから遷移
  });

  // Rewatch handler
  const handleRewatch = useCallback(() => {
    setCompletion(null);
    resetStore();
  }, [resetStore]);

  // Fullscreen toggle handler
  const toggleFullscreen = useCallback(async () => {
    const container = videoContainerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen not supported or denied - silently ignore
    }
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Loading display
  if (!data) {
    return (
      <ViewerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          {error ? (
            <Card className="max-w-md">
              <CardContent className="pt-6 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>再読み込み</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          )}
        </div>
      </ViewerLayout>
    );
  }

  // Completion display
  if (completion?.isCompleted) {
    return (
      <ViewerLayout title={data.project.title}>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold">完了しました！</h2>
            <p className="text-muted-foreground">
              トレーニングが完了しました。
            </p>
            <div className="pt-4 space-y-2 text-sm text-muted-foreground">
              <p>選択回数: {completion.choiceCount}</p>
            </div>
            <div className="pt-4 flex gap-4 justify-center">
              <Button onClick={handleRewatch} variant="outline">
                もう一度見る
              </Button>
              <Button onClick={() => window.history.back()}>戻る</Button>
            </div>
          </CardContent>
        </Card>
      </ViewerLayout>
    );
  }

  // Get current node title
  const currentNodeTitle = currentNode
    ? data.getNodeTitle(currentNode.id)
    : '読み込み中...';
  const currentNodeDescription = currentNode
    ? data.getNodeDescription(currentNode.id)
    : '';

  return (
    <ViewerLayout title={data.project.title}>
      {/* Video player area */}
      <div className={cn(
        "mx-auto",
        data.project.aspectRatio === 'portrait' ? 'max-w-md' : 'max-w-5xl'
      )}>
        <BranchTransition isTransitioning={isTransitioning}>
          <div
            ref={videoContainerRef}
            className={cn(
              "relative rounded-lg overflow-hidden shadow-2xl bg-black",
              isFullscreen && "flex items-center justify-center w-screen h-screen"
            )}
          >
            {/* Video player */}
            <div className={cn(
              "relative w-full",
              data.project.aspectRatio === 'portrait' ? 'aspect-[9/16]' : 'aspect-video',
              isFullscreen && data.project.aspectRatio === 'portrait'
                ? 'h-full max-h-screen'
                : isFullscreen
                  ? 'h-full max-w-full'
                  : ''
            )}>
              {/* VideoPlayer */}
              <VideoPlayer
                url={currentVideoUrl}
                playing={!isChoiceVisible}
                onTimeReached={handleChoiceDisplayTime}
                {...(currentNode?.choiceTimestamp != null && {
                  choiceDisplayTime: currentNode.choiceTimestamp,
                })}
                onEnded={handleVideoEnd}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controls={!isChoiceVisible && !isFullscreen}
                aspectRatio={data.project.aspectRatio}
              />

              {/* Choice overlay */}
              <ChoiceOverlay
                choices={choices}
                isVisible={isChoiceVisible}
                onSelect={handleChoiceSelect}
                remainingTime={remainingTime}
                timeLimit={timeLimit}
              />

              {/* Timer */}
              {isChoiceVisible && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
                  <CountdownTimer
                    onTimeout={handleTimeout}
                    variant="compact"
                    visible={isChoiceVisible}
                  />
                </div>
              )}

              {/* Fullscreen toggle button */}
              <button
                onClick={toggleFullscreen}
                className={cn(
                  "absolute z-40 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-all",
                  isFullscreen ? "bottom-4 right-4" : "bottom-2 right-2"
                )}
                aria-label={isFullscreen ? "フルスクリーン解除" : "フルスクリーン"}
              >
                {isFullscreen ? (
                  <Minimize className="w-6 h-6" />
                ) : (
                  <Maximize className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </BranchTransition>

        {/* Video preloader for seamless transitions */}
        {pendingTargetUrl && (
          <VideoPreloader
            url={pendingTargetUrl}
            onLoaded={handlePreloadComplete}
            onProgress={handlePreloadProgress}
          />
        )}

        {/* Video info */}
        <div className="mt-6 space-y-2">
          <h2 className="text-xl font-semibold text-white">{currentNodeTitle}</h2>
          {currentNodeDescription && (
            <p className="text-gray-400">{currentNodeDescription}</p>
          )}
        </div>

        {/* Progress display */}
        <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
          <span>選択回数: {choiceHistory.length}</span>
          {currentNode && (
            <span>
              {currentNode.isEndNode ? '終了ノード' : '動画ノード'}
            </span>
          )}
          {isLoading && <span className="text-yellow-500">読み込み中...</span>}
          {currentVideoUrl && (
            <span className="text-green-500 truncate max-w-xs" title={currentVideoUrl}>
              動画: {currentVideoUrl.split('/').pop()}
            </span>
          )}
        </div>
      </div>
    </ViewerLayout>
  );
}
