# タスク: 分岐設定API

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase4-005 |
| フェーズ | Phase 4: 管理画面 |
| 作成日 | 2026-01-14 |
| 想定工数 | 2日 |
| 検証レベル | L1（単体） |

---

## 概要

動画プロジェクト、ノード、選択肢、分岐エッジのスキーマとAPIを作成する。CRUD操作と分岐データの保存・取得を実装する。

---

## 前提条件

### 依存タスク
- phase4-002-custom-nodes.md（カスタムノードが実装されていること）
- phase4-004-video-upload.md（動画アップロードが実装されていること）

### 前提成果物
- `src/lib/db/index.ts`
- `src/lib/storage/index.ts`
- 認証機能

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/lib/db/schema/videos.ts` | 新規作成 |
| `src/lib/db/schema/index.ts` | 更新 |
| `src/app/api/videos/route.ts` | 新規作成 |
| `src/app/api/videos/[videoId]/route.ts` | 新規作成 |
| `src/app/api/videos/[videoId]/branches/route.ts` | 新規作成 |
| `src/lib/services/video.service.ts` | 新規作成 |
| `src/lib/services/branch.service.ts` | 新規作成 |

---

## 実装詳細

### ステップ 1: 動画スキーマ作成

`src/lib/db/schema/videos.ts`:

```typescript
import {
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * ノードタイプEnum
 */
export const nodeTypeEnum = pgEnum('node_type', ['video', 'choice', 'end']);

/**
 * 動画プロジェクトテーブル
 */
export const videoProjects = pgTable('video_projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  startNodeId: uuid('start_node_id'),
  isPublished: boolean('is_published').default(false).notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 動画ノードテーブル
 */
export const videoNodes = pgTable('video_nodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => videoProjects.id, { onDelete: 'cascade' }),
  type: nodeTypeEnum('type').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  videoUrl: text('video_url'),
  thumbnailUrl: text('thumbnail_url'),
  choiceDisplayTime: integer('choice_display_time'),
  duration: integer('duration'),
  positionX: integer('position_x').default(0).notNull(),
  positionY: integer('position_y').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 選択肢テーブル
 */
export const choices = pgTable('choices', {
  id: uuid('id').defaultRandom().primaryKey(),
  nodeId: uuid('node_id').notNull().references(() => videoNodes.id, { onDelete: 'cascade' }),
  text: varchar('text', { length: 100 }).notNull(),
  targetNodeId: uuid('target_node_id').references(() => videoNodes.id),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * 分岐設定テーブル
 */
export const branchConfigs = pgTable('branch_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  nodeId: uuid('node_id').notNull().references(() => videoNodes.id, { onDelete: 'cascade' }).unique(),
  timeLimit: integer('time_limit').default(15).notNull(),
  defaultChoiceId: uuid('default_choice_id').references(() => choices.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 分岐エッジテーブル
 */
export const branchEdges = pgTable('branch_edges', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => videoProjects.id, { onDelete: 'cascade' }),
  sourceNodeId: uuid('source_node_id').notNull().references(() => videoNodes.id, { onDelete: 'cascade' }),
  targetNodeId: uuid('target_node_id').notNull().references(() => videoNodes.id, { onDelete: 'cascade' }),
  choiceId: uuid('choice_id').references(() => choices.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// リレーション定義
export const videoProjectsRelations = relations(videoProjects, ({ one, many }) => ({
  creator: one(users, {
    fields: [videoProjects.createdBy],
    references: [users.id],
  }),
  nodes: many(videoNodes),
  edges: many(branchEdges),
}));

export const videoNodesRelations = relations(videoNodes, ({ one, many }) => ({
  project: one(videoProjects, {
    fields: [videoNodes.projectId],
    references: [videoProjects.id],
  }),
  choices: many(choices),
  branchConfig: one(branchConfigs),
}));

export const choicesRelations = relations(choices, ({ one }) => ({
  node: one(videoNodes, {
    fields: [choices.nodeId],
    references: [videoNodes.id],
  }),
  targetNode: one(videoNodes, {
    fields: [choices.targetNodeId],
    references: [videoNodes.id],
  }),
}));
```

### ステップ 2: スキーマインデックス更新

`src/lib/db/schema/index.ts`:

```typescript
export * from './users';
export * from './videos';
```

### ステップ 3: video.service.ts 作成

`src/lib/services/video.service.ts`:

```typescript
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { videoProjects, videoNodes, choices, branchConfigs, branchEdges } from '@/lib/db/schema';
import type { VideoProject, VideoNode, BranchConfig } from '@/types';

/**
 * プロジェクト一覧を取得
 */
export async function getProjects(userId?: string) {
  const query = db
    .select()
    .from(videoProjects)
    .orderBy(desc(videoProjects.createdAt));

  if (userId) {
    return query.where(eq(videoProjects.createdBy, userId));
  }

  return query;
}

/**
 * プロジェクトを取得
 */
export async function getProject(projectId: string) {
  const result = await db
    .select()
    .from(videoProjects)
    .where(eq(videoProjects.id, projectId))
    .limit(1);

  return result[0] ?? null;
}

/**
 * プロジェクトを作成
 */
export async function createProject(data: {
  title: string;
  description?: string;
  createdBy: string;
}) {
  const result = await db
    .insert(videoProjects)
    .values(data)
    .returning();

  return result[0];
}

/**
 * プロジェクトを更新
 */
export async function updateProject(
  projectId: string,
  data: Partial<{
    title: string;
    description: string;
    thumbnailUrl: string;
    startNodeId: string;
    isPublished: boolean;
  }>
) {
  const result = await db
    .update(videoProjects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(videoProjects.id, projectId))
    .returning();

  return result[0] ?? null;
}

/**
 * プロジェクトを削除
 */
export async function deleteProject(projectId: string) {
  await db.delete(videoProjects).where(eq(videoProjects.id, projectId));
}

/**
 * プロジェクトの全データを取得
 */
export async function getProjectWithData(projectId: string) {
  const project = await getProject(projectId);
  if (!project) return null;

  const nodes = await db
    .select()
    .from(videoNodes)
    .where(eq(videoNodes.projectId, projectId));

  const nodeIds = nodes.map((n) => n.id);

  const allChoices = nodeIds.length > 0
    ? await db.select().from(choices)
    : [];

  const configs = nodeIds.length > 0
    ? await db.select().from(branchConfigs)
    : [];

  const edges = await db
    .select()
    .from(branchEdges)
    .where(eq(branchEdges.projectId, projectId));

  return {
    project,
    nodes,
    choices: allChoices.filter((c) => nodeIds.includes(c.nodeId)),
    branchConfigs: configs.filter((c) => nodeIds.includes(c.nodeId)),
    edges,
  };
}
```

### ステップ 4: branch.service.ts 作成

`src/lib/services/branch.service.ts`:

```typescript
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { videoNodes, choices, branchConfigs, branchEdges } from '@/lib/db/schema';

/**
 * ノードを作成
 */
export async function createNode(data: {
  projectId: string;
  type: 'video' | 'choice' | 'end';
  title: string;
  positionX: number;
  positionY: number;
  videoUrl?: string;
  choiceDisplayTime?: number;
}) {
  const result = await db.insert(videoNodes).values(data).returning();
  return result[0];
}

/**
 * ノードを更新
 */
export async function updateNode(
  nodeId: string,
  data: Partial<{
    title: string;
    videoUrl: string;
    thumbnailUrl: string;
    choiceDisplayTime: number;
    positionX: number;
    positionY: number;
  }>
) {
  const result = await db
    .update(videoNodes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(videoNodes.id, nodeId))
    .returning();

  return result[0] ?? null;
}

/**
 * ノードを削除
 */
export async function deleteNode(nodeId: string) {
  await db.delete(videoNodes).where(eq(videoNodes.id, nodeId));
}

/**
 * 選択肢を保存
 */
export async function saveChoices(
  nodeId: string,
  choicesData: Array<{
    text: string;
    targetNodeId?: string;
    order: number;
  }>
) {
  // 既存の選択肢を削除
  await db.delete(choices).where(eq(choices.nodeId, nodeId));

  // 新しい選択肢を挿入
  if (choicesData.length > 0) {
    const result = await db
      .insert(choices)
      .values(choicesData.map((c) => ({ ...c, nodeId })))
      .returning();
    return result;
  }

  return [];
}

/**
 * 分岐設定を保存
 */
export async function saveBranchConfig(
  nodeId: string,
  data: {
    timeLimit: number;
    defaultChoiceId?: string;
  }
) {
  // upsert
  const existing = await db
    .select()
    .from(branchConfigs)
    .where(eq(branchConfigs.nodeId, nodeId))
    .limit(1);

  if (existing.length > 0) {
    const result = await db
      .update(branchConfigs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(branchConfigs.nodeId, nodeId))
      .returning();
    return result[0];
  }

  const result = await db
    .insert(branchConfigs)
    .values({ nodeId, ...data })
    .returning();
  return result[0];
}

/**
 * エッジを保存
 */
export async function saveEdges(
  projectId: string,
  edgesData: Array<{
    sourceNodeId: string;
    targetNodeId: string;
    choiceId?: string;
  }>
) {
  // 既存のエッジを削除
  await db.delete(branchEdges).where(eq(branchEdges.projectId, projectId));

  // 新しいエッジを挿入
  if (edgesData.length > 0) {
    const result = await db
      .insert(branchEdges)
      .values(edgesData.map((e) => ({ ...e, projectId })))
      .returning();
    return result;
  }

  return [];
}
```

### ステップ 5: API ルート作成

`src/app/api/videos/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getProjects, createProject } from '@/lib/services/video.service';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';

const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    const projects = await getProjects();
    return successResponse({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'プロジェクト取得に失敗しました', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    if (session.user.role !== 'admin') {
      return errorResponse(ErrorCodes.FORBIDDEN, '管理者のみ作成可能です', 403);
    }

    const body = await request.json();
    const result = createProjectSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'バリデーションエラー', 400);
    }

    const project = await createProject({
      ...result.data,
      createdBy: session.user.id,
    });

    return successResponse({ project }, undefined, 201);
  } catch (error) {
    console.error('Create project error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'プロジェクト作成に失敗しました', 500);
  }
}
```

`src/app/api/videos/[videoId]/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getProjectWithData, updateProject, deleteProject } from '@/lib/services/video.service';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';

const updateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  startNodeId: z.string().optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, '認証が必要です', 401);
    }

    const data = await getProjectWithData(params.videoId);
    if (!data) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'プロジェクトが見つかりません', 404);
    }

    return successResponse(data);
  } catch (error) {
    console.error('Get project error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'プロジェクト取得に失敗しました', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return errorResponse(ErrorCodes.FORBIDDEN, '管理者のみ更新可能です', 403);
    }

    const body = await request.json();
    const result = updateProjectSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'バリデーションエラー', 400);
    }

    const project = await updateProject(params.videoId, result.data);
    if (!project) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'プロジェクトが見つかりません', 404);
    }

    return successResponse({ project });
  } catch (error) {
    console.error('Update project error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'プロジェクト更新に失敗しました', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return errorResponse(ErrorCodes.FORBIDDEN, '管理者のみ削除可能です', 403);
    }

    await deleteProject(params.videoId);
    return successResponse({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'プロジェクト削除に失敗しました', 500);
  }
}
```

---

## 完了条件

- [x] スキーマが作成されマイグレーション完了
- [x] AC-A-004: 各動画に選択肢テキストと制限時間を設定できる
- [x] 分岐データの保存・取得が動作する
- [x] CRUD 操作が機能する

---

## テスト方法

### 1. マイグレーション実行

```bash
npm run db:generate
npm run db:push
npm run db:studio
```

### 2. API テスト

```bash
# プロジェクト作成
curl -X POST http://localhost:3000/api/videos \
  -H "Content-Type: application/json" \
  -d '{"title":"テストプロジェクト"}'

# プロジェクト一覧取得
curl http://localhost:3000/api/videos
```

---

## 参照設計書セクション

- DESIGN-BE-2026-001 セクション5.3, 5.4: 動画・分岐API
- DESIGN-BE-2026-001 セクション6.2: データモデル

---

## 成果物

- `src/lib/db/schema/videos.ts`
- `src/lib/services/video.service.ts`
- `src/lib/services/branch.service.ts`
- API ルート各種

---

## 次のタスク

- phase4-006-admin-page.md: 管理画面ページ統合
