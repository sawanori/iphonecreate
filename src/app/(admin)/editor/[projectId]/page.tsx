'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FlowEditor } from '@/components/editor';
import { ChoiceEditor, type EditorChoice } from '@/components/editor/ChoiceEditor';
import { VideoSelector } from '@/components/editor/VideoSelector';
import { useEditorStore } from '@/stores/editorStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Video node type from API
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

/**
 * Choice type from API
 */
interface ApiChoice {
  id: string;
  nodeId: string;
  label: string;
  targetNodeId: string | null;
}

/**
 * Branch config type from API
 */
interface ApiBranchConfig {
  nodeId: string;
  timeLimit: number | null;
}

/**
 * Edge type from API
 */
interface ApiEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
}

/**
 * Project data type from API
 */
interface ProjectData {
  project: {
    id: string;
    title: string;
    aspectRatio?: 'landscape' | 'portrait';
    isPublished?: boolean;
  };
  nodes: ApiVideoNode[];
  choices: ApiChoice[];
  branchConfigs: ApiBranchConfig[];
  edges: ApiEdge[];
}

/**
 * Editor page component
 */
export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'landscape' | 'portrait'>('landscape');
  const [isPublished, setIsPublished] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const { isDirty, initializeEditor, selectedNodeId, nodes, edges, updateNode, setIsDirty, removeNode } =
    useEditorStore();

  // Get selected node
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId);
  }, [nodes, selectedNodeId]);

  // Get available target nodes for choices
  const availableNodes = useMemo(() => {
    return nodes.map((n) => ({
      id: n.id,
      title: (n.data?.title as string) || 'Untitled',
      type: n.type || 'videoNode',
    }));
  }, [nodes]);

  /**
   * Load project data
   */
  const loadProject = useCallback(async () => {
    if (projectId === 'new') {
      initializeEditor('new', [], []);
      setProjectTitle('New Project');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/videos/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to load project');
      }

      const { data } = (await response.json()) as { data: ProjectData };

      const flowNodes = data.nodes.map((node: ApiVideoNode) => ({
        id: node.id,
        type:
          node.type === 'video'
            ? 'videoNode'
            : node.type === 'end'
              ? 'endNode'
              : node.type === 'videoNode'
                ? 'videoNode'
                : node.type === 'endNode'
                  ? 'endNode'
                  : 'videoNode',
        position: { x: node.positionX, y: node.positionY },
        data: {
          title: node.title,
          videoUrl: node.videoUrl,
          thumbnailUrl: node.thumbnailUrl,
          choices: data.choices
            .filter((c: ApiChoice) => c.nodeId === node.id)
            .map((c: ApiChoice) => ({
              id: c.id,
              label: c.label,
              targetNodeId: c.targetNodeId,
            })),
          timeLimit:
            data.branchConfigs.find(
              (b: ApiBranchConfig) => b.nodeId === node.id
            )?.timeLimit ?? 15,
        },
      }));

      const flowEdges = data.edges.map((edge: ApiEdge) => ({
        id: edge.id,
        source: edge.sourceNodeId,
        target: edge.targetNodeId,
        type: 'smoothstep',
      }));

      initializeEditor(projectId, flowNodes, flowEdges);
      setProjectTitle(data.project.title);
      setAspectRatio(data.project.aspectRatio || 'landscape');
      setIsPublished(data.project.isPublished || false);
    } catch {
      alert('プロジェクトの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, initializeEditor]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  /**
   * Handle save
   */
  const handleSave = async () => {
    setIsSaving(true);

    try {
      if (projectId === 'new') {
        const createResponse = await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: projectTitle }),
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create project');
        }

        const { data } = await createResponse.json();
        router.push(`/editor/${data.project.id}`);
        return;
      }

      // Collect all choices from nodes
      const allChoices = nodes.flatMap((node) => {
        const nodeChoices = (node.data?.choices as EditorChoice[]) || [];
        return nodeChoices.map((choice) => ({
          id: choice.id,
          nodeId: node.id,
          label: choice.label,
          targetNodeId: choice.targetNodeId,
        }));
      });

      // Collect branch configs (time limits) from nodes
      const branchConfigs = nodes
        .filter((node) => node.type === 'videoNode')
        .map((node) => ({
          nodeId: node.id,
          timeLimit: (node.data?.timeLimit as number) || 15,
        }));

      // Get project thumbnail from first video node with thumbnail
      const firstThumbnail = nodes.find(
        (node) => node.type === 'videoNode' && node.data?.thumbnailUrl
      )?.data?.thumbnailUrl as string | undefined;

      const updateResponse = await fetch(`/api/videos/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: projectTitle,
          aspectRatio: aspectRatio,
          isPublished: isPublished,
          thumbnailUrl: firstThumbnail || undefined,
          nodes: nodes.map((node) => ({
            id: node.id,
            type: node.type,
            title: node.data?.title || '',
            positionX: Math.round(node.position.x),
            positionY: Math.round(node.position.y),
            videoUrl: node.data?.videoUrl || null,
            thumbnailUrl: node.data?.thumbnailUrl || null,
          })),
          edges: edges.map((edge) => ({
            id: edge.id,
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
          })),
          choices: allChoices,
          branchConfigs: branchConfigs,
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => null);
        console.error('Save error:', errorData);
        throw new Error(errorData?.message || 'Failed to save project');
      }

      setIsDirty(false);
      alert('保存しました');
    } catch {
      alert('プロジェクトの保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle preview
   */
  const handlePreview = () => {
    if (projectId !== 'new') {
      window.open(`/watch/${projectId}`, '_blank');
    }
  };

  /**
   * Handle video selection (from upload or library)
   */
  const handleVideoSelect = (videoUrl: string, thumbnailUrl?: string, aspectRatio?: 'landscape' | 'portrait') => {
    setUploadDialogOpen(false);
    if (selectedNodeId) {
      const updateData: { videoUrl: string; thumbnailUrl?: string; aspectRatio?: 'landscape' | 'portrait' } = { videoUrl };
      if (thumbnailUrl) {
        updateData.thumbnailUrl = thumbnailUrl;
      }
      if (aspectRatio) {
        updateData.aspectRatio = aspectRatio;
      }
      updateNode(selectedNodeId, updateData);
    }
  };

  /**
   * Handle node title change
   */
  const handleNodeTitleChange = (title: string) => {
    if (selectedNodeId) {
      updateNode(selectedNodeId, { title });
    }
  };

  /**
   * Handle choices change
   */
  const handleChoicesChange = (choices: EditorChoice[]) => {
    if (selectedNodeId) {
      updateNode(selectedNodeId, { choices });
    }
  };

  /**
   * Handle time limit change
   */
  const handleTimeLimitChange = (timeLimit: number) => {
    if (selectedNodeId) {
      updateNode(selectedNodeId, { timeLimit });
    }
  };

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  // Auto-open side panel when node is selected on mobile
  useEffect(() => {
    if (selectedNodeId) {
      setIsSidePanelOpen(true);
    }
  }, [selectedNodeId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div
          className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"
          role="status"
          aria-label="読み込み中"
        />
      </div>
    );
  }

  const isVideoNode = selectedNode?.type === 'videoNode';

  return (
    <div className="h-screen flex flex-col">
      {/* Header - Mobile */}
      <header className="bg-white dark:bg-gray-800 border-b">
        {/* Top row */}
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="shrink-0">
            <svg
              className="w-4 h-4 sm:mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="hidden sm:inline">戻る</span>
          </Button>

          <Input
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="flex-1 min-w-0 max-w-xs"
            aria-label="Project title"
          />

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={projectId === 'new'}
              className="hidden sm:flex"
            >
              プレビュー
            </Button>
            <Button
              size="sm"
              onClick={handlePreview}
              disabled={projectId === 'new'}
              variant="outline"
              className="sm:hidden"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="min-w-[50px]">
              {isSaving ? '...' : '保存'}
            </Button>
          </div>
        </div>

        {/* Bottom row - mobile options */}
        <div className="px-3 py-2 border-t flex items-center gap-2 overflow-x-auto">
          <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as 'landscape' | 'portrait')}>
            <SelectTrigger className="w-28 sm:w-32 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="landscape">16:9 横長</SelectItem>
              <SelectItem value="portrait">9:16 縦長</SelectItem>
            </SelectContent>
          </Select>

          {/* 公開トグル */}
          {projectId !== 'new' && (
            <Button
              variant={isPublished ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsPublished(!isPublished)}
              className={isPublished ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isPublished ? '公開中' : '非公開'}
            </Button>
          )}

          {isDirty && (
            <span className="text-xs text-yellow-600 whitespace-nowrap">未保存</span>
          )}

          {/* Mobile panel toggle */}
          <Button
            variant={isSidePanelOpen ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="ml-auto shrink-0 lg:hidden"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            設定
          </Button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Editor */}
        <div className="flex-1">
          <FlowEditor />
        </div>

        {/* Mobile overlay */}
        {isSidePanelOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsSidePanelOpen(false)}
          />
        )}

        {/* Side panel */}
        <aside
          className={`
            fixed lg:relative inset-y-0 right-0 z-50
            w-[85vw] sm:w-80 bg-white dark:bg-gray-800 border-l p-4 overflow-y-auto
            transform transition-transform duration-300 ease-out
            ${isSidePanelOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Mobile close button */}
          <div className="lg:hidden flex justify-between items-center mb-4">
            <h2 className="font-semibold">ノード設定</h2>
            <Button variant="ghost" size="sm" onClick={() => setIsSidePanelOpen(false)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {selectedNode ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {isVideoNode ? '動画ノード設定' : '終了ノード設定'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Node Title */}
                  <div>
                    <Label htmlFor="node-title" className="text-sm font-medium">
                      タイトル
                    </Label>
                    <Input
                      id="node-title"
                      value={(selectedNode.data?.title as string) || ''}
                      onChange={(e) => handleNodeTitleChange(e.target.value)}
                      placeholder="ノードのタイトル"
                      className="mt-1"
                    />
                  </div>

                  {/* Video Upload (only for video nodes) */}
                  {isVideoNode && (
                    <>
                      <div>
                        <Label className="text-sm font-medium">動画</Label>
                        {selectedNode.data?.videoUrl ? (
                          <div className="mt-1 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                            <p className="text-green-700 dark:text-green-300 truncate">
                              アップロード済み
                            </p>
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-gray-500">未アップロード</p>
                        )}
                        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full mt-2">
                              {selectedNode.data?.videoUrl ? '動画を変更' : '動画を選択'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>動画を選択</DialogTitle>
                            </DialogHeader>
                            <VideoSelector
                              projectId={projectId}
                              currentVideoUrl={selectedNode.data?.videoUrl as string | undefined}
                              onVideoSelect={handleVideoSelect}
                              onClose={() => setUploadDialogOpen(false)}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>

                      {/* Divider */}
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium mb-3">分岐設定</h3>
                        <ChoiceEditor
                          choices={(selectedNode.data?.choices as EditorChoice[]) || []}
                          timeLimit={(selectedNode.data?.timeLimit as number) || 15}
                          availableNodes={availableNodes}
                          currentNodeId={selectedNodeId!}
                          onChoicesChange={handleChoicesChange}
                          onTimeLimitChange={handleTimeLimitChange}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* ノード削除ボタン */}
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  onClick={() => {
                    if (window.confirm('このノードを削除しますか？')) {
                      removeNode(selectedNodeId!);
                    }
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  ノードを削除
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8 px-4">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p className="font-medium text-gray-700 mb-2">ノードを選択してください</p>
              <p className="text-sm text-gray-400">
                キャンバス上のノードをタップすると、ここで設定を編集できます
              </p>
              <div className="mt-6 p-3 bg-gray-50 rounded-lg text-left">
                <p className="text-xs font-medium text-gray-600 mb-2">使い方:</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• ノードをタップして選択</li>
                  <li>• ツールバーからノードを追加</li>
                  <li>• ピンチでズーム操作</li>
                </ul>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
