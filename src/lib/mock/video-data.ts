/**
 * モックデータ
 *
 * 対応タスク: phase2-006-watch-page.md
 * 開発用のモックデータを提供する
 */

import type { VideoProject, VideoNode, BranchConfig, BranchEdge } from '@/types';

/**
 * モックプロジェクトデータ
 * VideoProject 型に合わせて調整
 */
export const mockProject: VideoProject = {
  id: 'project-001',
  title: 'Interactive Training Video Sample',
  description:
    'Sample branching training video. Choose options to progress through the story.',
  thumbnailUrl: '/images/thumbnail.jpg',
  status: 'published',
  createdBy: 'admin-001',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-14T00:00:00Z',
};

/**
 * 開始ノードID
 */
export const startNodeId = 'node-intro';

/**
 * モック動画ノードデータ
 * VideoNode 型に合わせて調整
 */
export const mockNodes: VideoNode[] = [
  {
    id: 'node-intro',
    videoUrl:
      'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    thumbnailUrl: '/images/node-intro.jpg',
    duration: 10,
    choiceTimestamp: 8, // 選択肢表示時間（秒）
    timeLimit: 15,
    choices: [
      {
        id: 'choice-intro-a',
        label: 'Learn Sales Skills',
        nextNodeId: 'node-path-a',
      },
      {
        id: 'choice-intro-b',
        label: 'Learn Technical Skills',
        nextNodeId: 'node-path-b',
      },
    ],
    isEndNode: false,
    position: { x: 0, y: 0 },
  },
  {
    id: 'node-path-a',
    videoUrl:
      'https://test-videos.co.uk/vids/jellyfish/mp4/720/Jellyfish_720_10s_1MB.mp4',
    thumbnailUrl: '/images/node-path-a.jpg',
    duration: 10,
    choiceTimestamp: 8,
    timeLimit: 15,
    choices: [
      {
        id: 'choice-a-end',
        label: 'Complete Training',
        nextNodeId: 'node-ending-success',
      },
      {
        id: 'choice-a-b',
        label: 'Also Learn Technical Skills',
        nextNodeId: 'node-path-b',
      },
    ],
    isEndNode: false,
    position: { x: -100, y: 100 },
  },
  {
    id: 'node-path-b',
    videoUrl:
      'https://test-videos.co.uk/vids/sintel/mp4/720/Sintel_720_10s_1MB.mp4',
    thumbnailUrl: '/images/node-path-b.jpg',
    duration: 10,
    choiceTimestamp: 8,
    timeLimit: 15,
    choices: [
      {
        id: 'choice-b-end',
        label: 'Complete Training',
        nextNodeId: 'node-ending-success',
      },
    ],
    isEndNode: false,
    position: { x: 100, y: 100 },
  },
  {
    id: 'node-ending-success',
    videoUrl:
      'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    thumbnailUrl: '/images/node-ending.jpg',
    duration: 10,
    choiceTimestamp: null,
    timeLimit: 0,
    choices: [],
    isEndNode: true,
    position: { x: 0, y: 200 },
  },
];

/**
 * モック分岐設定データ
 */
export const mockBranchConfigs: BranchConfig[] = [
  {
    nodeId: 'node-intro',
    choices: [
      {
        id: 'choice-intro-a',
        label: 'Learn Sales Skills',
        nextNodeId: 'node-path-a',
      },
      {
        id: 'choice-intro-b',
        label: 'Learn Technical Skills',
        nextNodeId: 'node-path-b',
      },
    ],
    timeLimit: 15,
    defaultChoiceId: null,
  },
  {
    nodeId: 'node-path-a',
    choices: [
      {
        id: 'choice-a-end',
        label: 'Complete Training',
        nextNodeId: 'node-ending-success',
      },
      {
        id: 'choice-a-b',
        label: 'Also Learn Technical Skills',
        nextNodeId: 'node-path-b',
      },
    ],
    timeLimit: 15,
    defaultChoiceId: 'choice-a-end',
  },
  {
    nodeId: 'node-path-b',
    choices: [
      {
        id: 'choice-b-end',
        label: 'Complete Training',
        nextNodeId: 'node-ending-success',
      },
    ],
    timeLimit: 15,
    defaultChoiceId: 'choice-b-end',
  },
];

/**
 * モック分岐エッジデータ
 * useVideoPlayer フックが BranchEdge 経由で遷移先を解決するため必要
 */
export const mockBranchEdges: BranchEdge[] = [
  // node-intro からの遷移
  {
    id: 'edge-intro-a',
    sourceNodeId: 'node-intro',
    targetNodeId: 'node-path-a',
    choiceId: 'choice-intro-a',
  },
  {
    id: 'edge-intro-b',
    sourceNodeId: 'node-intro',
    targetNodeId: 'node-path-b',
    choiceId: 'choice-intro-b',
  },
  // node-path-a からの遷移
  {
    id: 'edge-a-end',
    sourceNodeId: 'node-path-a',
    targetNodeId: 'node-ending-success',
    choiceId: 'choice-a-end',
  },
  {
    id: 'edge-a-b',
    sourceNodeId: 'node-path-a',
    targetNodeId: 'node-path-b',
    choiceId: 'choice-a-b',
  },
  // node-path-b からの遷移
  {
    id: 'edge-b-end',
    sourceNodeId: 'node-path-b',
    targetNodeId: 'node-ending-success',
    choiceId: 'choice-b-end',
  },
];

/**
 * ノードタイトルを取得
 * 既存の VideoNode 型にはtitleがないため、IDからタイトルを生成
 */
export const getNodeTitle = (nodeId: string): string => {
  const titleMap: Record<string, string> = {
    'node-intro': 'Introduction',
    'node-path-a': 'Path A - Sales Skills',
    'node-path-b': 'Path B - Technical Skills',
    'node-ending-success': 'Training Complete',
  };
  return titleMap[nodeId] ?? 'Unknown';
};

/**
 * ノード説明を取得
 */
export const getNodeDescription = (nodeId: string): string => {
  const descriptionMap: Record<string, string> = {
    'node-intro': 'Introduction video for the training.',
    'node-path-a': 'Learn about sales skills.',
    'node-path-b': 'Learn about technical skills.',
    'node-ending-success': 'Congratulations! You have completed the training.',
  };
  return descriptionMap[nodeId] ?? '';
};

/**
 * 動画IDからプロジェクトデータを取得（モック）
 */
export function getMockVideoData(_videoId: string) {
  // In actual API, videoId would be used to fetch data
  // Currently returning mock data for development
  return {
    project: mockProject,
    nodes: mockNodes,
    branchConfigs: mockBranchConfigs,
    branchEdges: mockBranchEdges,
    startNodeId,
    getNodeTitle,
    getNodeDescription,
  };
}
