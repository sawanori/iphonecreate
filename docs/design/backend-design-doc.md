# バックエンド/API技術設計書: インタラクティブ動画プラットフォーム

## メタ情報

| 項目 | 内容 |
|------|------|
| ドキュメントID | DESIGN-BE-2026-001 |
| バージョン | 1.0.0 |
| 作成日 | 2026-01-14 |
| 最終更新日 | 2026-01-14 |
| ステータス | Draft |
| 対応PRD | PRD-2026-001 |
| 関連設計書 | DESIGN-FE-2026-001 |
| 複雑度レベル | High |

### 複雑度の根拠

1. **要件/AC観点**: 動画分岐ロジック、ユーザー進捗管理、分析データ集計など複数のビジネスロジックが連携。認証・認可フローの実装が必要。
2. **制約/リスク観点**: サーバーレス環境でのコールドスタート最適化、大容量ファイルアップロード、署名付きURLの管理、レート制限の実装が必要。

---

## 1. 合意事項チェックリスト

### スコープ

- [x] 認証API（メール/パスワード認証、セッション管理）
- [x] 動画管理API（CRUD、メタデータ管理）
- [x] 分岐設定API（ノード・エッジの保存・取得）
- [x] 進捗記録API（視聴状況、選択履歴の記録）
- [x] 分析データ取得API（完了率、選択傾向の集計）
- [x] ファイルアップロード（署名付きURL発行）

### 非スコープ

- [x] フロントエンド実装（別途設計書で対応）
- [x] 動画トランスコーディング（アップロード前に圧縮を推奨）
- [x] リアルタイム通知（WebSocket）
- [x] 外部LMS連携（SCORM/xAPI）
- [x] 多言語対応

### 制約

- [x] Vercelサーバーレス環境での動作
- [x] コールドスタート最小化
- [x] 同時接続100ユーザー対応
- [x] 動画形式: MP4（H.264）のみ
- [x] セッションタイムアウト: 8時間

### パフォーマンス要件

- [x] API応答時間: 200ms以内（P95）
- [x] ファイルアップロード: 500MBまで対応
- [x] データベース接続: コネクションプーリング対応

### 設計への反映確認

| 合意事項 | 設計上の反映箇所 |
|----------|------------------|
| サーバーレス対応 | セクション3でDrizzle ORM + Neon選定 |
| 100ユーザー同時接続 | セクション11でコネクションプーリング設計 |
| 8時間セッション | セクション6で認証設計に反映 |
| 500MBアップロード | セクション7でマルチパートアップロード設計 |

---

## 2. 前提ADR・技術選定

### 2.1 技術スタック

| カテゴリ | 採用技術 | 選定理由 |
|----------|----------|----------|
| フレームワーク | Next.js 15 (App Router) | フロントエンドと統一、Route Handlers |
| APIレイヤー | Route Handlers | サーバーレス最適化、エッジ対応 |
| ORM | Drizzle ORM | 軽量（7KB）、ゼロコールドスタート、型安全 |
| データベース | Neon (PostgreSQL) | サーバーレス対応、Vercel統合、分岐機能 |
| 認証 | Auth.js v5 (NextAuth) | App Router対応、Credentials Provider |
| ファイルストレージ | Cloudflare R2 | ゼロエグレス料金、S3互換API |
| バリデーション | Zod | 型安全なスキーマ定義、フロントエンド共有 |
| レート制限 | Upstash Rate Limit | サーバーレス対応、Redis不要 |

### 2.2 技術選定の詳細比較

#### データベース選定

| 評価軸 | Neon | PlanetScale | Supabase |
|--------|------|-------------|----------|
| PostgreSQL互換 | ネイティブ | Vitess経由 | ネイティブ |
| Vercel統合 | 優秀 | 優秀 | 良好 |
| サーバーレス最適化 | 優秀 | 優秀 | 良好 |
| コールドスタート | 500ms-3s | 低い | 中程度 |
| 外部キー制約 | サポート | 非サポート | サポート |
| 無料枠 | 0.5GB | 5GB | 500MB |

**決定**: Neon を採用。PostgreSQLネイティブで外部キー制約をサポート、Vercelとの統合が優秀。Auth.jsのアダプター対応も充実。

#### ORM選定

| 評価軸 | Drizzle | Prisma |
|--------|---------|--------|
| バンドルサイズ | 約7KB | 大（バイナリ含む） |
| コールドスタート | 最小 | 中程度（改善中） |
| 型安全性 | 完全（推論ベース） | 完全（生成ベース） |
| SQLに近い記法 | はい | 抽象化 |
| マイグレーション | drizzle-kit | prisma migrate |
| リレーション | 手動管理 | 自動（fluent API） |

**決定**: Drizzle ORM を採用。サーバーレス環境でのゼロコールドスタート、軽量バンドル、SQLに近い記法で細かい制御が可能。

#### ファイルストレージ選定

| 評価軸 | Cloudflare R2 | AWS S3 |
|--------|---------------|--------|
| ストレージ料金 | $0.015/GB/月 | $0.023/GB/月 |
| エグレス料金 | $0 | $0.09/GB |
| S3互換API | はい | 本家 |
| CDN統合 | 自動（300+ PoP） | CloudFront必要 |
| 署名付きURL | サポート | サポート |

**決定**: Cloudflare R2 を採用。動画配信のエグレスコストがゼロ、S3互換APIでマイグレーション容易。

---

## 3. 既存コードベース分析

### 3.1 現状

新規プロジェクトのため、既存コードベースは存在しない。

### 3.2 類似機能調査

該当なし（新規プロジェクト）。

### 3.3 採用決定

新規実装として進行。フロントエンド設計書（DESIGN-FE-2026-001）で定義された型定義・データ構造と整合性を確保。

---

## 4. アーキテクチャ設計

### 4.1 全体構成図

```mermaid
flowchart TB
    subgraph Client["クライアント"]
        Browser["ブラウザ"]
        Mobile["モバイル"]
    end

    subgraph Vercel["Vercel Platform"]
        subgraph Edge["Edge Network"]
            Middleware["Middleware<br/>認証検証・レート制限"]
        end

        subgraph Serverless["Serverless Functions"]
            AuthAPI["Auth API<br/>/api/auth/*"]
            VideoAPI["Video API<br/>/api/videos/*"]
            ProgressAPI["Progress API<br/>/api/progress/*"]
            UploadAPI["Upload API<br/>/api/upload/*"]
            AnalyticsAPI["Analytics API<br/>/api/analytics/*"]
        end
    end

    subgraph External["外部サービス"]
        Neon["Neon<br/>PostgreSQL"]
        R2["Cloudflare R2<br/>動画ストレージ"]
        Upstash["Upstash<br/>レート制限"]
    end

    Client --> Edge
    Edge --> Serverless
    AuthAPI --> Neon
    VideoAPI --> Neon
    VideoAPI --> R2
    ProgressAPI --> Neon
    UploadAPI --> R2
    AnalyticsAPI --> Neon
    Middleware --> Upstash
```

### 4.2 ディレクトリ構成

```
src/
├── app/
│   └── api/                          # API Route Handlers
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts          # Auth.js エンドポイント
│       ├── videos/
│       │   ├── route.ts              # GET: 一覧, POST: 作成
│       │   └── [videoId]/
│       │       ├── route.ts          # GET: 詳細, PUT: 更新, DELETE: 削除
│       │       ├── branches/
│       │       │   └── route.ts      # GET/PUT: 分岐データ
│       │       ├── publish/
│       │       │   └── route.ts      # POST: 公開
│       │       └── signed-url/
│       │           └── route.ts      # GET: 署名付きURL取得
│       ├── upload/
│       │   ├── route.ts              # POST: アップロード開始
│       │   └── complete/
│       │       └── route.ts          # POST: アップロード完了
│       ├── progress/
│       │   ├── route.ts              # GET: 自分の進捗一覧
│       │   └── [videoId]/
│       │       ├── route.ts          # GET/PUT: 動画別進捗
│       │       └── choice/
│       │           └── route.ts      # POST: 選択記録
│       ├── analytics/
│       │   ├── route.ts              # GET: 全体サマリー
│       │   └── [videoId]/
│       │       └── route.ts          # GET: 動画別分析
│       └── users/
│           ├── route.ts              # GET: ユーザー一覧（管理者）
│           └── [userId]/
│               └── route.ts          # GET/PUT: ユーザー詳細
├── lib/
│   ├── auth/
│   │   ├── config.ts                 # Auth.js 設定
│   │   ├── session.ts                # セッション取得ヘルパー
│   │   └── guards.ts                 # 認可ガード
│   ├── db/
│   │   ├── index.ts                  # Drizzle クライアント
│   │   ├── schema/
│   │   │   ├── users.ts              # ユーザースキーマ
│   │   │   ├── videos.ts             # 動画スキーマ
│   │   │   ├── branches.ts           # 分岐スキーマ
│   │   │   ├── progress.ts           # 進捗スキーマ
│   │   │   └── index.ts              # スキーマエクスポート
│   │   └── migrations/               # マイグレーションファイル
│   ├── storage/
│   │   ├── r2.ts                     # R2 クライアント
│   │   └── signed-url.ts             # 署名付きURL生成
│   ├── services/
│   │   ├── video.service.ts          # 動画ビジネスロジック
│   │   ├── branch.service.ts         # 分岐ビジネスロジック
│   │   ├── progress.service.ts       # 進捗ビジネスロジック
│   │   └── analytics.service.ts      # 分析ビジネスロジック
│   ├── validation/
│   │   ├── video.ts                  # 動画バリデーション
│   │   ├── branch.ts                 # 分岐バリデーション
│   │   ├── progress.ts               # 進捗バリデーション
│   │   └── common.ts                 # 共通バリデーション
│   └── utils/
│       ├── api-response.ts           # レスポンスヘルパー
│       ├── error-handler.ts          # エラーハンドリング
│       └── rate-limit.ts             # レート制限
├── middleware.ts                     # Next.js Middleware
└── types/
    ├── api.ts                        # APIレスポンス型
    └── db.ts                         # DB型（Drizzle推論）
```

### 4.3 レイヤードアーキテクチャ

```mermaid
flowchart TD
    subgraph Presentation["プレゼンテーション層"]
        RouteHandlers["Route Handlers<br/>/api/*"]
        Middleware["Middleware<br/>認証・レート制限"]
    end

    subgraph Application["アプリケーション層"]
        Services["Services<br/>ビジネスロジック"]
        Validation["Validation<br/>Zodスキーマ"]
    end

    subgraph Domain["ドメイン層"]
        Schema["DB Schema<br/>Drizzle"]
        Types["Types<br/>型定義"]
    end

    subgraph Infrastructure["インフラ層"]
        DB["Drizzle Client<br/>Neon接続"]
        Storage["R2 Client<br/>ファイル操作"]
        Auth["Auth.js<br/>認証"]
    end

    RouteHandlers --> Services
    Middleware --> Auth
    Services --> Validation
    Services --> Schema
    Services --> DB
    Services --> Storage
```

---

## 5. API設計

### 5.1 API概要

| エンドポイント | メソッド | 説明 | 認証 | 権限 |
|---------------|----------|------|------|------|
| `/api/auth/*` | ALL | 認証関連 | - | - |
| `/api/videos` | GET | 動画一覧取得 | 必須 | 全員 |
| `/api/videos` | POST | 動画プロジェクト作成 | 必須 | 管理者 |
| `/api/videos/[id]` | GET | 動画詳細取得 | 必須 | 全員 |
| `/api/videos/[id]` | PUT | 動画更新 | 必須 | 管理者 |
| `/api/videos/[id]` | DELETE | 動画削除（R2ファイル含む） | 必須 | 管理者 |
| `/api/videos/[id]/branches` | GET | 分岐データ取得 | 必須 | 全員 |
| `/api/videos/[id]/branches` | PUT | 分岐データ更新 | 必須 | 管理者 |
| `/api/videos/[id]/signed-url` | GET | 署名付きURL取得 | 必須 | 全員 |
| `/api/videos/[id]/preview` | GET | 動画プレビュー取得 | 必須 | 管理者 |
| `/api/videos/[id]/status` | GET | 動画処理ステータス取得 | 必須 | 管理者 |
| `/api/upload` | POST | アップロード開始 | 必須 | 管理者 |
| `/api/upload/complete` | POST | アップロード完了 | 必須 | 管理者 |
| `/api/progress` | GET | 自分の進捗一覧 | 必須 | 全員 |
| `/api/progress/[videoId]` | GET | 動画別進捗取得 | 必須 | 全員 |
| `/api/progress/[videoId]` | PUT | 進捗更新 | 必須 | 全員 |
| `/api/progress/[videoId]/choice` | POST | 選択記録 | 必須 | 全員 |
| `/api/analytics` | GET | 全体分析 | 必須 | 管理者 |
| `/api/analytics/[videoId]` | GET | 動画別分析 | 必須 | 管理者 |
| `/api/users` | GET | ユーザー一覧 | 必須 | 管理者 |

### 5.2 認証API

#### POST /api/auth/callback/credentials
ログイン認証

**リクエスト**:
```typescript
type LoginRequest = {
  email: string
  password: string
}
```

**レスポンス**:
```typescript
// 成功時: セッションCookieが設定される
// 失敗時: エラーページにリダイレクト
```

#### GET /api/auth/session
現在のセッション取得

**レスポンス**:
```typescript
type SessionResponse = {
  user: {
    id: string
    email: string
    name: string
    role: 'admin' | 'viewer'
  }
  expires: string
} | null
```

### 5.3 動画管理API

#### GET /api/videos
動画一覧取得

**クエリパラメータ**:
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| status | string | No | draft/published/archived |
| page | number | No | ページ番号（デフォルト: 1） |
| limit | number | No | 取得件数（デフォルト: 20、最大: 100） |

**レスポンス**:
```typescript
type VideoListResponse = {
  data: VideoProject[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

type VideoProject = {
  id: string
  title: string
  description: string
  thumbnailUrl: string | null
  status: 'draft' | 'published' | 'archived'
  nodeCount: number
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
  }
}
```

#### POST /api/videos
動画プロジェクト作成

**リクエスト**:
```typescript
type CreateVideoRequest = {
  title: string
  description?: string
}
```

**レスポンス**:
```typescript
type CreateVideoResponse = {
  id: string
  title: string
  description: string
  status: 'draft'
  createdAt: string
}
```

#### GET /api/videos/[videoId]
動画詳細取得

**レスポンス**:
```typescript
type VideoDetailResponse = {
  id: string
  title: string
  description: string
  thumbnailUrl: string | null
  status: 'draft' | 'published' | 'archived'
  startNodeId: string | null
  nodes: VideoNode[]
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
  }
}

type VideoNode = {
  id: string
  label: string
  videoUrl: string | null
  thumbnailUrl: string | null
  duration: number | null
  choiceTimestamp: number | null
  timeLimit: number
  isEndNode: boolean
  position: { x: number; y: number }
}
```

#### PUT /api/videos/[videoId]
動画更新

**リクエスト**:
```typescript
type UpdateVideoRequest = {
  title?: string
  description?: string
  thumbnailUrl?: string
  status?: 'draft' | 'published' | 'archived'
  startNodeId?: string
}
```

#### DELETE /api/videos/[videoId]
動画削除

**設計補足**:
- R2ストレージ上の動画ファイルも削除
- 関連するサムネイルファイルも削除
- 削除失敗時はorphanedファイルとしてマーク
- orphanedファイルは定期クリーンアップジョブで対応

**レスポンス**:
```typescript
type DeleteVideoResponse = {
  success: boolean
  deletedFiles: {
    video: boolean
    thumbnail: boolean
  }
  orphanedFiles?: string[]  // 削除失敗したファイルパス
}
```

### 5.4 分岐設定API

#### GET /api/videos/[videoId]/branches
分岐データ取得

**レスポンス**:
```typescript
type BranchDataResponse = {
  videoId: string
  nodes: BranchNode[]
  edges: BranchEdge[]
}

type BranchNode = {
  id: string
  type: 'video' | 'choice' | 'end'
  label: string
  position: { x: number; y: number }
  data: VideoNodeData | ChoiceNodeData | EndNodeData
}

type VideoNodeData = {
  videoUrl: string | null
  thumbnailUrl: string | null
  duration: number | null
  choiceTimestamp: number | null
}

type ChoiceNodeData = {
  choices: Choice[]
  timeLimit: number
}

type EndNodeData = {
  label: string
}

type Choice = {
  id: string
  label: string
}

type BranchEdge = {
  id: string
  source: string
  target: string
  sourceHandle?: string
  label?: string
}
```

#### PUT /api/videos/[videoId]/branches
分岐データ更新

**リクエスト**:
```typescript
type UpdateBranchRequest = {
  nodes: BranchNode[]
  edges: BranchEdge[]
}
```

### 5.5 進捗記録API

#### GET /api/progress
自分の進捗一覧取得

**レスポンス**:
```typescript
type ProgressListResponse = {
  data: UserProgressSummary[]
}

type UserProgressSummary = {
  videoId: string
  videoTitle: string
  status: 'not_started' | 'in_progress' | 'completed'
  progressPercent: number
  totalWatchTime: number
  lastAccessedAt: string | null
}
```

#### GET /api/progress/[videoId]
動画別進捗取得

**レスポンス**:
```typescript
type UserProgressResponse = {
  userId: string
  videoId: string
  status: 'not_started' | 'in_progress' | 'completed'
  currentNodeId: string | null
  watchedNodeIds: string[]
  choiceHistory: ChoiceRecord[]
  totalWatchTime: number
  startedAt: string | null
  completedAt: string | null
  lastAccessedAt: string
}

type ChoiceRecord = {
  nodeId: string
  choiceId: string
  selectedAt: string
  timeSpent: number
  isTimeout: boolean
}
```

#### PUT /api/progress/[videoId]
進捗更新

**リクエスト**:
```typescript
type UpdateProgressRequest = {
  currentNodeId?: string
  watchedNodeIds?: string[]
  totalWatchTime?: number
  status?: 'in_progress' | 'completed'
}
```

#### POST /api/progress/[videoId]/choice
選択記録

**リクエスト**:
```typescript
type RecordChoiceRequest = {
  nodeId: string
  choiceId: string
  timeSpent: number
  isTimeout: boolean
}
```

**レスポンス**:
```typescript
type ChoiceResponse = {
  success: boolean
  nextNodeId: string | null
  shouldPauseVideo: boolean  // タイムアウト時はtrue
  isCompleted: boolean
}
```

### 5.5.1 進捗更新ポーリング戦略

**推奨設定**:
- 推奨ポーリング間隔: 30秒
- 最小ポーリング間隔: 10秒（サーバー負荷軽減）
- 最大ポーリング間隔: 60秒

**ETagベースの条件付きリクエスト**:
```typescript
// レスポンスヘッダー
ETag: "progress-{userId}-{videoId}-{lastAccessedAt}"

// リクエストヘッダー（クライアント側）
If-None-Match: "progress-{userId}-{videoId}-{lastAccessedAt}"

// 変更なしの場合
HTTP 304 Not Modified
```

**設計意図**:
- 不必要なデータ転送を削減
- サーバー・クライアント両方の負荷軽減
- リアルタイム性と効率のバランス

### 5.6 分析データAPI

#### GET /api/analytics
全体分析データ取得（管理者のみ）

**レスポンス**:
```typescript
type AnalyticsSummaryResponse = {
  overview: {
    totalUsers: number
    activeUsers: number
    totalVideos: number
    publishedVideos: number
  }
  engagement: {
    averageCompletionRate: number
    averageWatchTime: number
    totalChoicesMade: number
  }
  recentActivity: {
    date: string
    views: number
    completions: number
  }[]
}
```

#### GET /api/analytics/[videoId]
動画別分析データ取得（管理者のみ）

**レスポンス**:
```typescript
type VideoAnalyticsResponse = {
  videoId: string
  videoTitle: string
  summary: {
    totalViewers: number
    completedViewers: number
    inProgressViewers: number
    completionRate: number
    averageWatchTime: number
  }
  nodeAnalytics: {
    nodeId: string
    nodeLabel: string
    viewCount: number
    dropOffRate: number
  }[]
  choiceAnalytics: {
    nodeId: string
    choices: {
      choiceId: string
      label: string
      selectCount: number
      selectRate: number
      averageTimeSpent: number
      timeoutRate: number
    }[]
  }[]
  userProgress: {
    userId: string
    userName: string
    status: 'not_started' | 'in_progress' | 'completed'
    completedAt: string | null
  }[]
}
```

### 5.7 ファイルアップロードAPI

#### POST /api/upload
アップロード開始（署名付きURL発行）

**リクエスト**:
```typescript
type InitiateUploadRequest = {
  filename: string
  contentType: string
  fileSize: number
}
```

**レスポンス**:
```typescript
type InitiateUploadResponse = {
  uploadId: string
  uploadUrl: string
  fields: Record<string, string>  // マルチパート用フィールド
  expiresAt: string
}
```

#### POST /api/upload/complete
アップロード完了通知

**リクエスト**:
```typescript
type CompleteUploadRequest = {
  uploadId: string
  videoId?: string  // 既存動画への紐付け（オプション）
}
```

**レスポンス**:
```typescript
type CompleteUploadResponse = {
  fileUrl: string
  thumbnailUrl: string | null
  metadata: {
    filename: string
    fileSize: number
    contentType: string
    duration: number | null
    width: number | null
    height: number | null
  }
}
```

**設計補足**:
- 動画メタデータ（duration等）の抽出は非同期ジョブで実行
- アップロード完了レスポンスはメタデータ抽出完了を待たない
- メタデータ抽出完了後、動画レコードが自動更新される

### 5.8 プレビュー機能API

#### GET /api/videos/[videoId]/preview
動画プレビュー取得（管理者のみ）

**概要**:
- 管理者のみアクセス可能
- 下書き状態の動画でもプレビュー可能
- 進捗は記録されない

**レスポンス**:
```typescript
type VideoPreviewResponse = {
  id: string
  title: string
  description: string
  status: 'draft' | 'published' | 'archived'
  nodes: BranchNode[]
  edges: BranchEdge[]
  startNodeId: string | null
  previewUrl: string  // 署名付きプレビューURL
  expiresAt: string   // プレビューURL有効期限
}
```

#### GET /api/videos/[videoId]/status
動画処理ステータス取得

**概要**:
- アップロード後の動画処理状態を確認
- メタデータ抽出、サムネイル生成の進捗を取得

**レスポンス**:
```typescript
type VideoStatusResponse = {
  videoId: string
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  metadataExtracted: boolean
  thumbnailGenerated: boolean
  error: string | null
  updatedAt: string
}
```

---

## 6. データベーススキーマ

### 6.1 ER図

```mermaid
erDiagram
    users ||--o{ video_projects : creates
    users ||--o{ user_progress : has
    video_projects ||--o{ video_nodes : contains
    video_projects ||--o{ branch_edges : contains
    video_projects ||--o{ user_progress : tracks
    video_nodes ||--o{ choices : has
    video_nodes ||--o{ branch_edges : source
    video_nodes ||--o{ branch_edges : target
    user_progress ||--o{ choice_history : records

    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar name
        enum role
        timestamp created_at
        timestamp updated_at
        timestamp last_login_at
    }

    video_projects {
        uuid id PK
        varchar title
        text description
        varchar thumbnail_url
        enum status
        uuid start_node_id FK
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }

    video_nodes {
        uuid id PK
        uuid project_id FK
        enum node_type
        varchar label
        varchar video_url
        varchar thumbnail_url
        integer duration
        decimal choice_timestamp
        integer time_limit
        boolean is_end_node
        jsonb position
        timestamp created_at
        timestamp updated_at
    }

    choices {
        uuid id PK
        uuid node_id FK
        varchar label
        integer order_index
        timestamp created_at
    }

    branch_edges {
        uuid id PK
        uuid project_id FK
        uuid source_node_id FK
        uuid target_node_id FK
        uuid choice_id FK
        varchar source_handle
        timestamp created_at
    }

    user_progress {
        uuid id PK
        uuid user_id FK
        uuid video_id FK
        enum status
        uuid current_node_id FK
        jsonb watched_node_ids
        integer total_watch_time
        timestamp started_at
        timestamp completed_at
        timestamp last_accessed_at
    }

    choice_history {
        uuid id PK
        uuid progress_id FK
        uuid node_id FK
        uuid choice_id FK
        decimal time_spent
        boolean is_timeout
        timestamp selected_at
    }
```

### 6.2 Drizzle スキーマ定義

```typescript
// lib/db/schema/users.ts
import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['admin', 'viewer'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: roleEnum('role').notNull().default('viewer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

```typescript
// lib/db/schema/videos.ts
import { pgTable, uuid, varchar, text, timestamp, pgEnum, integer, decimal, boolean, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const projectStatusEnum = pgEnum('project_status', ['draft', 'published', 'archived'])
export const nodeTypeEnum = pgEnum('node_type', ['video', 'choice', 'end'])

export const videoProjects = pgTable('video_projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').default(''),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  status: projectStatusEnum('status').notNull().default('draft'),
  startNodeId: uuid('start_node_id'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const videoNodes = pgTable('video_nodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => videoProjects.id, { onDelete: 'cascade' }),
  nodeType: nodeTypeEnum('node_type').notNull().default('video'),
  label: varchar('label', { length: 255 }).notNull(),
  videoUrl: varchar('video_url', { length: 500 }),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  duration: integer('duration'),  // 秒
  choiceTimestamp: decimal('choice_timestamp', { precision: 10, scale: 2 }),  // 秒
  timeLimit: integer('time_limit').notNull().default(10),  // 秒
  isEndNode: boolean('is_end_node').notNull().default(false),
  position: jsonb('position').$type<{ x: number; y: number }>().notNull().default({ x: 0, y: 0 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const choices = pgTable('choices', {
  id: uuid('id').defaultRandom().primaryKey(),
  nodeId: uuid('node_id').notNull().references(() => videoNodes.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 255 }).notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const branchEdges = pgTable('branch_edges', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => videoProjects.id, { onDelete: 'cascade' }),
  sourceNodeId: uuid('source_node_id').notNull().references(() => videoNodes.id, { onDelete: 'cascade' }),
  targetNodeId: uuid('target_node_id').notNull().references(() => videoNodes.id, { onDelete: 'cascade' }),
  choiceId: uuid('choice_id').references(() => choices.id, { onDelete: 'set null' }),
  sourceHandle: varchar('source_handle', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// リレーション定義
export const videoProjectsRelations = relations(videoProjects, ({ one, many }) => ({
  creator: one(users, {
    fields: [videoProjects.createdBy],
    references: [users.id],
  }),
  nodes: many(videoNodes),
  edges: many(branchEdges),
}))

export const videoNodesRelations = relations(videoNodes, ({ one, many }) => ({
  project: one(videoProjects, {
    fields: [videoNodes.projectId],
    references: [videoProjects.id],
  }),
  choices: many(choices),
}))

export const choicesRelations = relations(choices, ({ one }) => ({
  node: one(videoNodes, {
    fields: [choices.nodeId],
    references: [videoNodes.id],
  }),
}))

export type VideoProject = typeof videoProjects.$inferSelect
export type NewVideoProject = typeof videoProjects.$inferInsert
export type VideoNode = typeof videoNodes.$inferSelect
export type NewVideoNode = typeof videoNodes.$inferInsert
export type Choice = typeof choices.$inferSelect
export type NewChoice = typeof choices.$inferInsert
export type BranchEdge = typeof branchEdges.$inferSelect
export type NewBranchEdge = typeof branchEdges.$inferInsert
```

```typescript
// lib/db/schema/progress.ts
import { pgTable, uuid, timestamp, pgEnum, integer, decimal, boolean, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { videoProjects, videoNodes, choices } from './videos'

export const progressStatusEnum = pgEnum('progress_status', ['not_started', 'in_progress', 'completed'])

export const userProgress = pgTable('user_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  videoId: uuid('video_id').notNull().references(() => videoProjects.id, { onDelete: 'cascade' }),
  status: progressStatusEnum('status').notNull().default('not_started'),
  currentNodeId: uuid('current_node_id').references(() => videoNodes.id, { onDelete: 'set null' }),
  watchedNodeIds: jsonb('watched_node_ids').$type<string[]>().notNull().default([]),
  totalWatchTime: integer('total_watch_time').notNull().default(0),  // 秒
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  lastAccessedAt: timestamp('last_accessed_at').defaultNow().notNull(),
}, (table) => ({
  userVideoUnique: unique('user_video_unique').on(table.userId, table.videoId)
}))

export const choiceHistory = pgTable('choice_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  progressId: uuid('progress_id').notNull().references(() => userProgress.id, { onDelete: 'cascade' }),
  nodeId: uuid('node_id').notNull().references(() => videoNodes.id, { onDelete: 'cascade' }),
  choiceId: uuid('choice_id').references(() => choices.id, { onDelete: 'set null' }),
  timeSpent: decimal('time_spent', { precision: 10, scale: 2 }).notNull(),  // 秒
  isTimeout: boolean('is_timeout').notNull().default(false),
  selectedAt: timestamp('selected_at').defaultNow().notNull(),
}, (table) => ({
  nodeIdIdx: index('choice_history_node_id_idx').on(table.nodeId),
  userProgressIdx: index('choice_history_progress_idx').on(table.progressId)
}))

// リレーション定義
export const userProgressRelations = relations(userProgress, ({ one, many }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  video: one(videoProjects, {
    fields: [userProgress.videoId],
    references: [videoProjects.id],
  }),
  currentNode: one(videoNodes, {
    fields: [userProgress.currentNodeId],
    references: [videoNodes.id],
  }),
  choiceHistory: many(choiceHistory),
}))

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
}))

export type UserProgress = typeof userProgress.$inferSelect
export type NewUserProgress = typeof userProgress.$inferInsert
export type ChoiceHistory = typeof choiceHistory.$inferSelect
export type NewChoiceHistory = typeof choiceHistory.$inferInsert
```

### 6.3 インデックス定義

```typescript
// lib/db/schema/indexes.ts
import { index } from 'drizzle-orm/pg-core'
import { users, videoProjects, videoNodes, choices, branchEdges, userProgress, choiceHistory } from '.'

// ユーザーテーブル
export const usersEmailIdx = index('users_email_idx').on(users.email)

// 動画プロジェクトテーブル
export const videoProjectsStatusIdx = index('video_projects_status_idx').on(videoProjects.status)
export const videoProjectsCreatedByIdx = index('video_projects_created_by_idx').on(videoProjects.createdBy)

// 動画ノードテーブル
export const videoNodesProjectIdIdx = index('video_nodes_project_id_idx').on(videoNodes.projectId)

// 選択肢テーブル
export const choicesNodeIdIdx = index('choices_node_id_idx').on(choices.nodeId)

// 分岐エッジテーブル
export const branchEdgesProjectIdIdx = index('branch_edges_project_id_idx').on(branchEdges.projectId)
export const branchEdgesSourceNodeIdIdx = index('branch_edges_source_node_id_idx').on(branchEdges.sourceNodeId)

// ユーザー進捗テーブル
export const userProgressUserIdIdx = index('user_progress_user_id_idx').on(userProgress.userId)
export const userProgressVideoIdIdx = index('user_progress_video_id_idx').on(userProgress.videoId)
export const userProgressUserVideoIdx = index('user_progress_user_video_idx').on(userProgress.userId, userProgress.videoId)

// 選択履歴テーブル
export const choiceHistoryProgressIdIdx = index('choice_history_progress_id_idx').on(choiceHistory.progressId)
```

---

## 7. 認証・認可設計

### 7.1 認証フロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Browser as ブラウザ
    participant Middleware as Middleware
    participant AuthAPI as Auth API
    participant DB as Database

    User->>Browser: メール/パスワード入力
    Browser->>AuthAPI: POST /api/auth/callback/credentials
    AuthAPI->>DB: ユーザー検索
    DB-->>AuthAPI: ユーザー情報
    AuthAPI->>AuthAPI: パスワード検証(bcrypt)
    alt 認証成功
        AuthAPI->>AuthAPI: JWTセッショントークン生成
        AuthAPI-->>Browser: Set-Cookie (セッション)
        Browser-->>User: ダッシュボードへリダイレクト
    else 認証失敗
        AuthAPI-->>Browser: エラーレスポンス
        Browser-->>User: エラー表示
    end
```

### 7.2 Auth.js 設定

```typescript
// lib/auth/config.ts
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnProtectedRoute = !nextUrl.pathname.startsWith('/login')

      if (isOnProtectedRoute) {
        if (isLoggedIn) return true
        return false // 未認証の場合はログインページへリダイレクト
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/watch', nextUrl))
      }
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as 'admin' | 'viewer'
      }
      return session
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)

        if (!user) return null

        const passwordMatch = await bcrypt.compare(password, user.passwordHash)
        if (!passwordMatch) return null

        // 最終ログイン日時を更新
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id))

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8時間
  },
  trustHost: true,
}
```

```typescript
// lib/auth/index.ts
import NextAuth from 'next-auth'
import { authConfig } from './config'

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig)
```

### 7.3 認可ガード

```typescript
// lib/auth/guards.ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export type Role = 'admin' | 'viewer'

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      ),
      session: null,
    }
  }
  return { error: null, session }
}

export async function requireRole(allowedRoles: Role[]) {
  const { error, session } = await requireAuth()
  if (error) return { error, session: null }

  if (!allowedRoles.includes(session.user.role)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden', message: 'この操作を行う権限がありません' },
        { status: 403 }
      ),
      session: null,
    }
  }
  return { error: null, session }
}

export async function requireAdmin() {
  return requireRole(['admin'])
}
```

### 7.4 Middleware

```typescript
// middleware.ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// レート制限設定
const redis = Redis.fromEnv()

// 未認証ユーザー向け: IPベース、100リクエスト/分
const unauthenticatedRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:unauth',
})

// 認証済みユーザー向け: ユーザーIDベース、200リクエスト/分
const authenticatedRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, '1 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
})

export default auth(async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API エンドポイントへのレート制限
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const session = await auth()

    let rateLimitResult
    if (session?.user?.id) {
      // 認証済みユーザー: ユーザーIDベースの制限（200リクエスト/分）
      rateLimitResult = await authenticatedRatelimit.limit(`user:${session.user.id}`)
    } else {
      // 未認証ユーザー: IPベースの制限（100リクエスト/分）
      const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
      rateLimitResult = await unauthenticatedRatelimit.limit(`ip:${ip}`)
    }

    const { success, limit, reset, remaining } = rateLimitResult

    if (!success) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'リクエスト数が上限に達しました。しばらく待ってから再試行してください。',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      )
    }
  }

  // 管理者ルートの保護
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/analytics') || pathname.startsWith('/api/users')) {
    const session = await auth()
    if (session?.user?.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'この操作を行う権限がありません' },
          { status: 403 }
        )
      }
      return NextResponse.redirect(new URL('/watch', request.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
```

---

## 8. ファイルストレージ設計

### 8.1 R2 クライアント設定

```typescript
// lib/storage/r2.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

export const R2_BUCKET = R2_BUCKET_NAME
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL! // カスタムドメインまたはR2パブリックURL

// ファイルパス生成
export function generateFilePath(type: 'video' | 'thumbnail', projectId: string, filename: string): string {
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${type}s/${projectId}/${timestamp}-${sanitizedFilename}`
}
```

### 8.2 署名付きURL生成

```typescript
// lib/storage/signed-url.ts
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Client, R2_BUCKET, R2_PUBLIC_URL, generateFilePath } from './r2'

type GenerateUploadUrlParams = {
  projectId: string
  filename: string
  contentType: string
  fileSize: number
}

type GenerateUploadUrlResult = {
  uploadUrl: string
  filePath: string
  publicUrl: string
  expiresAt: Date
}

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
const UPLOAD_URL_EXPIRY = 60 * 60 // 1時間

export async function generateUploadUrl({
  projectId,
  filename,
  contentType,
  fileSize,
}: GenerateUploadUrlParams): Promise<GenerateUploadUrlResult> {
  // ファイルサイズ検証
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error(`ファイルサイズが上限（${MAX_FILE_SIZE / 1024 / 1024}MB）を超えています`)
  }

  // コンテンツタイプ検証
  if (!contentType.startsWith('video/mp4')) {
    throw new Error('MP4形式のみアップロード可能です')
  }

  const filePath = generateFilePath('video', projectId, filename)
  const expiresAt = new Date(Date.now() + UPLOAD_URL_EXPIRY * 1000)

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: filePath,
    ContentType: contentType,
    ContentLength: fileSize,
  })

  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn: UPLOAD_URL_EXPIRY,
  })

  return {
    uploadUrl,
    filePath,
    publicUrl: `${R2_PUBLIC_URL}/${filePath}`,
    expiresAt,
  }
}

const DOWNLOAD_URL_EXPIRY = 60 * 60 * 4 // 4時間

export async function generateDownloadUrl(filePath: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: filePath,
  })

  return getSignedUrl(r2Client, command, {
    expiresIn: DOWNLOAD_URL_EXPIRY,
  })
}
```

### 8.3 署名付きURL発行時の権限検証

**video.service.ts での権限検証設計**:

```typescript
// lib/services/video.service.ts

/**
 * 署名付きURL発行時の権限検証
 * - ユーザーがプロジェクトの権限を持っているか検証
 * - 下書き状態の動画は作成者または管理者のみアクセス可能
 */
export async function validateSignedUrlAccess(
  userId: string,
  userRole: 'admin' | 'viewer',
  videoId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const video = await db
    .select()
    .from(videoProjects)
    .where(eq(videoProjects.id, videoId))
    .limit(1)

  if (!video[0]) {
    return { allowed: false, reason: '動画が見つかりません' }
  }

  // 公開済み動画は全ユーザーアクセス可能
  if (video[0].status === 'published') {
    return { allowed: true }
  }

  // 下書き・アーカイブ状態の動画
  if (video[0].status === 'draft' || video[0].status === 'archived') {
    // 管理者はアクセス可能
    if (userRole === 'admin') {
      return { allowed: true }
    }
    // 作成者はアクセス可能
    if (video[0].createdBy === userId) {
      return { allowed: true }
    }
    return { allowed: false, reason: 'この動画にアクセスする権限がありません' }
  }

  return { allowed: true }
}
```

### 8.4 アップロードフロー

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant API as Upload API
    participant R2 as Cloudflare R2
    participant DB as Database

    Client->>API: POST /api/upload<br/>{filename, contentType, fileSize}
    API->>API: ファイル検証
    API->>R2: 署名付きURL生成
    R2-->>API: 署名付きURL
    API->>DB: アップロードセッション記録
    API-->>Client: {uploadUrl, uploadId}

    Client->>R2: PUT ファイルアップロード
    R2-->>Client: 200 OK

    Client->>API: POST /api/upload/complete<br/>{uploadId}
    API->>DB: アップロード完了更新
    API->>API: サムネイル生成（将来対応）
    API-->>Client: {fileUrl, metadata}
```

---

## 9. エラーハンドリング

### 9.1 APIレスポンスヘルパー

```typescript
// lib/utils/api-response.ts
import { NextResponse } from 'next/server'

export type ApiResponse<T = unknown> = {
  data?: T
  error?: string
  message?: string
}

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data }, { status })
}

export function errorResponse(
  error: string,
  message: string,
  status: number
): NextResponse<ApiResponse> {
  return NextResponse.json({ error, message }, { status })
}

export function badRequest(message: string): NextResponse<ApiResponse> {
  return errorResponse('Bad Request', message, 400)
}

export function unauthorized(message = '認証が必要です'): NextResponse<ApiResponse> {
  return errorResponse('Unauthorized', message, 401)
}

export function forbidden(message = 'この操作を行う権限がありません'): NextResponse<ApiResponse> {
  return errorResponse('Forbidden', message, 403)
}

export function notFound(message: string): NextResponse<ApiResponse> {
  return errorResponse('Not Found', message, 404)
}

export function conflict(message: string): NextResponse<ApiResponse> {
  return errorResponse('Conflict', message, 409)
}

export function tooManyRequests(message = 'リクエスト数が上限に達しました'): NextResponse<ApiResponse> {
  return errorResponse('Too Many Requests', message, 429)
}

export function internalError(message = 'サーバーエラーが発生しました'): NextResponse<ApiResponse> {
  return errorResponse('Internal Server Error', message, 500)
}
```

### 9.2 エラーハンドラ

```typescript
// lib/utils/error-handler.ts
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { internalError, badRequest } from './api-response'

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof ZodError) {
    const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
    return badRequest(`バリデーションエラー: ${messages}`)
  }

  if (error instanceof Error) {
    // 既知のエラーメッセージはそのまま返す
    if (error.message.includes('上限') || error.message.includes('形式')) {
      return badRequest(error.message)
    }
  }

  return internalError()
}

// Route Handler ラッパー
export function withErrorHandler<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
): (...args: T) => Promise<R | NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
```

### 9.3 エラーパターン

| HTTPステータス | エラー種別 | 発生ケース |
|---------------|-----------|-----------|
| 400 | Bad Request | バリデーションエラー、不正なパラメータ |
| 401 | Unauthorized | 未認証、セッション切れ |
| 403 | Forbidden | 権限不足 |
| 404 | Not Found | リソースが存在しない |
| 409 | Conflict | 重複エラー |
| 429 | Too Many Requests | レート制限超過 |
| 500 | Internal Server Error | サーバー内部エラー |

---

## 10. バリデーション

### 10.1 共通バリデーション

```typescript
// lib/validation/common.ts
import { z } from 'zod'

export const uuidSchema = z.string().uuid('無効なIDです')

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const emailSchema = z.string().email('有効なメールアドレスを入力してください')

export const passwordSchema = z
  .string()
  .min(8, 'パスワードは8文字以上で入力してください')
  .regex(/[A-Za-z]/, 'パスワードには英字を含めてください')
  .regex(/[0-9]/, 'パスワードには数字を含めてください')
```

### 10.2 動画バリデーション

```typescript
// lib/validation/video.ts
import { z } from 'zod'
import { uuidSchema } from './common'

export const createVideoSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(255, 'タイトルは255文字以内で入力してください'),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').optional(),
})

export const updateVideoSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  thumbnailUrl: z.string().url().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  startNodeId: uuidSchema.optional(),
})

export const videoQuerySchema = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateVideoInput = z.infer<typeof createVideoSchema>
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>
export type VideoQueryInput = z.infer<typeof videoQuerySchema>
```

### 10.3 分岐バリデーション

```typescript
// lib/validation/branch.ts
import { z } from 'zod'
import { uuidSchema } from './common'

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

const choiceSchema = z.object({
  id: z.string(),
  label: z.string().min(1, '選択肢のラベルは必須です').max(100, '選択肢のラベルは100文字以内で入力してください'),
})

const videoNodeDataSchema = z.object({
  videoUrl: z.string().url().nullable(),
  thumbnailUrl: z.string().url().nullable(),
  duration: z.number().int().min(0).nullable(),
  choiceTimestamp: z.number().min(0).nullable(),
})

const choiceNodeDataSchema = z.object({
  choices: z.array(choiceSchema).length(2, '選択肢は2つ設定してください'),
  timeLimit: z.number().int().min(1).max(60).default(10),
})

const endNodeDataSchema = z.object({
  label: z.string().min(1).max(100),
})

const branchNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['video', 'choice', 'end']),
  label: z.string().min(1).max(255),
  position: positionSchema,
  data: z.union([videoNodeDataSchema, choiceNodeDataSchema, endNodeDataSchema]),
})

const branchEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  label: z.string().optional(),
})

export const updateBranchSchema = z.object({
  nodes: z.array(branchNodeSchema),
  edges: z.array(branchEdgeSchema),
})

export type UpdateBranchInput = z.infer<typeof updateBranchSchema>
```

### 10.4 進捗バリデーション

```typescript
// lib/validation/progress.ts
import { z } from 'zod'
import { uuidSchema } from './common'

export const updateProgressSchema = z.object({
  currentNodeId: uuidSchema.optional(),
  watchedNodeIds: z.array(uuidSchema).optional(),
  totalWatchTime: z.number().int().min(0).optional(),
  status: z.enum(['in_progress', 'completed']).optional(),
})

export const recordChoiceSchema = z.object({
  nodeId: uuidSchema,
  choiceId: z.string(),
  timeSpent: z.number().min(0).max(60),
  isTimeout: z.boolean(),
})

export type UpdateProgressInput = z.infer<typeof updateProgressSchema>
export type RecordChoiceInput = z.infer<typeof recordChoiceSchema>
```

---

## 11. インフラ構成

### 11.1 構成図

```mermaid
flowchart TB
    subgraph Internet["インターネット"]
        Users["ユーザー"]
    end

    subgraph Vercel["Vercel Platform"]
        Edge["Vercel Edge Network<br/>グローバルCDN"]
        Functions["Serverless Functions<br/>Node.js Runtime"]
    end

    subgraph Neon["Neon"]
        Primary["Primary Database<br/>PostgreSQL"]
        ReadReplica["Read Replica<br/>（将来拡張）"]
    end

    subgraph Cloudflare["Cloudflare"]
        R2["R2 Object Storage"]
        CDN["Cloudflare CDN<br/>動画配信"]
    end

    subgraph Upstash["Upstash"]
        Redis["Redis<br/>レート制限"]
    end

    Users --> Edge
    Edge --> Functions
    Functions --> Primary
    Functions --> R2
    Edge --> Redis
    R2 --> CDN
    CDN --> Users
```

### 11.2 環境変数

```bash
# .env.local (開発環境)

# Auth.js
AUTH_SECRET="your-auth-secret-32-chars-minimum"
AUTH_URL="http://localhost:3000"

# Neon Database
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="interactive-video-storage"
R2_PUBLIC_URL="https://your-domain.com"

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

### 11.3 Neon コネクション設定

```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)

export const db = drizzle(sql, { schema })

// トランザクション用（必要な場合）
import { Pool } from '@neondatabase/serverless'
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless'

export function createTransactionClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  return drizzlePool(pool, { schema })
}
```

### 11.4 デプロイメント設定

```typescript
// vercel.json
{
  "framework": "nextjs",
  "regions": ["hnd1"],  // 東京リージョン
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    },
    "app/api/upload/**/*.ts": {
      "maxDuration": 60  // アップロード用に延長
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

---

## 12. セキュリティ設計

### 12.1 セキュリティ対策一覧

| 脅威 | 対策 | 実装箇所 |
|------|------|----------|
| SQLインジェクション | Drizzle ORMのパラメータバインディング | 全DBクエリ |
| XSS | React自動エスケープ、CSP | フロントエンド |
| CSRF | Auth.js CSRFトークン | 認証API |
| 認証バイパス | Middleware認証検証 | middleware.ts |
| 権限昇格 | ロールベースアクセス制御 | guards.ts |
| ブルートフォース | レート制限 | middleware.ts |
| 不正ファイルアップロード | ファイルタイプ・サイズ検証 | upload API |
| セッションハイジャック | HTTPOnly Cookie、Secure属性 | Auth.js設定 |

### 12.2 パスワードハッシュ化

```typescript
// lib/auth/password.ts
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

### 12.3 ファイルアップロード検証

```typescript
// lib/validation/upload.ts
import { z } from 'zod'

const ALLOWED_MIME_TYPES = ['video/mp4']
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

export const initiateUploadSchema = z.object({
  filename: z
    .string()
    .min(1, 'ファイル名は必須です')
    .max(255, 'ファイル名は255文字以内で入力してください')
    .regex(/^[a-zA-Z0-9._-]+$/, 'ファイル名に使用できない文字が含まれています'),
  contentType: z
    .string()
    .refine((type) => ALLOWED_MIME_TYPES.includes(type), 'MP4形式のみアップロード可能です'),
  fileSize: z
    .number()
    .int()
    .min(1, 'ファイルサイズは1バイト以上である必要があります')
    .max(MAX_FILE_SIZE, `ファイルサイズは${MAX_FILE_SIZE / 1024 / 1024}MB以下である必要があります`),
})
```

---

## 13. 変更影響マップ

新規プロジェクトのため、既存コードへの影響はなし。

### 13.1 フロントエンドとの統合ポイント

```yaml
統合ポイントマップ:
  認証連携:
    フロントエンド: components/auth/LoginForm.tsx
    バックエンド: /api/auth/[...nextauth]/route.ts
    データ契約: SessionResponse型
    影響レベル: High（認証失敗時のUX）

  動画データ取得:
    フロントエンド: lib/api/videos.ts (TanStack Query)
    バックエンド: /api/videos/*, /api/videos/[id]/branches
    データ契約: VideoData, BranchData型
    影響レベル: High（視聴体験の根幹）

  進捗記録:
    フロントエンド: hooks/useVideoPlayer.ts, stores/progressStore.ts
    バックエンド: /api/progress/[videoId]/*
    データ契約: UserProgress, ChoiceRecord型
    影響レベル: Medium（非同期更新）

  ファイルアップロード:
    フロントエンド: components/upload/VideoUploader.tsx
    バックエンド: /api/upload, /api/upload/complete
    データ契約: InitiateUploadResponse, CompleteUploadResponse型
    影響レベル: High（アップロード失敗時のリカバリ）
```

### 13.2 依存関係マップ

```mermaid
flowchart TD
    subgraph API["API層"]
        AuthAPI["/api/auth"]
        VideoAPI["/api/videos"]
        ProgressAPI["/api/progress"]
        UploadAPI["/api/upload"]
        AnalyticsAPI["/api/analytics"]
    end

    subgraph Services["サービス層"]
        VideoService["video.service"]
        BranchService["branch.service"]
        ProgressService["progress.service"]
        AnalyticsService["analytics.service"]
    end

    subgraph Infrastructure["インフラ層"]
        Auth["Auth.js"]
        DB["Drizzle/Neon"]
        Storage["R2 Client"]
        RateLimit["Upstash"]
    end

    VideoAPI --> VideoService
    VideoAPI --> BranchService
    ProgressAPI --> ProgressService
    UploadAPI --> Storage
    AnalyticsAPI --> AnalyticsService

    VideoService --> DB
    BranchService --> DB
    ProgressService --> DB
    AnalyticsService --> DB

    AuthAPI --> Auth
    Auth --> DB
```

---

## 14. 統合境界契約

### 14.1 フロントエンド - バックエンドAPI

```yaml
境界名: TanStack Query -> Backend API
  入力: HTTPリクエスト（JSON）
  出力: ApiResponse<T>型のJSONレスポンス
  認証: Authorization: Bearer {token} または Session Cookie
  エラー時:
    - 400: バリデーションエラー（フィールド別メッセージ）
    - 401: 未認証（ログインページへリダイレクト）
    - 403: 権限不足（エラーメッセージ表示）
    - 429: レート制限（リトライ待機）
    - 500: サーバーエラー（汎用エラー表示）
```

### 14.2 バックエンド - Neon Database

```yaml
境界名: Drizzle ORM -> Neon PostgreSQL
  入力: Drizzle Query Builder
  出力: 型付きレコード配列
  接続: HTTP（@neondatabase/serverless）
  エラー時:
    - 接続エラー: リトライ後にエラーレスポンス
    - クエリエラー: ログ記録 + 500エラー
    - 制約違反: 409 Conflictエラー
```

### 14.3 バックエンド - Cloudflare R2

```yaml
境界名: S3 Client -> Cloudflare R2
  入力: PutObjectCommand / GetObjectCommand
  出力: 署名付きURL / オブジェクトデータ
  認証: IAM認証情報（環境変数）
  エラー時:
    - 認証エラー: 500エラー + ログ
    - ストレージ不足: 500エラー + アラート
    - オブジェクト未存在: 404エラー
```

---

## 15. 実装フェーズ

### 15.1 アプローチ選定

**Vertical Slice（垂直スライス）** を採用。

#### 選定理由

1. **フロントエンドとの整合**: フロントエンド設計書でVertical Sliceを採用
2. **早期統合テスト**: 各フェーズでE2E動作確認が可能
3. **リスク軽減**: 認証・動画再生の核心機能を早期に検証

### 15.2 実装フェーズ

```mermaid
gantt
    title バックエンド実装フェーズ
    dateFormat  YYYY-MM-DD
    section Phase 1: 認証基盤
    Auth.js設定                :p1-1, 2026-01-15, 2d
    ユーザースキーマ・API      :p1-2, after p1-1, 2d
    Middleware実装            :p1-3, after p1-2, 1d
    section Phase 2: 動画管理
    動画スキーマ定義          :p2-1, after p1-3, 1d
    動画CRUD API             :p2-2, after p2-1, 2d
    分岐データAPI            :p2-3, after p2-2, 2d
    section Phase 3: ファイル管理
    R2クライアント設定        :p3-1, after p2-3, 1d
    署名付きURL生成          :p3-2, after p3-1, 1d
    アップロードAPI          :p3-3, after p3-2, 2d
    section Phase 4: 進捗・分析
    進捗スキーマ定義          :p4-1, after p3-3, 1d
    進捗記録API              :p4-2, after p4-1, 2d
    分析データAPI            :p4-3, after p4-2, 2d
```

### 15.3 フェーズ別検証レベル

| フェーズ | 検証レベル | 検証内容 |
|----------|-----------|----------|
| Phase 1 | L2（統合） | ログイン→認証→権限分岐 |
| Phase 2 | L2（統合） | 動画作成→分岐設定→取得 |
| Phase 3 | L2（統合） | 署名付きURL発行→アップロード→完了 |
| Phase 4 | L2（統合） | 進捗記録→分析データ集計 |

---

## 16. テスト戦略

### 16.1 テスト構成

| テスト種別 | ツール | 対象 |
|-----------|--------|------|
| 単体テスト | Vitest | サービス層、バリデーション |
| 統合テスト | Vitest + MSW | API Route Handlers |
| E2Eテスト | Playwright | フロントエンドとの結合 |

### 16.2 主要テストケース

```typescript
// __tests__/api/videos.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createMocks } from 'node-mocks-http'

describe('/api/videos', () => {
  describe('GET', () => {
    it('認証済みユーザーは動画一覧を取得できる', async () => {
      // ...
    })

    it('未認証ユーザーは401エラーを受け取る', async () => {
      // ...
    })

    it('ページネーションが正しく動作する', async () => {
      // ...
    })
  })

  describe('POST', () => {
    it('管理者は動画プロジェクトを作成できる', async () => {
      // ...
    })

    it('視聴者は動画を作成できない（403）', async () => {
      // ...
    })

    it('バリデーションエラー時は400を返す', async () => {
      // ...
    })
  })
})
```

```typescript
// __tests__/services/progress.service.test.ts
import { describe, it, expect } from 'vitest'
import { ProgressService } from '@/lib/services/progress.service'

describe('ProgressService', () => {
  describe('recordChoice', () => {
    it('選択履歴が正しく記録される', async () => {
      // ...
    })

    it('タイムアウトフラグが正しく設定される', async () => {
      // ...
    })

    it('完了ノードへの遷移で進捗ステータスが更新される', async () => {
      // ...
    })
  })
})
```

---

## 17. 受入条件（Acceptance Criteria）

### 17.1 認証API

| ID | 受入条件 | 検証方法 |
|----|---------|----------|
| AC-AUTH-001 | 正しい認証情報でログインするとセッションが発行される | ログインテスト |
| AC-AUTH-002 | 誤った認証情報ではログインできない | 認証失敗テスト |
| AC-AUTH-003 | 8時間経過でセッションが無効になる | セッション有効期限テスト |
| AC-AUTH-004 | 未認証リクエストは401エラーを返す | 認証ガードテスト |

### 17.2 動画管理API

| ID | 受入条件 | 検証方法 |
|----|---------|----------|
| AC-VIDEO-001 | 管理者は動画プロジェクトを作成できる | 作成APIテスト |
| AC-VIDEO-002 | 視聴者は動画一覧を取得できる | 取得APIテスト |
| AC-VIDEO-003 | 動画の分岐データを保存・取得できる | 分岐APIテスト |
| AC-VIDEO-004 | 視聴者は動画を作成・更新・削除できない | 権限テスト |

### 17.3 ファイルアップロード

| ID | 受入条件 | 検証方法 |
|----|---------|----------|
| AC-UPLOAD-001 | MP4ファイル用の署名付きURLが発行される | URL発行テスト |
| AC-UPLOAD-002 | 500MBを超えるファイルは拒否される | サイズ制限テスト |
| AC-UPLOAD-003 | MP4以外の形式は拒否される | 形式検証テスト |
| AC-UPLOAD-004 | アップロード完了後にメタデータが取得できる | 完了APIテスト |

### 17.4 進捗記録API

| ID | 受入条件 | 検証方法 |
|----|---------|----------|
| AC-PROGRESS-001 | 視聴開始時に進捗レコードが作成される | 進捗作成テスト |
| AC-PROGRESS-002 | 選択履歴が時刻とともに記録される | 選択記録テスト |
| AC-PROGRESS-003 | 終了ノード到達で完了ステータスになる | 完了判定テスト |
| AC-PROGRESS-004 | 自分以外の進捗データは取得できない | アクセス制御テスト |

### 17.5 分析API

| ID | 受入条件 | 検証方法 |
|----|---------|----------|
| AC-ANALYTICS-001 | 管理者は全体の完了率を取得できる | サマリーAPIテスト |
| AC-ANALYTICS-002 | 動画別の選択傾向データを取得できる | 動画分析テスト |
| AC-ANALYTICS-003 | 視聴者は分析データにアクセスできない | 権限テスト |

---

## 18. パフォーマンス最適化

### 18.1 データベースクエリ最適化

```typescript
// lib/services/video.service.ts
import { db } from '@/lib/db'
import { videoProjects, videoNodes, users } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

export async function getVideoList(params: {
  status?: string
  page: number
  limit: number
}) {
  const { status, page, limit } = params
  const offset = (page - 1) * limit

  // カウントと取得を並列実行
  const [countResult, videos] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(videoProjects)
      .where(status ? eq(videoProjects.status, status) : undefined),

    db
      .select({
        id: videoProjects.id,
        title: videoProjects.title,
        description: videoProjects.description,
        thumbnailUrl: videoProjects.thumbnailUrl,
        status: videoProjects.status,
        createdAt: videoProjects.createdAt,
        updatedAt: videoProjects.updatedAt,
        creatorId: users.id,
        creatorName: users.name,
        nodeCount: sql<number>`(
          SELECT COUNT(*) FROM video_nodes
          WHERE video_nodes.project_id = video_projects.id
        )`,
      })
      .from(videoProjects)
      .leftJoin(users, eq(videoProjects.createdBy, users.id))
      .where(status ? eq(videoProjects.status, status) : undefined)
      .orderBy(desc(videoProjects.updatedAt))
      .limit(limit)
      .offset(offset),
  ])

  return {
    data: videos.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      thumbnailUrl: v.thumbnailUrl,
      status: v.status,
      nodeCount: v.nodeCount,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
      createdBy: {
        id: v.creatorId,
        name: v.creatorName,
      },
    })),
    pagination: {
      page,
      limit,
      total: countResult[0]?.count ?? 0,
      totalPages: Math.ceil((countResult[0]?.count ?? 0) / limit),
    },
  }
}
```

### 18.2 キャッシュ戦略

```typescript
// app/api/videos/[videoId]/branches/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  // ...

  const response = NextResponse.json({ data: branchData })

  // 公開済み動画の分岐データは5分キャッシュ
  if (video.status === 'published') {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=60'
    )
  }

  return response
}
```

### 18.3 コールドスタート最適化

- **Drizzle ORM**: バイナリ依存なし、約7KB
- **Neon HTTP Driver**: コネクションプーリング不要
- **必要最小限のimport**: 動的インポートの活用

---

## 19. 監視・ロギング

### 19.1 ロギング設定

```typescript
// lib/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogEntry = {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  }

  // Vercelログとして出力（JSON形式）
  if (level === 'error') {
    console.error(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
}
```

### 19.2 API リクエストロギング

```typescript
// lib/utils/api-logger.ts
import { logger } from './logger'
import { NextRequest } from 'next/server'

export function logApiRequest(request: NextRequest, context?: Record<string, unknown>) {
  logger.info('API Request', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ...context,
  })
}

export function logApiResponse(
  request: NextRequest,
  status: number,
  duration: number,
  context?: Record<string, unknown>
) {
  const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'
  logger[level]('API Response', {
    method: request.method,
    url: request.url,
    status,
    duration,
    ...context,
  })
}
```

---

## 20. 参考資料

### Next.js / Route Handlers

- [Next.js Route Handlers Documentation](https://nextjs.org/docs/app/getting-started/route-handlers) - 公式ドキュメント
- [Building APIs with Next.js](https://nextjs.org/blog/building-apis-with-nextjs) - 公式ブログ
- [Next.js API Routes: The Ultimate Guide](https://makerkit.dev/blog/tutorials/nextjs-api-best-practices) - ベストプラクティス
- [Server Actions vs API Routes in Next.js 15](https://www.wisp.blog/blog/server-actions-vs-api-routes-in-nextjs-15-which-should-i-use) - 使い分けガイド

### データベース

- [PlanetScale vs. Neon: the Continued Saga](https://www.bytebase.com/blog/planetscale-vs-neon/) - 比較記事
- [What's the fastest serverless database provider?](https://pilcrow.vercel.app/blog/serverless-database-latency) - パフォーマンス比較
- [Best alternatives to Neon and PlanetScale](https://northflank.com/blog/neon-planetscale-postgres-alternatives) - 代替オプション

### ORM

- [Drizzle vs Prisma: the Better TypeScript ORM in 2025](https://www.bytebase.com/blog/drizzle-vs-prisma/) - 詳細比較
- [Prisma vs Drizzle ORM in 2026](https://medium.com/@thebelcoder/prisma-vs-drizzle-orm-in-2026-what-you-really-need-to-know-9598cf4eaa7c) - 2026年の視点
- [Drizzle ORM Benchmarks](https://orm.drizzle.team/benchmarks) - パフォーマンスベンチマーク

### ファイルストレージ

- [Cloudflare R2 vs AWS S3](https://www.cloudflare.com/pg-cloudflare-r2-vs-aws-s3/) - 公式比較
- [Cloudflare R2 vs S3: Complete Comparison Guide](https://www.pump.co/blog/cloudflare-vs-s3) - 詳細比較
- [Storage Wars: Cloudflare R2 vs Amazon S3](https://www.vantage.sh/blog/cloudflare-r2-aws-s3-comparison) - コスト比較

### 認証

- [Auth.js Credentials Provider](https://authjs.dev/getting-started/providers/credentials) - 公式ドキュメント
- [Complete Authentication Guide for Next.js App Router](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router) - 包括ガイド
- [NextAuth.js 2025: Secure Authentication](https://strapi.io/blog/nextauth-js-secure-authentication-next-js-guide) - セキュアな実装

---

## 変更履歴

| バージョン | 日付 | 変更内容 | 変更者 |
|------------|------|----------|--------|
| 1.0.0 | 2026-01-14 | 初版作成 | Backend Technical Designer Agent |
| 1.1.0 | 2026-01-14 | Critical/Important/Recommended修正対応 | Claude Code |

### v1.1.0 変更詳細

**Critical修正**:
1. user_progressテーブルにuserVideoUniqueユニーク制約を追加
2. POST /api/progress/[videoId]/choiceのレスポンスにshouldPauseVideo, isCompletedフィールドを追加

**Important修正**:
3. choice_historyテーブルにnodeIdIdx, userProgressIdxインデックスを追加
4. GET /api/videos/[id]/preview（プレビューAPI）を追加
5. GET /api/videos/[id]/status（処理ステータスAPI）を追加
6. 署名付きURL発行時の権限検証ロジック（validateSignedUrlAccess）を追加
7. /api/upload/completeのメタデータ抽出非同期化設計を追加

**Recommended修正**:
8. DELETE /api/videos/[id]にR2ファイル削除とorphanedファイル対応を追加
9. 進捗更新ポーリング戦略（30秒間隔、ETagサポート）を追加
10. 認証済みユーザー向けレート制限（200リクエスト/分）をMiddlewareに追加
