# タスク: Tailwind CSS v4 + shadcn/ui セットアップ

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase1-002 |
| フェーズ | Phase 1: プロジェクト基盤 |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

Tailwind CSS v4 の設定と shadcn/ui の初期化を行い、基本UIコンポーネント（Button, Card, Input, Dialog, Progress）を追加する。グローバルスタイルとレスポンシブブレークポイントを設定する。

---

## 前提条件

### 依存タスク
- phase1-001-nextjs-setup.md（Next.js プロジェクト初期化が完了していること）

### 前提成果物
- `package.json` が存在すること
- Next.js プロジェクトが正常に動作すること

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/globals.css` | 更新 |
| `tailwind.config.ts` | 更新 |
| `components.json` | 新規作成 |
| `src/components/ui/button.tsx` | 新規作成 |
| `src/components/ui/card.tsx` | 新規作成 |
| `src/components/ui/input.tsx` | 新規作成 |
| `src/components/ui/dialog.tsx` | 新規作成 |
| `src/components/ui/progress.tsx` | 新規作成 |
| `src/lib/utils.ts` | 新規作成 |

---

## 実装詳細

### ステップ 1: shadcn/ui 初期化

```bash
npx shadcn@latest init
```

対話式プロンプトでの選択:
- Would you like to use TypeScript? → yes
- Which style would you like to use? → New York
- Which color would you like to use as base color? → Slate
- Where is your global CSS file? → src/app/globals.css
- Would you like to use CSS variables for colors? → yes
- Are you using a custom tailwind prefix? → (空)
- Where is your tailwind.config.js located? → tailwind.config.ts
- Configure the import alias for components → @/components
- Configure the import alias for utils → @/lib/utils

### ステップ 2: 基本UIコンポーネント追加

```bash
npx shadcn@latest add button card input dialog progress
```

### ステップ 3: globals.css カスタマイズ

`src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;

    /* カスタム変数: 動画プレイヤー用 */
    --video-overlay-bg: rgba(0, 0, 0, 0.7);
    --choice-button-bg: rgba(255, 255, 255, 0.95);
    --timer-progress-bg: rgba(59, 130, 246, 1);
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* 動画プレイヤー用スタイル */
@layer components {
  .video-container {
    @apply relative w-full aspect-video bg-black rounded-lg overflow-hidden;
  }

  .choice-overlay {
    @apply absolute inset-0 flex items-center justify-center;
    background: var(--video-overlay-bg);
  }

  .choice-button {
    @apply min-w-[200px] min-h-[48px] px-6 py-3 text-lg font-medium;
    @apply transition-transform hover:scale-105 active:scale-95;
  }
}
```

### ステップ 4: tailwind.config.ts 更新

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      screens: {
        xs: '320px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### ステップ 5: lib/utils.ts 確認

shadcn/ui により自動生成される `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 完了条件

- [x] shadcn/ui の初期化が完了している
- [x] Button, Card, Input, Dialog, Progress コンポーネントが追加されている
- [x] レスポンシブブレークポイント（xs: 320px）が設定されている
- [x] `cn` ユーティリティ関数が利用可能である
- [x] 開発サーバーでコンポーネントが正常に表示される

---

## テスト方法

### 1. コンポーネント表示テスト

`src/app/page.tsx` を一時的に以下に更新してテスト:

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

export default function Home() {
  return (
    <main className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">UIコンポーネントテスト</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Button</h2>
        <div className="flex gap-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Card</h2>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>カードタイトル</CardTitle>
          </CardHeader>
          <CardContent>
            <p>カードの内容がここに表示されます。</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Input</h2>
        <Input placeholder="入力してください" className="max-w-md" />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Progress</h2>
        <Progress value={60} className="max-w-md" />
      </section>
    </main>
  );
}
```

### 2. レスポンシブテスト

```bash
npm run dev
# Chrome DevTools > Device Toolbar で以下のサイズをテスト:
# - 320px (xs)
# - 640px (sm)
# - 768px (md)
# - 1024px (lg)
# - 1280px (xl)
```

### 3. ビルドテスト

```bash
npm run build
# エラーなくビルドが完了することを確認
```

---

## 参照設計書セクション

- DESIGN-FE-2026-001 セクション2.1: 技術スタック（Tailwind CSS v4, shadcn/ui）
- DESIGN-FE-2026-001 セクション5.5: レスポンシブ対応

---

## 成果物

- Tailwind CSS v4 設定完了
- shadcn/ui コンポーネント（Button, Card, Input, Dialog, Progress）
- カスタムCSS変数（動画プレイヤー用）
- レスポンシブブレークポイント設定

---

## 次のタスク

- phase1-004-utils.md: 共通ユーティリティ実装
