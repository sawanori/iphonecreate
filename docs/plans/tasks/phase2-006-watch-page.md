# タスク: 視聴画面ページ統合

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase2-006 |
| フェーズ | Phase 2: 視聴画面MVP |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L2（統合） |

---

## 概要

これまで作成したコンポーネントを統合し、視聴画面ページを作成する。ViewerLayout の実装とモックデータでの動作確認を行う。

---

## 前提条件

### 依存タスク
- phase2-005-branch-transition.md（分岐遷移ロジックが実装されていること）

### 前提成果物
- `src/components/video/VideoPlayer.tsx`
- `src/components/video/ChoiceOverlay.tsx`
- `src/components/video/CountdownTimer.tsx`
- `src/components/video/BranchTransition.tsx`
- `src/hooks/useVideoPlayer.ts`
- `src/hooks/useChoiceTimer.ts`
- `src/stores/videoStore.ts`

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/(viewer)/watch/[videoId]/page.tsx` | 新規作成 |
| `src/app/(viewer)/layout.tsx` | 新規作成 |
| `src/components/layout/ViewerLayout.tsx` | 新規作成 |
| `src/components/layout/index.ts` | 新規作成 |
| `src/lib/mock/video-data.ts` | 新規作成 |

---

## 実装詳細

### ステップ 1: モックデータ作成

`src/lib/mock/video-data.ts`:

```typescript
import type { VideoNode, BranchConfig, VideoProject } from '@/types';

/**
 * モックプロジェクトデータ
 */
export const mockProject: VideoProject = {
  id: 'project-001',
  title: 'インタラクティブ研修動画サンプル',
  description: '分岐型の研修動画サンプルです。選択肢を選んでストーリーを進めてください。',
  thumbnailUrl: '/images/thumbnail.jpg',
  startNodeId: 'node-intro',
  isPublished: true,
  createdBy: 'admin-001',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-14T00:00:00Z',
};

/**
 * モック動画ノードデータ
 */
export const mockNodes: VideoNode[] = [
  {
    id: 'node-intro',
    type: 'video',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    thumbnailUrl: '/images/node-intro.jpg',
    title: 'イントロダクション',
    description: '研修の導入動画です。',
    choiceDisplayTime: 8,
    duration: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-14T00:00:00Z',
  },
  {
    id: 'node-path-a',
    type: 'video',
    videoUrl: 'https://test-videos.co.uk/vids/jellyfish/mp4/720/Jellyfish_720_10s_1MB.mp4',
    thumbnailUrl: '/images/node-path-a.jpg',
    title: 'パスA - 営業スキル',
    description: '営業スキルについて学びます。',
    choiceDisplayTime: 8,
    duration: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-14T00:00:00Z',
  },
  {
    id: 'node-path-b',
    type: 'video',
    videoUrl: 'https://test-videos.co.uk/vids/sintel/mp4/720/Sintel_720_10s_1MB.mp4',
    thumbnailUrl: '/images/node-path-b.jpg',
    title: 'パスB - 技術スキル',
    description: '技術スキルについて学びます。',
    choiceDisplayTime: 8,
    duration: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-14T00:00:00Z',
  },
  {
    id: 'node-ending-success',
    type: 'end',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    thumbnailUrl: '/images/node-ending.jpg',
    title: '研修完了',
    description: '研修が完了しました。おめでとうございます！',
    duration: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-14T00:00:00Z',
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
        text: '営業スキルを学ぶ',
        targetNodeId: 'node-path-a',
        order: 0,
      },
      {
        id: 'choice-intro-b',
        text: '技術スキルを学ぶ',
        targetNodeId: 'node-path-b',
        order: 1,
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
        text: '研修を完了する',
        targetNodeId: 'node-ending-success',
        order: 0,
      },
      {
        id: 'choice-a-b',
        text: '技術スキルも学ぶ',
        targetNodeId: 'node-path-b',
        order: 1,
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
        text: '研修を完了する',
        targetNodeId: 'node-ending-success',
        order: 0,
      },
    ],
    timeLimit: 15,
    defaultChoiceId: 'choice-b-end',
  },
];

/**
 * 動画IDからプロジェクトデータを取得（モック）
 */
export function getMockVideoData(videoId: string) {
  // 実際のAPIでは videoId を使用してデータを取得
  return {
    project: mockProject,
    nodes: mockNodes,
    branchConfigs: mockBranchConfigs,
  };
}
```

### ステップ 2: ViewerLayout 作成

`src/components/layout/ViewerLayout.tsx`:

```typescript
'use client';

import { cn } from '@/lib/utils';

/**
 * ViewerLayout コンポーネントのProps
 */
export interface ViewerLayoutProps {
  /** タイトル */
  title?: string;
  /** 子要素 */
  children: React.ReactNode;
  /** 追加のクラス名 */
  className?: string;
}

/**
 * 視聴画面レイアウト
 */
export function ViewerLayout({
  title,
  children,
  className,
}: ViewerLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-gray-950', className)}>
      {/* ヘッダー */}
      {title && (
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="container mx-auto px-4 py-3">
            <h1 className="text-white text-lg font-semibold truncate">
              {title}
            </h1>
          </div>
        </header>
      )}

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
        <div className="container mx-auto px-4 py-3 text-center">
          <p className="text-gray-500 text-sm">
            Interactive Video Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
```

### ステップ 3: layout インデックスファイル作成

`src/components/layout/index.ts`:

```typescript
export { ViewerLayout } from './ViewerLayout';
export type { ViewerLayoutProps } from './ViewerLayout';
```

### ステップ 4: viewer レイアウト作成

`src/app/(viewer)/layout.tsx`:

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '視聴画面 | Interactive Video Platform',
  description: 'インタラクティブ動画を視聴',
};

export default function ViewerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

### ステップ 5: 視聴画面ページ作成

`src/app/(viewer)/watch/[videoId]/page.tsx`:

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  VideoPlayer,
  ChoiceOverlay,
  CountdownTimer,
  BranchTransition,
} from '@/components/video';
import { ViewerLayout } from '@/components/layout';
import { useVideoPlayer, useChoiceTimer } from '@/hooks';
import { useVideoStore } from '@/stores/videoStore';
import { getMockVideoData } from '@/lib/mock/video-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Choice, VideoProject, VideoNode, BranchConfig } from '@/types';

/**
 * 視聴完了状態
 */
interface CompletionState {
  isCompleted: boolean;
  totalTime: number;
  choiceCount: number;
}

/**
 * 視聴画面ページ
 */
export default function WatchPage() {
  const params = useParams();
  const videoId = params.videoId as string;

  // データ取得（実際はAPI経由）
  const [data, setData] = useState<{
    project: VideoProject;
    nodes: VideoNode[];
    branchConfigs: BranchConfig[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completion, setCompletion] = useState<CompletionState | null>(null);

  // ストア状態
  const { isChoiceVisible, choices, remainingTime, timeLimit, choiceHistory } =
    useVideoStore();
  const { setIsPlaying, reset: resetStore } = useVideoStore();

  // データ読み込み
  useEffect(() => {
    try {
      const mockData = getMockVideoData(videoId);
      setData(mockData);
    } catch (e) {
      setError('動画データの読み込みに失敗しました');
    }
  }, [videoId]);

  // 視聴完了処理
  const handleEnd = useCallback(
    (nodeId: string) => {
      const node = data?.nodes.find((n) => n.id === nodeId);
      if (node?.type === 'end') {
        setCompletion({
          isCompleted: true,
          totalTime: choiceHistory.reduce((acc, h) => acc + 1, 0) * 10, // 概算
          choiceCount: choiceHistory.length,
        });
      }
    },
    [data?.nodes, choiceHistory]
  );

  // 選択時の処理
  const handleChoice = useCallback(
    (nodeId: string, choice: Choice, isTimeout: boolean) => {
      console.log(`選択: ${choice.text} (タイムアウト: ${isTimeout})`);
    },
    []
  );

  // 遷移完了時の処理
  const handleTransitionComplete = useCallback(
    (fromNodeId: string, toNodeId: string) => {
      console.log(`遷移完了: ${fromNodeId} → ${toNodeId}`);
    },
    []
  );

  // useVideoPlayer フック
  const {
    currentNode,
    currentVideoUrl,
    handleChoiceSelect,
    handleChoiceDisplayTime,
    handleVideoEnd,
    handleTimeout,
    isTransitioning,
    isLoading,
  } = useVideoPlayer({
    nodes: data?.nodes ?? [],
    branchConfigs: data?.branchConfigs ?? [],
    initialNodeId: data?.project.startNodeId ?? '',
    onTransitionComplete: handleTransitionComplete,
    onChoice: handleChoice,
    onEnd: handleEnd,
  });

  // 再視聴
  const handleRewatch = useCallback(() => {
    setCompletion(null);
    resetStore();
  }, [resetStore]);

  // ローディング表示
  if (!data) {
    return (
      <ViewerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </ViewerLayout>
    );
  }

  // エラー表示
  if (error) {
    return (
      <ViewerLayout>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              再読み込み
            </Button>
          </CardContent>
        </Card>
      </ViewerLayout>
    );
  }

  // 完了表示
  if (completion?.isCompleted) {
    return (
      <ViewerLayout title={data.project.title}>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold">研修完了！</h2>
            <p className="text-muted-foreground">
              おめでとうございます。研修を完了しました。
            </p>
            <div className="pt-4 space-y-2 text-sm text-muted-foreground">
              <p>選択回数: {completion.choiceCount}回</p>
            </div>
            <div className="pt-4 flex gap-4 justify-center">
              <Button onClick={handleRewatch} variant="outline">
                もう一度視聴
              </Button>
              <Button onClick={() => window.history.back()}>
                一覧に戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      </ViewerLayout>
    );
  }

  return (
    <ViewerLayout title={data.project.title}>
      {/* 動画プレイヤーエリア */}
      <div className="max-w-5xl mx-auto">
        <BranchTransition isTransitioning={isTransitioning}>
          <div className="relative rounded-lg overflow-hidden shadow-2xl">
            {/* 動画プレイヤー */}
            <VideoPlayer
              url={currentVideoUrl}
              playing={!isChoiceVisible && !isTransitioning}
              onTimeReached={handleChoiceDisplayTime}
              choiceDisplayTime={currentNode?.choiceDisplayTime}
              onEnded={handleVideoEnd}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onReady={() => console.log('動画準備完了')}
              controls={!isChoiceVisible}
            />

            {/* 選択肢オーバーレイ */}
            <ChoiceOverlay
              choices={choices}
              isVisible={isChoiceVisible}
              onSelect={(choice) => handleChoiceSelect(choice)}
              remainingTime={remainingTime}
              timeLimit={timeLimit}
            />

            {/* タイマー（選択肢と別表示する場合） */}
            {isChoiceVisible && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
                <CountdownTimer
                  onTimeout={handleTimeout}
                  variant="compact"
                  visible={isChoiceVisible}
                />
              </div>
            )}
          </div>
        </BranchTransition>

        {/* 動画情報 */}
        <div className="mt-6 space-y-2">
          <h2 className="text-xl font-semibold text-white">
            {currentNode?.title ?? '読み込み中...'}
          </h2>
          {currentNode?.description && (
            <p className="text-gray-400">{currentNode.description}</p>
          )}
        </div>

        {/* 進捗表示 */}
        <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
          <span>選択回数: {choiceHistory.length}</span>
          {currentNode && (
            <span>
              ノードタイプ:{' '}
              {currentNode.type === 'end' ? '終了' : '動画'}
            </span>
          )}
        </div>
      </div>
    </ViewerLayout>
  );
}
```

---

## 完了条件

- [x] 視聴画面ページが作成されている
- [x] ViewerLayout が適用されている
- [x] 動画再生から選択肢表示、分岐遷移、完了までの一連フローが動作する
- [x] モックデータで動作確認ができる
- [x] エラーバウンダリが機能する

---

## テスト方法

### 1. ページアクセステスト

```bash
npm run dev
# http://localhost:3000/watch/test-video にアクセス

# 確認項目:
# - ページが表示される
# - 動画が読み込まれる
# - 動画が再生される
```

### 2. 一連フロー動作確認

```
1. 動画が自動再生される
2. 8秒後（choiceDisplayTime）に選択肢が表示される
3. 選択肢を選ぶと遷移アニメーションが表示される
4. 次の動画が再生される
5. 終了ノードに到達すると完了画面が表示される
```

### 3. タイムアウト動作確認

```
1. 選択肢表示後、何も選択しない
2. タイマーが0になる
3. defaultChoiceId がある場合: 自動遷移
4. defaultChoiceId がない場合: 動画一時停止
```

### 4. エラー表示確認

```typescript
// getMockVideoData で意図的にエラーを発生させる
throw new Error('テストエラー');
```

### 5. レスポンシブ確認

```bash
# Chrome DevTools > Device Toolbar
# 各ブレークポイントでレイアウト崩れがないことを確認
```

---

## 参照設計書セクション

- DESIGN-FE-2026-001 セクション4.2: ルーティング構造
- DESIGN-FE-2026-001 セクション4.3: レイアウト構造
- DESIGN-FE-2026-001 セクション5.1: 視聴画面コンポーネント

---

## 成果物

- `src/app/(viewer)/watch/[videoId]/page.tsx`: 視聴画面ページ
- `src/app/(viewer)/layout.tsx`: viewer レイアウト
- `src/components/layout/ViewerLayout.tsx`: ViewerLayout コンポーネント
- `src/lib/mock/video-data.ts`: モックデータ

---

## 注意事項

- モックデータは開発用。本番ではAPI経由でデータを取得
- 動画URLは外部サービスのものを使用しているため、変更される可能性あり
- 完了状態は現時点ではローカルストアのみで管理（永続化は Phase 5 で実装）

---

## 次のタスク

- phase2-007-responsive.md: レスポンシブ対応
