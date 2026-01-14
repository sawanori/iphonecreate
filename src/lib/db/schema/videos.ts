/**
 * 動画プロジェクト・分岐スキーマ
 * 対応設計書: DESIGN-BE-2026-001 セクション6.2
 */
import {
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * ノードタイプEnum
 * - video: 動画ノード
 * - choice: 選択肢ノード
 * - end: 終了ノード
 */
export const nodeTypeEnum = pgEnum('node_type', ['video', 'choice', 'end']);

/**
 * アスペクト比Enum
 * - landscape: 16:9（横長）
 * - portrait: 9:16（縦長）
 */
export const aspectRatioEnum = pgEnum('aspect_ratio', ['landscape', 'portrait']);

/**
 * 動画プロジェクトテーブル
 */
export const videoProjects = pgTable('video_projects', {
  /** プロジェクトID (UUID) */
  id: uuid('id').defaultRandom().primaryKey(),
  /** タイトル */
  title: varchar('title', { length: 200 }).notNull(),
  /** 説明 */
  description: text('description'),
  /** サムネイルURL */
  thumbnailUrl: text('thumbnail_url'),
  /** 開始ノードID */
  startNodeId: uuid('start_node_id'),
  /** 公開状態 */
  isPublished: boolean('is_published').default(false).notNull(),
  /** アスペクト比（デフォルト: landscape = 16:9） */
  aspectRatio: aspectRatioEnum('aspect_ratio').default('landscape').notNull(),
  /** 作成者ID */
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  /** 作成日時 */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  /** 更新日時 */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 動画ノードテーブル
 */
export const videoNodes = pgTable('video_nodes', {
  /** ノードID (UUID) */
  id: uuid('id').defaultRandom().primaryKey(),
  /** プロジェクトID */
  projectId: uuid('project_id')
    .notNull()
    .references(() => videoProjects.id, { onDelete: 'cascade' }),
  /** ノードタイプ */
  type: nodeTypeEnum('type').notNull(),
  /** タイトル */
  title: varchar('title', { length: 200 }).notNull(),
  /** 説明 */
  description: text('description'),
  /** 動画URL */
  videoUrl: text('video_url'),
  /** サムネイルURL */
  thumbnailUrl: text('thumbnail_url'),
  /** 選択肢表示時間（秒） */
  choiceDisplayTime: integer('choice_display_time'),
  /** 動画の長さ（秒） */
  duration: integer('duration'),
  /** X座標（エディタ用） */
  positionX: integer('position_x').default(0).notNull(),
  /** Y座標（エディタ用） */
  positionY: integer('position_y').default(0).notNull(),
  /** 作成日時 */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  /** 更新日時 */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 選択肢テーブル
 */
export const choices = pgTable('choices', {
  /** 選択肢ID (UUID) */
  id: uuid('id').defaultRandom().primaryKey(),
  /** ノードID */
  nodeId: uuid('node_id')
    .notNull()
    .references(() => videoNodes.id, { onDelete: 'cascade' }),
  /** 選択肢テキスト */
  text: varchar('text', { length: 100 }).notNull(),
  /** 遷移先ノードID */
  targetNodeId: uuid('target_node_id').references(() => videoNodes.id),
  /** 表示順序 */
  order: integer('order').default(0).notNull(),
  /** 作成日時 */
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * 分岐設定テーブル
 */
export const branchConfigs = pgTable('branch_configs', {
  /** 分岐設定ID (UUID) */
  id: uuid('id').defaultRandom().primaryKey(),
  /** ノードID（ユニーク） */
  nodeId: uuid('node_id')
    .notNull()
    .references(() => videoNodes.id, { onDelete: 'cascade' })
    .unique(),
  /** 制限時間（秒） */
  timeLimit: integer('time_limit').default(15).notNull(),
  /** デフォルト選択肢ID */
  defaultChoiceId: uuid('default_choice_id').references(() => choices.id),
  /** 作成日時 */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  /** 更新日時 */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 分岐エッジテーブル
 */
export const branchEdges = pgTable('branch_edges', {
  /** エッジID (UUID) */
  id: uuid('id').defaultRandom().primaryKey(),
  /** プロジェクトID */
  projectId: uuid('project_id')
    .notNull()
    .references(() => videoProjects.id, { onDelete: 'cascade' }),
  /** 接続元ノードID */
  sourceNodeId: uuid('source_node_id')
    .notNull()
    .references(() => videoNodes.id, { onDelete: 'cascade' }),
  /** 接続先ノードID */
  targetNodeId: uuid('target_node_id')
    .notNull()
    .references(() => videoNodes.id, { onDelete: 'cascade' }),
  /** 選択肢ID（選択肢経由の場合） */
  choiceId: uuid('choice_id').references(() => choices.id),
  /** 作成日時 */
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ========================================
// リレーション定義
// ========================================

/**
 * 動画プロジェクトのリレーション
 */
export const videoProjectsRelations = relations(videoProjects, ({ one, many }) => ({
  creator: one(users, {
    fields: [videoProjects.createdBy],
    references: [users.id],
  }),
  nodes: many(videoNodes),
  edges: many(branchEdges),
}));

/**
 * 動画ノードのリレーション
 */
export const videoNodesRelations = relations(videoNodes, ({ one, many }) => ({
  project: one(videoProjects, {
    fields: [videoNodes.projectId],
    references: [videoProjects.id],
  }),
  choices: many(choices),
  branchConfig: one(branchConfigs),
}));

/**
 * 選択肢のリレーション
 */
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

/**
 * 分岐設定のリレーション
 */
export const branchConfigsRelations = relations(branchConfigs, ({ one }) => ({
  node: one(videoNodes, {
    fields: [branchConfigs.nodeId],
    references: [videoNodes.id],
  }),
  defaultChoice: one(choices, {
    fields: [branchConfigs.defaultChoiceId],
    references: [choices.id],
  }),
}));

/**
 * 分岐エッジのリレーション
 */
export const branchEdgesRelations = relations(branchEdges, ({ one }) => ({
  project: one(videoProjects, {
    fields: [branchEdges.projectId],
    references: [videoProjects.id],
  }),
  sourceNode: one(videoNodes, {
    fields: [branchEdges.sourceNodeId],
    references: [videoNodes.id],
  }),
  targetNode: one(videoNodes, {
    fields: [branchEdges.targetNodeId],
    references: [videoNodes.id],
  }),
  choice: one(choices, {
    fields: [branchEdges.choiceId],
    references: [choices.id],
  }),
}));

// ========================================
// 動画ライブラリ
// ========================================

/**
 * 動画ライブラリテーブル
 * アップロードした動画を保存し、複数プロジェクトで再利用可能
 */
export const videoLibrary = pgTable('video_library', {
  /** 動画ID (UUID) */
  id: uuid('id').defaultRandom().primaryKey(),
  /** 動画タイトル */
  title: varchar('title', { length: 200 }).notNull(),
  /** 動画URL (R2) */
  videoUrl: text('video_url').notNull(),
  /** サムネイルURL */
  thumbnailUrl: text('thumbnail_url'),
  /** ファイルサイズ (bytes) */
  fileSize: integer('file_size'),
  /** 動画の長さ (秒) */
  duration: integer('duration'),
  /** 所有者ID */
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id),
  /** 作成日時 */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  /** 更新日時 */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 動画ライブラリのリレーション
 */
export const videoLibraryRelations = relations(videoLibrary, ({ one }) => ({
  owner: one(users, {
    fields: [videoLibrary.ownerId],
    references: [users.id],
  }),
}));

// ========================================
// 型エクスポート
// ========================================

/** 動画プロジェクト選択型（SELECT用） */
export type VideoProject = typeof videoProjects.$inferSelect;
/** 動画プロジェクト挿入型（INSERT用） */
export type NewVideoProject = typeof videoProjects.$inferInsert;

/** 動画ノード選択型（SELECT用） */
export type VideoNode = typeof videoNodes.$inferSelect;
/** 動画ノード挿入型（INSERT用） */
export type NewVideoNode = typeof videoNodes.$inferInsert;

/** 選択肢選択型（SELECT用） */
export type Choice = typeof choices.$inferSelect;
/** 選択肢挿入型（INSERT用） */
export type NewChoice = typeof choices.$inferInsert;

/** 分岐設定選択型（SELECT用） */
export type BranchConfig = typeof branchConfigs.$inferSelect;
/** 分岐設定挿入型（INSERT用） */
export type NewBranchConfig = typeof branchConfigs.$inferInsert;

/** 分岐エッジ選択型（SELECT用） */
export type BranchEdge = typeof branchEdges.$inferSelect;
/** 分岐エッジ挿入型（INSERT用） */
export type NewBranchEdge = typeof branchEdges.$inferInsert;

/** ノードタイプ */
export type NodeType = 'video' | 'choice' | 'end';

/** アスペクト比タイプ */
export type AspectRatio = 'landscape' | 'portrait';

/** 動画ライブラリ選択型（SELECT用） */
export type VideoLibraryItem = typeof videoLibrary.$inferSelect;
/** 動画ライブラリ挿入型（INSERT用） */
export type NewVideoLibraryItem = typeof videoLibrary.$inferInsert;
