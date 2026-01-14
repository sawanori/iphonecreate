# タスク: レスポンシブ対応

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase2-007 |
| フェーズ | Phase 2: 視聴画面MVP |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

選択肢ボタンやレイアウトのレスポンシブスタイルを調整する。タッチ操作の最適化（最小48x48pxタップ領域）と、320px幅での縦並びレイアウトを実装する。

---

## 前提条件

### 依存タスク
- phase2-006-watch-page.md（視聴画面ページが存在すること）

### 前提成果物
- `src/components/video/ChoiceOverlay.tsx`
- `src/components/video/CountdownTimer.tsx`
- `src/components/layout/ViewerLayout.tsx`
- `src/app/(viewer)/watch/[videoId]/page.tsx`

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/components/video/ChoiceOverlay.tsx` | 更新 |
| `src/components/video/CountdownTimer.tsx` | 更新 |
| `src/components/layout/ViewerLayout.tsx` | 更新 |
| `src/app/globals.css` | 更新 |

---

## 実装詳細

### ステップ 1: ChoiceOverlay レスポンシブ対応

`src/components/video/ChoiceOverlay.tsx` を更新:

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Choice } from '@/types';

export interface ChoiceOverlayProps {
  choices: Choice[];
  isVisible: boolean;
  onSelect: (choice: Choice) => void;
  remainingTime?: number;
  timeLimit?: number;
  className?: string;
  disabled?: boolean;
}

export function ChoiceOverlay({
  choices,
  isVisible,
  onSelect,
  remainingTime,
  timeLimit,
  className,
  disabled = false,
}: ChoiceOverlayProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setSelectedChoiceId(null);
    }
  }, [isVisible]);

  const handleChoiceClick = useCallback(
    (choice: Choice) => {
      if (disabled || selectedChoiceId) return;

      setSelectedChoiceId(choice.id);

      setTimeout(() => {
        onSelect(choice);
      }, 300);
    },
    [disabled, selectedChoiceId, onSelect]
  );

  if (!isVisible) return null;

  const sortedChoices = [...choices].sort((a, b) => a.order - b.order);
  const timeProgress =
    timeLimit && remainingTime !== undefined
      ? (remainingTime / timeLimit) * 100
      : 100;
  const isTimeLow = timeProgress < 30;

  return (
    <div
      className={cn(
        'choice-overlay absolute inset-0 flex flex-col items-center justify-center',
        'bg-black/70 backdrop-blur-sm z-20',
        // レスポンシブパディング
        'p-4 sm:p-6 md:p-8',
        isAnimating && 'animate-fade-in',
        className
      )}
      role="dialog"
      aria-label="選択肢"
    >
      {/* タイマー表示（レスポンシブ） */}
      {timeLimit && remainingTime !== undefined && (
        <div className="mb-4 sm:mb-6 md:mb-8 text-center">
          <p
            className={cn(
              'text-xl sm:text-2xl font-bold mb-2 transition-colors',
              isTimeLow ? 'text-red-400' : 'text-white'
            )}
          >
            残り {remainingTime.toFixed(1)} 秒
          </p>
          <div className="w-48 sm:w-56 md:w-64 h-2 bg-gray-700 rounded-full overflow-hidden mx-auto">
            <div
              className={cn(
                'h-full transition-all duration-100 ease-linear',
                isTimeLow ? 'bg-red-500' : 'bg-blue-500'
              )}
              style={{ width: `${timeProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 選択肢ボタン（レスポンシブ: xs では縦並び） */}
      <div
        className={cn(
          'flex w-full max-w-2xl',
          // 320px未満: 縦並び、それ以上: 横並び
          'flex-col xs:flex-row',
          'gap-3 sm:gap-4',
          'px-2 sm:px-4'
        )}
      >
        {sortedChoices.map((choice, index) => (
          <Button
            key={choice.id}
            onClick={() => handleChoiceClick(choice)}
            disabled={disabled || selectedChoiceId !== null}
            size="lg"
            variant={selectedChoiceId === choice.id ? 'default' : 'secondary'}
            className={cn(
              'flex-1',
              // 最小タップ領域: 48x48px
              'min-h-[48px] sm:min-h-[56px] md:min-h-[64px]',
              // タッチデバイス向けに大きなタップ領域
              'touch-manipulation',
              // テキストサイズ（レスポンシブ）
              'text-base sm:text-lg',
              // パディング（レスポンシブ）
              'px-4 py-3 sm:px-6 sm:py-4',
              // アニメーション
              'transition-all duration-200',
              'hover:scale-105 active:scale-95',
              // フォーカスリング（アクセシビリティ）
              'focus:ring-4 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black',
              'focus:outline-none',
              // アニメーション遅延
              isAnimating && 'animate-slide-up',
              // 選択状態
              selectedChoiceId === choice.id && 'ring-4 ring-blue-500 scale-105',
              selectedChoiceId && selectedChoiceId !== choice.id && 'opacity-50'
            )}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
            aria-pressed={selectedChoiceId === choice.id}
          >
            <span className="line-clamp-2">{choice.text}</span>
          </Button>
        ))}
      </div>

      {/* 選択後のフィードバック */}
      {selectedChoiceId && (
        <p className="mt-4 sm:mt-6 text-white text-base sm:text-lg animate-fade-in">
          選択を処理中...
        </p>
      )}
    </div>
  );
}
```

### ステップ 2: CountdownTimer レスポンシブ対応

`src/components/video/CountdownTimer.tsx` を更新:

```typescript
'use client';

import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useChoiceTimer } from '@/hooks/useChoiceTimer';

export interface CountdownTimerProps {
  onTimeout?: () => void;
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
  visible?: boolean;
}

export function CountdownTimer({
  onTimeout,
  variant = 'default',
  className,
  visible = true,
}: CountdownTimerProps) {
  const { remainingTime, timeLimit, progress, isRunning } = useChoiceTimer({
    onTimeout,
    enabled: visible,
  });

  const formattedTime = useMemo(() => {
    const seconds = Math.ceil(remainingTime);
    if (variant === 'minimal') {
      return seconds.toString();
    }
    return `${seconds}秒`;
  }, [remainingTime, variant]);

  const colorClass = useMemo(() => {
    if (progress > 50) return 'text-white';
    if (progress > 20) return 'text-yellow-400';
    return 'text-red-400';
  }, [progress]);

  const progressColorClass = useMemo(() => {
    if (progress > 50) return '[&>div]:bg-blue-500';
    if (progress > 20) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-red-500';
  }, [progress]);

  if (!visible || timeLimit === 0) return null;

  // コンパクト表示（レスポンシブ）
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span
          className={cn(
            'text-base sm:text-lg font-bold tabular-nums',
            colorClass
          )}
        >
          {formattedTime}
        </span>
        <Progress
          value={progress}
          className={cn('w-16 sm:w-20 md:w-24 h-2', progressColorClass)}
        />
      </div>
    );
  }

  // 最小表示（レスポンシブ）
  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          'w-10 h-10 sm:w-12 sm:h-12 rounded-full',
          'border-4 transition-colors',
          progress > 50
            ? 'border-blue-500'
            : progress > 20
              ? 'border-yellow-500'
              : 'border-red-500',
          className
        )}
      >
        <span
          className={cn(
            'text-lg sm:text-xl font-bold tabular-nums',
            colorClass
          )}
        >
          {formattedTime}
        </span>
      </div>
    );
  }

  // デフォルト表示（レスポンシブ）
  return (
    <div className={cn('w-full max-w-[280px] sm:max-w-xs', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm text-gray-400">残り時間</span>
        <span
          className={cn(
            'text-xl sm:text-2xl font-bold tabular-nums transition-colors',
            colorClass
          )}
        >
          {formattedTime}
        </span>
      </div>
      <Progress
        value={progress}
        className={cn('h-2 sm:h-3 transition-all', progressColorClass)}
      />
      {progress <= 20 && isRunning && (
        <div className="mt-2 text-center">
          <span className="text-red-400 text-xs sm:text-sm animate-pulse">
            時間切れが近づいています
          </span>
        </div>
      )}
    </div>
  );
}
```

### ステップ 3: ViewerLayout レスポンシブ対応

`src/components/layout/ViewerLayout.tsx` を更新:

```typescript
'use client';

import { cn } from '@/lib/utils';

export interface ViewerLayoutProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function ViewerLayout({
  title,
  children,
  className,
}: ViewerLayoutProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-gray-950 flex flex-col',
        className
      )}
    >
      {/* ヘッダー（レスポンシブ） */}
      {title && (
        <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <h1 className="text-white text-sm sm:text-base md:text-lg font-semibold truncate">
              {title}
            </h1>
          </div>
        </header>
      )}

      {/* メインコンテンツ（レスポンシブパディング） */}
      <main className="flex-1 container mx-auto px-2 sm:px-4 py-3 sm:py-4 md:py-6">
        {children}
      </main>

      {/* フッター（レスポンシブ） */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 text-center">
          <p className="text-gray-500 text-xs sm:text-sm">
            Interactive Video Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
```

### ステップ 4: globals.css レスポンシブユーティリティ追加

`src/app/globals.css` に追加:

```css
/* 既存のスタイルに追加 */

/* タッチデバイス向けスタイル */
@layer utilities {
  .touch-manipulation {
    touch-action: manipulation;
  }

  /* テキスト省略（複数行） */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* 動画コンテナ（レスポンシブ） */
@layer components {
  .video-container {
    @apply relative w-full bg-black rounded-lg overflow-hidden;
    /* アスペクト比を維持 */
    aspect-ratio: 16 / 9;
  }

  /* 選択肢ボタン（レスポンシブ最適化） */
  .choice-button {
    @apply min-w-[120px] sm:min-w-[160px] md:min-w-[200px];
    @apply min-h-[48px]; /* タッチターゲット最小サイズ */
    @apply px-4 sm:px-5 md:px-6;
    @apply py-3 sm:py-3.5 md:py-4;
    @apply text-sm sm:text-base md:text-lg;
    @apply font-medium;
    @apply transition-transform;
    @apply hover:scale-105 active:scale-95;
    /* フォーカス時のアウトライン（アクセシビリティ） */
    @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  }

  /* 選択肢オーバーレイ（レスポンシブ） */
  .choice-overlay {
    @apply absolute inset-0;
    @apply flex items-center justify-center;
    @apply p-4 sm:p-6 md:p-8;
    background: var(--video-overlay-bg);
  }
}

/* 320px以下の極小画面対応 */
@media (max-width: 320px) {
  .choice-button {
    @apply w-full;
    @apply text-sm;
    @apply py-3 px-3;
  }
}

/* セーフエリア対応（ノッチ付きデバイス） */
@supports (padding: env(safe-area-inset-bottom)) {
  .viewer-layout {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

---

## 完了条件

- [x] AC-V-006: 320px幅で選択肢が縦並びになる
- [x] 最小タップ領域が48x48px以上確保されている
- [x] Chrome DevTools デバイスエミュレータで全ブレークポイントが正常動作
- [x] タッチ操作が最適化されている（touch-manipulation）
- [x] フォーカスリングが表示される（アクセシビリティ）

---

## テスト方法

### 1. レスポンシブテスト

```bash
npm run dev
# Chrome DevTools > Device Toolbar

# テストするデバイス:
# - iPhone SE (375px)
# - iPhone 12/13 (390px)
# - iPhone 12/13 Pro Max (428px)
# - iPad (768px)
# - iPad Pro (1024px)
# - Desktop (1920px)
# - カスタム: 320px幅
```

### 2. 320px幅テスト

```
1. Chrome DevTools > Device Toolbar > Responsive
2. 幅を320pxに設定
3. 視聴画面を表示
4. 選択肢が縦並びになることを確認
5. ボタンがはみ出さないことを確認
```

### 3. タップ領域テスト

```
1. Chrome DevTools > More tools > Rendering
2. "Show accessibility tree" を有効化
3. 選択肢ボタンのサイズを確認
4. 48x48px以上であることを確認
```

### 4. タッチデバイステスト

実機またはBrowserStackで確認:

```
- iPhone (iOS Safari)
- Android (Chrome)
- iPad (Safari)

確認項目:
- タップが正確に反応する
- スクロールとタップが干渉しない
- ピンチズームが無効になっていない
```

### 5. アクセシビリティテスト

```bash
# Lighthouse でアクセシビリティスコアを確認
# Chrome DevTools > Lighthouse > Accessibility

# 確認項目:
# - フォーカスインジケーターが表示される
# - キーボードナビゲーションが可能
# - コントラスト比が十分
```

---

## 参照設計書セクション

- DESIGN-FE-2026-001 セクション5.5: レスポンシブ対応

---

## 成果物

- レスポンシブ対応済み ChoiceOverlay
- レスポンシブ対応済み CountdownTimer
- レスポンシブ対応済み ViewerLayout
- レスポンシブユーティリティCSS

---

## 注意事項

- `xs` ブレークポイント（320px）は tailwind.config.ts で追加済み
- タッチデバイスでは `:hover` が期待通りに動作しない場合がある
- 極小画面（320px未満）は限定的なサポート

---

## 次のタスク

- phase2-completion.md: Phase 2 完了検証
