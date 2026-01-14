# タスク: 進捗スキーマ定義

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase5-001 |
| フェーズ | Phase 5: 進捗管理 |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

ユーザー進捗と選択履歴のスキーマを定義し、マイグレーションを実行する。適切なインデックスを設定する。

---

## 前提条件

### 依存タスク
- phase4-completion.md（Phase 4 が完了していること）

### 前提成果物
- `src/lib/db/schema/users.ts`
- `src/lib/db/schema/videos.ts`

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/lib/db/schema/progress.ts` | 新規作成 |
| `src/lib/db/schema/index.ts` | 更新 |

---

## 実装詳細

### ステップ 1: 進捗スキーマ作成

`src/lib/db/schema/progress.ts`:

```typescript
import {
  pgTable,
  varchar,
  timestamp,
  integer,
  uuid,
  pgEnum,
  boolean,
  index,
  real,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { videoProjects, videoNodes, choices } from './videos';

/**
 * 進捗ステータスEnum
 */
export const progressStatusEnum = pgEnum('progress_status', [
  'not_started',
  'in_progress',
  'completed',
]);

/**
 * ユーザー進捗テーブル
 */
export const userProgress = pgTable(
  'user_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').notNull().references(() => videoProjects.id, { onDelete: 'cascade' }),
    status: progressStatusEnum('status').notNull().default('not_started'),
    currentNodeId: uuid('current_node_id').references(() => videoNodes.id),
    totalWatchTime: integer('total_watch_time').default(0).notNull(), // 秒
    completionRate: real('completion_rate').default(0).notNull(), // 0-100
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    lastAccessedAt: timestamp('last_accessed_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // ユーザーとプロジェクトの組み合わせでユニーク
    userProjectIdx: index('user_progress_user_project_idx').on(
      table.userId,
      table.projectId
    ),
    // ステータスでの検索用
    statusIdx: index('user_progress_status_idx').on(table.status),
    // ユーザーでの検索用
    userIdx: index('user_progress_user_idx').on(table.userId),
    // プロジェクトでの検索用
    projectIdx: index('user_progress_project_idx').on(table.projectId),
  })
);

/**
 * 選択履歴テーブル
 */
export const choiceHistory = pgTable(
  'choice_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    progressId: uuid('progress_id').notNull().references(() => userProgress.id, { onDelete: 'cascade' }),
    nodeId: uuid('node_id').notNull().references(() => videoNodes.id),
    choiceId: uuid('choice_id').notNull().references(() => choices.id),
    responseTime: real('response_time').notNull(), // 秒（小数点対応）
    isTimeout: boolean('is_timeout').default(false).notNull(),
    selectedAt: timestamp('selected_at').defaultNow().notNull(),
  },
  (table) => ({
    // 進捗IDでの検索用
    progressIdx: index('choice_history_progress_idx').on(table.progressId),
    // ノードIDでの検索用
    nodeIdx: index('choice_history_node_idx').on(table.nodeId),
    // 選択肢IDでの検索用
    choiceIdx: index('choice_history_choice_idx').on(table.choiceId),
  })
);

// リレーション定義
export const userProgressRelations = relations(userProgress, ({ one, many }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  project: one(videoProjects, {
    fields: [userProgress.projectId],
    references: [videoProjects.id],
  }),
  currentNode: one(videoNodes, {
    fields: [userProgress.currentNodeId],
    references: [videoNodes.id],
  }),
  choiceHistory: many(choiceHistory),
}));

export const choiceHistoryRelations = relations(choiceHistory, ({ one }) => ({
  progress: one(userProgress, {
    fields: [choiceHistory.progressId],
    references: [userProgress.id],
  }),
  node: one(videoNodes, {
    fields: [choiceHistory.nodeId],
    references: [videoNodes.id],
  }),
  choice: one(choices, {
    fields: [choiceHistory.choiceId],
    references: [choices.id],
  }),
}));

// 型エクスポート
export type InsertUserProgress = typeof userProgress.$inferInsert;
export type SelectUserProgress = typeof userProgress.$inferSelect;
export type InsertChoiceHistory = typeof choiceHistory.$inferInsert;
export type SelectChoiceHistory = typeof choiceHistory.$inferSelect;
```

### ステップ 2: スキーマインデックス更新

`src/lib/db/schema/index.ts`:

```typescript
// ユーザー関連
export * from './users';

// 動画・分岐関連
export * from './videos';

// 進捗関連
export * from './progress';
```

### ステップ 3: マイグレーション実行

```bash
# マイグレーションファイル生成
npm run db:generate

# データベースに適用
npm run db:push

# 確認
npm run db:studio
```

---

## 完了条件

- [ ] userProgress テーブルが作成されている
- [ ] choiceHistory テーブルが作成されている
- [ ] 適切なインデックスが設定されている
- [ ] リレーションが正しく定義されている
- [ ] マイグレーションが完了している

---

## テスト方法

### 1. マイグレーション確認

```bash
npm run db:studio
# user_progress テーブルと choice_history テーブルを確認
```

### 2. インデックス確認

Drizzle Studio または psql でインデックスを確認:

```sql
\d user_progress
\d choice_history
```

### 3. リレーション確認

```typescript
// テスト用のクエリを実行
import { db } from '@/lib/db';
import { userProgress, choiceHistory } from '@/lib/db/schema';

const result = await db.query.userProgress.findFirst({
  with: {
    user: true,
    project: true,
    choiceHistory: true,
  },
});
```

---

## 参照設計書セクション

- DESIGN-BE-2026-001 セクション6.2: データモデル
- DESIGN-BE-2026-001 セクション6.3: インデックス設計

---

## 成果物

- `src/lib/db/schema/progress.ts`: 進捗スキーマ

---

## 注意事項

- `totalWatchTime` は秒単位で保存
- `completionRate` は 0-100 の範囲
- `responseTime` は小数点対応（real型）
- カスケード削除を設定（ユーザー/プロジェクト削除時）

---

## 次のタスク

- phase5-002-progress-api.md: 進捗記録API実装
