# Phase 2 完了検証

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase2-completion |
| フェーズ | Phase 2: 視聴画面MVP |
| 作成日 | 2026-01-14 |
| 想定工数 | 0.5日 |
| 検証レベル | L2（統合） |

---

## 概要

Phase 2 の全タスクが完了していることを確認し、視聴画面MVPが正常に動作することを検証する。モックデータでの動画再生から分岐遷移、完了までの一連フローを確認する。

---

## 前提条件

### 依存タスク
- phase2-001-video-player.md
- phase2-002-video-store.md
- phase2-003-choice-overlay.md
- phase2-004-countdown-timer.md
- phase2-005-branch-transition.md
- phase2-006-watch-page.md
- phase2-007-responsive.md

---

## 完了タスクチェックリスト

### phase2-001: react-player 動画プレイヤー基盤
- [ ] react-player がインストールされている
- [ ] VideoPlayer コンポーネントが作成されている
- [ ] AC-V-001: MP4動画がブラウザで再生される

### phase2-002: Zustand ビデオストア実装
- [ ] Zustand がインストールされている
- [ ] videoStore が作成されている
- [ ] DevTools で状態変更が確認できる

### phase2-003: 選択肢オーバーレイコンポーネント
- [ ] ChoiceOverlay コンポーネントが作成されている
- [ ] AC-V-002: 指定タイミングで2つの選択肢がオーバーレイ表示される

### phase2-004: カウントダウンタイマー
- [ ] useChoiceTimer フックが作成されている
- [ ] CountdownTimer コンポーネントが作成されている
- [ ] AC-V-003: カウントダウンタイマーが表示され、残り時間が減少する
- [ ] AC-V-005: 制限時間超過で動画が一時停止する

### phase2-005: 分岐遷移ロジック
- [ ] useVideoPlayer フックが作成されている
- [ ] BranchTransition コンポーネントが作成されている
- [ ] AC-V-004: 選択肢を選ぶと対応する動画に遷移する
- [ ] AC-V-007: 選択から次の動画再生まで2秒以内

### phase2-006: 視聴画面ページ統合
- [ ] 視聴画面ページが作成されている
- [ ] ViewerLayout が適用されている
- [ ] 一連フローが動作する

### phase2-007: レスポンシブ対応
- [ ] AC-V-006: 320px幅で選択肢が縦並びになる
- [ ] 最小タップ領域が48x48px以上

---

## E2E検証手順

### 1. 一連フロー動作確認

```bash
npm run dev
# http://localhost:3000/watch/test-video にアクセス
```

以下のシナリオを実行:

```
1. ページアクセス
   - ローディング表示 → 動画表示
   - 動画が自動再生される

2. 選択肢表示
   - choiceDisplayTime（8秒）後に選択肢が表示される
   - 動画が一時停止する
   - カウントダウンタイマーが表示される

3. 選択肢選択
   - 選択肢Aをクリック
   - 選択アニメーションが表示される
   - 遷移アニメーションが表示される
   - 次の動画が再生される

4. タイムアウトテスト
   - 選択肢を選ばずに待機
   - タイマーが0になる
   - defaultChoiceId がある場合: 自動遷移
   - defaultChoiceId がない場合: 一時停止

5. 完了画面
   - 終了ノードに到達
   - 完了画面が表示される
   - 「もう一度視聴」で最初から再開できる
```

### 2. レスポンシブテスト

Chrome DevTools で以下のサイズをテスト:

| デバイス | 幅 | 確認項目 |
|---------|-----|---------|
| iPhone SE | 375px | 選択肢縦並び |
| iPhone 12 | 390px | 選択肢縦並び |
| iPad | 768px | 選択肢横並び |
| Desktop | 1280px | 選択肢横並び |
| 極小画面 | 320px | 選択肢縦並び、はみ出しなし |

### 3. パフォーマンステスト

```bash
# Chrome DevTools > Performance タブで計測
```

| 指標 | 目標値 | 確認方法 |
|------|--------|---------|
| 動画読み込み時間 | 3秒以内 | Network タブで確認 |
| 選択肢表示遅延 | 0.5秒以内 | Performance タブで計測 |
| 分岐遷移時間 | 2秒以内 | Performance タブで計測 |

### 4. アクセシビリティテスト

```
1. キーボード操作
   - Tab キーで選択肢間を移動できる
   - Enter キーで選択できる
   - フォーカスリングが表示される

2. スクリーンリーダー
   - 選択肢テキストが読み上げられる
   - 残り時間が読み上げられる
```

### 5. エラーハンドリングテスト

```
1. 無効な videoId でアクセス
   - エラーメッセージが表示される

2. ネットワークエラー（DevTools でオフライン）
   - 適切なエラー表示
```

---

## 受入条件達成状況

### 視聴画面

- [ ] AC-V-001: MP4動画がブラウザで再生される
- [ ] AC-V-002: 指定タイミングで2つの選択肢がオーバーレイ表示される
- [ ] AC-V-003: カウントダウンタイマーが表示され、残り時間が減少する
- [ ] AC-V-004: 選択肢を選ぶと対応する動画に遷移する
- [ ] AC-V-005: 制限時間超過で動画が一時停止する
- [ ] AC-V-006: 320px幅で選択肢が縦並びになる
- [ ] AC-V-007: 選択から次の動画再生まで2秒以内

---

## 成果物確認

### 必須ファイル一覧

```
src/
├── app/
│   ├── (viewer)/
│   │   ├── layout.tsx
│   │   └── watch/
│   │       └── [videoId]/
│   │           └── page.tsx
│   └── globals.css (更新済み)
├── components/
│   ├── layout/
│   │   ├── index.ts
│   │   └── ViewerLayout.tsx
│   └── video/
│       ├── index.ts
│       ├── VideoPlayer.tsx
│       ├── ChoiceOverlay.tsx
│       ├── CountdownTimer.tsx
│       └── BranchTransition.tsx
├── hooks/
│   ├── index.ts
│   ├── useChoiceTimer.ts
│   └── useVideoPlayer.ts
├── stores/
│   └── videoStore.ts
└── lib/
    └── mock/
        └── video-data.ts
```

---

## Phase 2 完了条件

- [ ] 全タスクのチェックリストが完了している
- [ ] 一連フロー動作確認が完了している
- [ ] 全ブレークポイントでのUI確認が完了している
- [ ] パフォーマンス要件を達成している
- [ ] 全受入条件を達成している

---

## 次のフェーズへの引き継ぎ事項

### Phase 3 で使用する成果物
- 視聴画面ページ: `/watch/[videoId]`
- ViewerLayout: 認証後のレイアウトとして活用
- VideoStore: 進捗記録との連携で使用

### 注意事項
- 現在はモックデータを使用。Phase 5 で API 連携に変更
- 進捗の永続化は Phase 5 で実装
- 認証による視聴制限は Phase 3 で実装

---

## 問題発生時の対処

### 動画が再生されない場合
1. 動画URLが有効か確認
2. CORS設定を確認
3. ブラウザの自動再生ポリシーを確認

### 選択肢が表示されない場合
1. choiceDisplayTime の設定を確認
2. videoStore の状態を DevTools で確認
3. onTimeReached コールバックが呼ばれているか確認

### 遷移が動作しない場合
1. targetNodeId が正しいか確認
2. nodes 配列に対象ノードが存在するか確認
3. isTransitioning の状態を確認

---

## 承認

- [ ] Phase 2 完了を確認
- [ ] Phase 3 開始準備完了
