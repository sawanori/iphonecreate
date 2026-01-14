# 全体設計ドキュメント: インタラクティブ動画プラットフォーム

生成日時: 2026-01-14
対象計画書: work-plan.md

## プロジェクト概要

### 目的とゴール
社内・チーム向け教育研修用のインタラクティブ動画プラットフォームの開発。視聴者が動画内で選択肢を選ぶことでストーリーが分岐し、能動的な学習体験を提供する。

### 背景とコンテキスト
- 従来の一方向的な動画研修では学習効果が限定的
- 選択による分岐体験により、能動的な参加を促進
- 進捗管理と分析により、学習効果の可視化が可能

## タスク分割設計

### 分割ポリシー
- **Vertical Slice（垂直スライス）** を採用
- 各フェーズで動作検証可能な状態を維持
- 1コミット = 1タスクの粒度で分割
- 各タスクは独立して実行・検証可能

### 検証レベル分布
| フェーズ | 検証レベル | 内容 |
|----------|------------|------|
| Phase 1 | L1（単体） | 各設定の動作確認 |
| Phase 2 | L2（統合） | 動画再生から分岐完了までのE2Eフロー |
| Phase 3 | L2（統合） | ログインから権限別画面遷移 |
| Phase 4 | L2（統合） | フロー作成から保存・読み込み |
| Phase 5 | L2（統合） | 進捗記録から分析データ集計 |

### タスク間関係マップ

```
Phase 1: プロジェクト基盤
├── phase1-001-nextjs-setup.md → 成果物: Next.js プロジェクト
│   ↓
├── phase1-002-tailwind-setup.md → 成果物: UI基盤
│   ↓
├── phase1-003-drizzle-setup.md → 成果物: DB接続
│   ↓
├── phase1-004-utils.md → 成果物: 共通ユーティリティ
│   ↓
├── phase1-005-types.md → 成果物: 型定義
│   ↓
└── phase1-completion.md → Phase 1 完了検証

Phase 2: 視聴画面MVP
├── phase2-001-video-player.md → 成果物: VideoPlayer コンポーネント
│   ↓
├── phase2-002-video-store.md → 成果物: Zustand ストア
│   ↓
├── phase2-003-choice-overlay.md → 成果物: ChoiceOverlay コンポーネント
│   ↓
├── phase2-004-countdown-timer.md → 成果物: CountdownTimer コンポーネント
│   ↓
├── phase2-005-branch-transition.md → 成果物: 分岐遷移ロジック
│   ↓
├── phase2-006-watch-page.md → 成果物: 視聴画面ページ
│   ↓
├── phase2-007-responsive.md → 成果物: レスポンシブ対応
│   ↓
└── phase2-completion.md → Phase 2 完了検証

Phase 3: 認証機能
├── phase3-001-authjs-setup.md → 成果物: Auth.js 設定
│   ↓
├── phase3-002-user-schema.md → 成果物: ユーザースキーマ
│   ↓
├── phase3-003-login-page.md → 成果物: ログイン画面
│   ↓
├── phase3-004-middleware.md → 成果物: 認証ミドルウェア
│   ↓
├── phase3-005-role-routing.md → 成果物: 権限別ルーティング
│   ↓
└── phase3-completion.md → Phase 3 完了検証

Phase 4: 管理画面
├── phase4-001-reactflow-editor.md → 成果物: React Flow エディタ
│   ↓
├── phase4-002-custom-nodes.md → 成果物: カスタムノード
│   ↓
├── phase4-003-r2-storage.md → 成果物: R2 ストレージ接続（並行可能）
│   ↓
├── phase4-004-video-upload.md → 成果物: 動画アップロード機能
│   ↓
├── phase4-005-branch-api.md → 成果物: 分岐設定API
│   ↓
├── phase4-006-admin-page.md → 成果物: 管理画面ページ
│   ↓
└── phase4-completion.md → Phase 4 完了検証

Phase 5: 進捗管理
├── phase5-001-progress-schema.md → 成果物: 進捗スキーマ
│   ↓
├── phase5-002-progress-api.md → 成果物: 進捗記録API
│   ↓
├── phase5-003-choice-history.md → 成果物: 選択履歴記録機能
│   ↓
├── phase5-004-progress-page.md → 成果物: 進捗表示画面
│   ↓
├── phase5-005-analytics-dashboard.md → 成果物: 分析ダッシュボード
│   ↓
├── phase5-006-e2e-test.md → 成果物: E2Eテスト
│   ↓
└── phase5-completion.md → Phase 5 完了検証
```

### インターフェース変更影響分析
| 既存インターフェース | 新規インターフェース | 変換必要 | 対応タスク |
|---------------------|---------------------|----------|-----------|
| - | VideoPlayer | 新規作成 | phase2-001 |
| - | VideoStore | 新規作成 | phase2-002 |
| - | ChoiceOverlay | 新規作成 | phase2-003 |
| - | Auth.js Config | 新規作成 | phase3-001 |
| - | FlowEditor | 新規作成 | phase4-001 |
| - | ProgressService | 新規作成 | phase5-002 |

### 共通処理ポイント
1. **型定義**: `types/` ディレクトリで一元管理（phase1-005で作成）
2. **APIレスポンス**: `lib/utils/api-response.ts` で統一（phase1-004で作成）
3. **エラーハンドリング**: `lib/utils/error-handler.ts` で統一（phase1-004で作成）
4. **認証ガード**: `lib/auth/guards.ts` で統一（phase3-004で作成）

## 実装上の注意事項

### 全体を通じて維持すべき原則
1. TypeScript strict mode を維持
2. 設計書（DESIGN-FE-2026-001, DESIGN-BE-2026-001）との整合性を保つ
3. パフォーマンス要件（動画読み込み3秒以内、選択肢表示0.5秒以内、分岐遷移2秒以内）を意識
4. レスポンシブ対応（320px〜1920px）を考慮

### リスクと対策
- **動画読み込み遅延**: プリロード戦略実装、CDN配信最適化
- **サーバーレスコールドスタート**: Drizzle ORM採用、必要最小限import
- **React Flow パフォーマンス**: 仮想化、メモ化、遅延読み込み
- **大容量アップロード失敗**: マルチパートアップロード、リトライ機構

### 影響範囲管理
- **変更許可範囲**: `app/`, `components/`, `lib/`, `stores/`, `types/`, `hooks/`
- **変更禁止領域**: `node_modules/`, 既存の設計書（参照のみ）

## タスク一覧

### Phase 1: プロジェクト基盤（5タスク + 完了タスク）
| No | ファイル名 | タスク名 | 対象ファイル数 |
|----|-----------|----------|---------------|
| 1 | phase1-001-nextjs-setup.md | Next.js 15 プロジェクト初期化 | 5-6 |
| 2 | phase1-002-tailwind-setup.md | Tailwind CSS v4 + shadcn/ui セットアップ | 3-4 |
| 3 | phase1-003-drizzle-setup.md | Drizzle ORM + Neon 接続設定 | 3-4 |
| 4 | phase1-004-utils.md | 共通ユーティリティ実装 | 4 |
| 5 | phase1-005-types.md | 型定義ファイル作成 | 5 |
| - | phase1-completion.md | Phase 1 完了検証 | - |

### Phase 2: 視聴画面MVP（7タスク + 完了タスク）
| No | ファイル名 | タスク名 | 対象ファイル数 |
|----|-----------|----------|---------------|
| 1 | phase2-001-video-player.md | react-player 動画プレイヤー基盤 | 2 |
| 2 | phase2-002-video-store.md | Zustand ビデオストア実装 | 1 |
| 3 | phase2-003-choice-overlay.md | 選択肢オーバーレイコンポーネント | 1 |
| 4 | phase2-004-countdown-timer.md | カウントダウンタイマー | 2 |
| 5 | phase2-005-branch-transition.md | 分岐遷移ロジック | 2 |
| 6 | phase2-006-watch-page.md | 視聴画面ページ統合 | 2 |
| 7 | phase2-007-responsive.md | レスポンシブ対応 | 1-2 |
| - | phase2-completion.md | Phase 2 完了検証 | - |

### Phase 3: 認証機能（5タスク + 完了タスク）
| No | ファイル名 | タスク名 | 対象ファイル数 |
|----|-----------|----------|---------------|
| 1 | phase3-001-authjs-setup.md | Auth.js v5 設定 | 2-3 |
| 2 | phase3-002-user-schema.md | ユーザースキーマ定義 | 2 |
| 3 | phase3-003-login-page.md | ログイン画面実装 | 2 |
| 4 | phase3-004-middleware.md | Middleware 認証ガード | 2-3 |
| 5 | phase3-005-role-routing.md | 権限別ルーティング | 2 |
| - | phase3-completion.md | Phase 3 完了検証 | - |

### Phase 4: 管理画面（6タスク + 完了タスク）
| No | ファイル名 | タスク名 | 対象ファイル数 |
|----|-----------|----------|---------------|
| 1 | phase4-001-reactflow-editor.md | React Flow エディタ基盤 | 3 |
| 2 | phase4-002-custom-nodes.md | カスタムノード実装 | 4 |
| 3 | phase4-003-r2-storage.md | R2 ストレージ接続 | 2 |
| 4 | phase4-004-video-upload.md | 動画アップロード機能 | 4 |
| 5 | phase4-005-branch-api.md | 分岐設定API | 5 |
| 6 | phase4-006-admin-page.md | 管理画面ページ統合 | 3 |
| - | phase4-completion.md | Phase 4 完了検証 | - |

### Phase 5: 進捗管理（6タスク + 完了タスク）
| No | ファイル名 | タスク名 | 対象ファイル数 |
|----|-----------|----------|---------------|
| 1 | phase5-001-progress-schema.md | 進捗スキーマ定義 | 1 |
| 2 | phase5-002-progress-api.md | 進捗記録API実装 | 3 |
| 3 | phase5-003-choice-history.md | 選択履歴記録機能 | 2 |
| 4 | phase5-004-progress-page.md | 進捗表示画面 | 2 |
| 5 | phase5-005-analytics-dashboard.md | 分析ダッシュボード | 4 |
| 6 | phase5-006-e2e-test.md | 最終統合テスト | 2-3 |
| - | phase5-completion.md | Phase 5 完了検証 | - |

## 実行順序

推奨実行順序は以下の通り（依存関係を考慮）:

1. Phase 1: phase1-001 → phase1-002 / phase1-003（並行可） → phase1-004 → phase1-005 → phase1-completion
2. Phase 2: phase2-001 → phase2-002 → phase2-003 → phase2-004 → phase2-005 → phase2-006 → phase2-007 → phase2-completion
3. Phase 3: phase3-001 → phase3-002 → phase3-003 → phase3-004 → phase3-005 → phase3-completion
4. Phase 4: phase4-001 → phase4-002 / phase4-003（並行可） → phase4-004 → phase4-005 → phase4-006 → phase4-completion
5. Phase 5: phase5-001 → phase5-002 → phase5-003 → phase5-004 → phase5-005 → phase5-006 → phase5-completion
