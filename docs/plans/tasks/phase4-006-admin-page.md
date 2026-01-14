# タスク: 管理画面ページ統合

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase4-006 |
| フェーズ | Phase 4: 管理画面 |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L2（統合） |

---

## 概要

管理画面のエディターページとダッシュボードページを作成する。AdminLayout の実装とプレビュー機能を追加する。

---

## 前提条件

### 依存タスク
- phase4-005-branch-api.md（分岐設定APIが実装されていること）

### 前提成果物
- `src/components/editor/FlowEditor.tsx`
- `src/components/upload/VideoUploader.tsx`
- API ルート各種
- 認証機能（AdminGuard）

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/(admin)/editor/[projectId]/page.tsx` | 新規作成 |
| `src/app/(admin)/dashboard/page.tsx` | 新規作成 |
| `src/app/(admin)/layout.tsx` | 新規作成 |
| `src/components/layout/AdminLayout.tsx` | 新規作成 |

---

## 実装詳細

### ステップ 1: AdminLayout 作成

`src/components/layout/AdminLayout.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { href: '/dashboard', label: 'ダッシュボード', icon: '📊' },
    { href: '/editor', label: 'プロジェクト', icon: '📁' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* サイドバー */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold">管理画面</h1>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                    pathname.startsWith(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  )}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="mb-4">
            <p className="text-sm text-gray-400">{user?.email}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            ログアウト
          </Button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 bg-gray-100 dark:bg-gray-950">
        {children}
      </main>
    </div>
  );
}
```

### ステップ 2: admin レイアウト作成

`src/app/(admin)/layout.tsx`:

```typescript
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { SessionProvider } from 'next-auth/react';

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'admin') {
    redirect('/unauthorized');
  }

  return (
    <SessionProvider session={session}>
      <AdminLayout>{children}</AdminLayout>
    </SessionProvider>
  );
}
```

### ステップ 3: ダッシュボードページ作成

`src/app/(admin)/dashboard/page.tsx`:

```typescript
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getProjects } from '@/lib/services/video.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const session = await auth();
  const projects = await getProjects(session?.user?.id);

  const publishedCount = projects.filter((p) => p.isPublished).length;
  const draftCount = projects.length - publishedCount;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        <Button asChild>
          <Link href="/editor/new">新規プロジェクト作成</Link>
        </Button>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              総プロジェクト数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{projects.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              公開中
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{publishedCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              下書き
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-400">{draftCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* プロジェクト一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>最近のプロジェクト</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              プロジェクトがありません。新規作成してください。
            </p>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{project.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(project.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs rounded',
                        project.isPublished
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {project.isPublished ? '公開中' : '下書き'}
                    </span>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/editor/${project.id}`}>編集</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
```

### ステップ 4: エディターページ作成

`src/app/(admin)/editor/[projectId]/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FlowEditor } from '@/components/editor';
import { VideoUploader } from '@/components/upload';
import { useEditorStore } from '@/stores/editorStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');

  const { isDirty, initializeEditor, selectedNodeId, nodes, edges } = useEditorStore();

  // プロジェクトデータを読み込み
  useEffect(() => {
    async function loadProject() {
      if (projectId === 'new') {
        // 新規プロジェクト
        initializeEditor('new', [], []);
        setProjectTitle('新規プロジェクト');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/videos/${projectId}`);
        if (!response.ok) throw new Error('プロジェクトの読み込みに失敗しました');

        const { data } = await response.json();

        // ノードとエッジをReact Flow形式に変換
        const flowNodes = data.nodes.map((node: any) => ({
          id: node.id,
          type: node.type === 'video' ? 'videoNode' : node.type === 'end' ? 'endNode' : 'choiceNode',
          position: { x: node.positionX, y: node.positionY },
          data: {
            title: node.title,
            videoUrl: node.videoUrl,
            thumbnailUrl: node.thumbnailUrl,
            choices: data.choices.filter((c: any) => c.nodeId === node.id),
            timeLimit: data.branchConfigs.find((b: any) => b.nodeId === node.id)?.timeLimit ?? 15,
          },
        }));

        const flowEdges = data.edges.map((edge: any) => ({
          id: edge.id,
          source: edge.sourceNodeId,
          target: edge.targetNodeId,
          type: 'smoothstep',
        }));

        initializeEditor(projectId, flowNodes, flowEdges);
        setProjectTitle(data.project.title);
      } catch (error) {
        console.error('Load project error:', error);
        alert('プロジェクトの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    loadProject();
  }, [projectId, initializeEditor]);

  // 保存処理
  const handleSave = async () => {
    setIsSaving(true);

    try {
      // 新規プロジェクトの場合は作成
      if (projectId === 'new') {
        const createResponse = await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: projectTitle }),
        });

        if (!createResponse.ok) throw new Error('プロジェクト作成に失敗しました');

        const { data } = await createResponse.json();
        router.push(`/editor/${data.project.id}`);
        return;
      }

      // TODO: ノードとエッジの保存処理
      alert('保存しました');
    } catch (error) {
      console.error('Save error:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // プレビュー
  const handlePreview = () => {
    if (projectId !== 'new') {
      window.open(`/watch/${projectId}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white dark:bg-gray-800 border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            ← 戻る
          </Button>
          <Input
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="w-64"
          />
          {isDirty && (
            <span className="text-sm text-yellow-600">未保存の変更があります</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={projectId === 'new'}>
            プレビュー
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </header>

      {/* メインエリア */}
      <div className="flex-1 flex">
        {/* エディタ */}
        <div className="flex-1">
          <FlowEditor />
        </div>

        {/* サイドパネル */}
        <aside className="w-80 bg-white dark:bg-gray-800 border-l p-4 overflow-y-auto">
          {selectedNodeId ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ノード設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">タイトル</label>
                  <Input placeholder="ノードタイトル" />
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      動画をアップロード
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>動画アップロード</DialogTitle>
                    </DialogHeader>
                    <VideoUploader
                      projectId={projectId}
                      onUploadComplete={(result) => {
                        console.log('アップロード完了:', result);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>ノードを選択してください</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
```

### ステップ 5: layout インデックス更新

`src/components/layout/index.ts`:

```typescript
export { ViewerLayout } from './ViewerLayout';
export type { ViewerLayoutProps } from './ViewerLayout';

export { AdminLayout } from './AdminLayout';
export type { AdminLayoutProps } from './AdminLayout';
```

---

## 完了条件

- [x] AdminLayout が作成されている
- [x] ダッシュボードページが表示される
- [x] エディターページが表示される
- [x] AC-A-005: プレビューで動画フローを確認できる
- [x] フロー作成→保存→再読み込みの一連動作が機能する

---

## テスト方法

### 1. ダッシュボードテスト

```bash
npm run dev
# admin@example.com でログイン
# http://localhost:3000/dashboard にアクセス

# 確認項目:
# - 統計カードが表示される
# - プロジェクト一覧が表示される
# - 新規プロジェクト作成ボタンが機能する
```

### 2. エディターテスト

```
1. 「新規プロジェクト作成」をクリック
2. ノードをドラッグ&ドロップで追加
3. ノードを選択してサイドパネルを確認
4. 「保存」ボタンをクリック
5. 「プレビュー」ボタンで視聴画面を確認
```

---

## 参照設計書セクション

- DESIGN-FE-2026-001 セクション4.2: ルーティング構造
- DESIGN-FE-2026-001 セクション4.3: レイアウト構造

---

## 成果物

- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/dashboard/page.tsx`
- `src/app/(admin)/editor/[projectId]/page.tsx`
- `src/components/layout/AdminLayout.tsx`

---

## 次のタスク

- phase4-completion.md: Phase 4 完了検証
