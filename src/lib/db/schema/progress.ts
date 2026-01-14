/**
 * 進捗スキーマ
 * 対応設計書: DESIGN-BE-2026-001 セクション6.2
 */
import {
  pgTable,
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
 * - not_started: 未開始
 * - in_progress: 進行中
 * - completed: 完了
 */
export const progressStatusEnum = pgEnum('progress_status', [
  'not_started',
  'in_progress',
  'completed',
]);

/**
 * ユーザー進捗テーブル
 * ユーザーごとのプロジェクト視聴進捗を管理
 */
export const userProgress = pgTable(
  'user_progress',
  {
    /** 進捗ID (UUID) */
    id: uuid('id').defaultRandom().primaryKey(),
    /** ユーザーID */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** プロジェクトID */
    projectId: uuid('project_id')
      .notNull()
      .references(() => videoProjects.id, { onDelete: 'cascade' }),
    /** 進捗ステータス */
    status: progressStatusEnum('status').notNull().default('not_started'),
    /** 現在のノードID */
    currentNodeId: uuid('current_node_id').references(() => videoNodes.id),
    /** 総視聴時間（秒） */
    totalWatchTime: integer('total_watch_time').default(0).notNull(),
    /** 完了率（0-100） */
    completionRate: real('completion_rate').default(0).notNull(),
    /** 開始日時 */
    startedAt: timestamp('started_at'),
    /** 完了日時 */
    completedAt: timestamp('completed_at'),
    /** 最終アクセス日時 */
    lastAccessedAt: timestamp('last_accessed_at').defaultNow().notNull(),
    /** 作成日時 */
    createdAt: timestamp('created_at').defaultNow().notNull(),
    /** 更新日時 */
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // ユーザーとプロジェクトの組み合わせでの検索用
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
 * ユーザーの選択肢選択履歴を記録
 */
export const choiceHistory = pgTable(
  'choice_history',
  {
    /** 履歴ID (UUID) */
    id: uuid('id').defaultRandom().primaryKey(),
    /** 進捗ID */
    progressId: uuid('progress_id')
      .notNull()
      .references(() => userProgress.id, { onDelete: 'cascade' }),
    /** ノードID */
    nodeId: uuid('node_id')
      .notNull()
      .references(() => videoNodes.id),
    /** 選択肢ID */
    choiceId: uuid('choice_id')
      .notNull()
      .references(() => choices.id),
    /** 応答時間（秒、小数点対応） */
    responseTime: real('response_time').notNull(),
    /** タイムアウトフラグ */
    isTimeout: boolean('is_timeout').default(false).notNull(),
    /** 選択日時 */
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

// ========================================
// リレーション定義
// ========================================

/**
 * ユーザー進捗のリレーション
 */
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

/**
 * 選択履歴のリレーション
 */
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

// ========================================
// 型エクスポート
// ========================================

/** ユーザー進捗選択型（SELECT用） */
export type SelectUserProgress = typeof userProgress.$inferSelect;
/** ユーザー進捗挿入型（INSERT用） */
export type InsertUserProgress = typeof userProgress.$inferInsert;

/** 選択履歴選択型（SELECT用） */
export type SelectChoiceHistory = typeof choiceHistory.$inferSelect;
/** 選択履歴挿入型（INSERT用） */
export type InsertChoiceHistory = typeof choiceHistory.$inferInsert;

/** 進捗ステータス型 */
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
