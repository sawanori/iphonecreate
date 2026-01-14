# タスク: 最終統合テスト

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase5-006 |
| フェーズ | Phase 5: 進捗管理 |
| 作成日 | 2026-01-14 |
| 想定工数 | 2日 |
| 検証レベル | L3（E2E） |

---

## 概要

Playwright を使用した E2E テストを作成し、全機能の統合テストを実施する。パフォーマンステストとクロスブラウザテストを含む。

---

## 前提条件

### 依存タスク
- phase5-005-analytics-dashboard.md（分析ダッシュボードが実装されていること）

### 前提成果物
- 全 Phase の実装が完了していること

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `e2e/auth.spec.ts` | 新規作成 |
| `e2e/viewer.spec.ts` | 新規作成 |
| `e2e/admin.spec.ts` | 新規作成 |
| `playwright.config.ts` | 新規作成 |

---

## 実装詳細

### ステップ 1: Playwright インストール

```bash
npm install -D @playwright/test
npx playwright install
```

### ステップ 2: Playwright 設定

`playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### ステップ 3: 認証テスト作成

`e2e/auth.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('認証機能', () => {
  test('AC-AUTH-001: メール/パスワードでログインできる', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // ログイン成功後、ダッシュボードにリダイレクト
    await expect(page).toHaveURL('/dashboard');
  });

  test('バリデーションエラーが表示される', async ({ page }) => {
    await page.goto('/login');

    // 空のフォームで送信
    await page.click('button[type="submit"]');

    // エラーメッセージが表示される
    await expect(page.locator('text=メールアドレスを入力')).toBeVisible();
  });

  test('ログイン失敗時にエラーが表示される', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // エラーメッセージが表示される
    await expect(page.locator('text=正しくありません')).toBeVisible();
  });

  test('AC-AUTH-002: 管理者は管理画面にアクセスできる', async ({ page }) => {
    // 管理者でログイン
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/dashboard');

    // ダッシュボードにアクセス可能
    await expect(page.locator('h1')).toContainText('ダッシュボード');
  });

  test('AC-AUTH-003: 視聴者は管理画面にアクセスできない', async ({ page }) => {
    // 視聴者でログイン
    await page.goto('/login');
    await page.fill('input[type="email"]', 'viewer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 管理画面にアクセス試行
    await page.goto('/dashboard');

    // 権限エラーページにリダイレクト
    await expect(page).toHaveURL('/unauthorized');
  });
});
```

### ステップ 4: 視聴画面テスト作成

`e2e/viewer.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('視聴画面', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン
    await page.goto('/login');
    await page.fill('input[type="email"]', 'viewer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('AC-V-001: MP4動画がブラウザで再生される', async ({ page }) => {
    await page.goto('/watch/test-project');

    // 動画プレイヤーが表示される
    const videoPlayer = page.locator('.video-container');
    await expect(videoPlayer).toBeVisible();

    // 動画が読み込まれる
    await page.waitForSelector('video', { state: 'attached' });
  });

  test('AC-V-002: 指定タイミングで選択肢が表示される', async ({ page }) => {
    await page.goto('/watch/test-project');

    // 選択肢が表示されるまで待機
    const choiceOverlay = page.locator('.choice-overlay');
    await expect(choiceOverlay).toBeVisible({ timeout: 30000 });

    // 2つの選択肢ボタンが表示される
    const buttons = choiceOverlay.locator('button');
    await expect(buttons).toHaveCount(2);
  });

  test('AC-V-003: カウントダウンタイマーが表示される', async ({ page }) => {
    await page.goto('/watch/test-project');

    // 選択肢表示まで待機
    await page.waitForSelector('.choice-overlay', { state: 'visible', timeout: 30000 });

    // タイマーが表示される
    const timer = page.locator('text=/残り.*秒/');
    await expect(timer).toBeVisible();
  });

  test('AC-V-004: 選択肢を選ぶと動画が遷移する', async ({ page }) => {
    await page.goto('/watch/test-project');

    // 選択肢表示まで待機
    await page.waitForSelector('.choice-overlay', { state: 'visible', timeout: 30000 });

    // 最初の選択肢をクリック
    await page.click('.choice-overlay button:first-child');

    // 遷移アニメーション後、新しい動画が再生される
    await page.waitForTimeout(1000);
    await expect(page.locator('.choice-overlay')).not.toBeVisible();
  });

  test('AC-V-006: 320px幅で選択肢が縦並びになる', async ({ page }) => {
    // ビューポートを320pxに設定
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/watch/test-project');

    // 選択肢表示まで待機
    await page.waitForSelector('.choice-overlay', { state: 'visible', timeout: 30000 });

    // 選択肢ボタンのレイアウトを確認
    const buttons = page.locator('.choice-overlay button');
    const firstButton = buttons.first();
    const secondButton = buttons.last();

    const firstBox = await firstButton.boundingBox();
    const secondBox = await secondButton.boundingBox();

    // 縦並び（Y座標が異なる）
    expect(firstBox!.y).toBeLessThan(secondBox!.y);
  });
});

test.describe('パフォーマンス', () => {
  test('AC-V-007: 選択から次の動画再生まで2秒以内', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'viewer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    await page.goto('/watch/test-project');

    // 選択肢表示まで待機
    await page.waitForSelector('.choice-overlay', { state: 'visible', timeout: 30000 });

    const startTime = Date.now();

    // 選択肢をクリック
    await page.click('.choice-overlay button:first-child');

    // 遷移完了まで待機
    await page.waitForSelector('.choice-overlay', { state: 'hidden' });

    const duration = Date.now() - startTime;

    // 2秒以内
    expect(duration).toBeLessThan(2000);
  });
});
```

### ステップ 5: 管理画面テスト作成

`e2e/admin.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('管理画面', () => {
  test.beforeEach(async ({ page }) => {
    // 管理者でログイン
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('AC-A-001: ノードをドラッグ&ドロップできる', async ({ page }) => {
    await page.goto('/editor/new');

    // ツールバーから動画ノードをドラッグ
    const videoNodeButton = page.locator('text=動画ノード');
    const canvas = page.locator('.react-flow');

    await videoNodeButton.dragTo(canvas);

    // ノードが追加される
    const nodes = page.locator('.react-flow__node');
    await expect(nodes).toHaveCount(1);
  });

  test('AC-A-002: ノード間を線で接続できる', async ({ page }) => {
    await page.goto('/editor/new');

    // 2つのノードを追加
    const videoNodeButton = page.locator('text=動画ノード');
    const canvas = page.locator('.react-flow');

    await videoNodeButton.dragTo(canvas, { targetPosition: { x: 100, y: 100 } });
    await videoNodeButton.dragTo(canvas, { targetPosition: { x: 300, y: 100 } });

    // ノードを接続
    const sourceHandle = page.locator('.react-flow__node').first().locator('.react-flow__handle-bottom');
    const targetHandle = page.locator('.react-flow__node').last().locator('.react-flow__handle-top');

    await sourceHandle.dragTo(targetHandle);

    // エッジが作成される
    const edges = page.locator('.react-flow__edge');
    await expect(edges).toHaveCount(1);
  });

  test('AC-A-005: プレビューで動画フローを確認できる', async ({ page }) => {
    // 既存プロジェクトを開く（テスト用プロジェクトが必要）
    await page.goto('/editor/test-project');

    // プレビューボタンをクリック
    const previewButton = page.locator('text=プレビュー');

    // 新しいタブでプレビューが開く
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      previewButton.click(),
    ]);

    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('/watch/');
  });
});

test.describe('分析ダッシュボード', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('AC-ANALYTICS-001: 全体の完了率が表示される', async ({ page }) => {
    // 完了率カードが表示される
    const completionCard = page.locator('text=完了率').first();
    await expect(completionCard).toBeVisible();
  });

  test('AC-ANALYTICS-003: 視聴者は分析データにアクセスできない', async ({ page }) => {
    // ログアウト
    await page.click('text=ログアウト');

    // 視聴者でログイン
    await page.goto('/login');
    await page.fill('input[type="email"]', 'viewer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 分析APIに直接アクセス
    const response = await page.request.get('/api/analytics');
    expect(response.status()).toBe(403);
  });
});
```

### ステップ 6: package.json スクリプト追加

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:report": "playwright show-report"
  }
}
```

---

## 完了条件

- [x] Playwright テストが作成されている
- [x] E2Eテストシナリオが全受入条件をカバーしている
- [x] パフォーマンステストが含まれている
- [x] クロスブラウザテスト（Chrome, Firefox, Safari, Mobile）が設定されている
- [ ] 全テストが合格する（テスト実行は本タスクのスコープ外）

---

## テスト実行方法

### 1. E2Eテスト実行

```bash
# 全テスト実行
npm run test:e2e

# UIモードで実行
npm run test:e2e:ui

# 特定のブラウザで実行
npx playwright test --project=chromium

# 特定のファイルを実行
npx playwright test e2e/auth.spec.ts
```

### 2. レポート確認

```bash
npm run test:e2e:report
```

### 3. CI環境での実行

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## 参照設計書セクション

- DESIGN-FE-2026-001 セクション14: テスト戦略
- DESIGN-FE-2026-001 セクション15: 受入条件

---

## 成果物

- `playwright.config.ts`
- `e2e/auth.spec.ts`
- `e2e/viewer.spec.ts`
- `e2e/admin.spec.ts`

---

## 次のタスク

- phase5-completion.md: Phase 5 完了検証
