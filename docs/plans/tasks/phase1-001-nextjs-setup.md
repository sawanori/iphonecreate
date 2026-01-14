# タスク: Next.js 15 プロジェクト初期化

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase1-001 |
| フェーズ | Phase 1: プロジェクト基盤 |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

Next.js 15 のプロジェクトを初期化し、TypeScript、ESLint、Prettierの基本設定を行う。App Router を有効にし、開発に必要な基盤を構築する。

---

## 前提条件

- Node.js v20 以上がインストールされていること
- npm または pnpm が利用可能であること
- Git がインストールされていること

### 依存タスク
なし（最初のタスク）

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `package.json` | 新規作成 |
| `tsconfig.json` | 新規作成 |
| `.eslintrc.json` | 新規作成 |
| `.prettierrc` | 新規作成 |
| `.gitignore` | 新規作成 |
| `app/layout.tsx` | 新規作成 |
| `app/page.tsx` | 新規作成 |

---

## 実装詳細

### ステップ 1: プロジェクト作成

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### ステップ 2: TypeScript 設定強化

`tsconfig.json` を以下のように更新:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### ステップ 3: ESLint 設定

`.eslintrc.json`:

```json
{
  "extends": [
    "next/core-web-vitals",
    "next/typescript"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-const": "error",
    "no-console": "warn"
  }
}
```

### ステップ 4: Prettier 設定

`.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

### ステップ 5: package.json スクリプト追加

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write ."
  }
}
```

### ステップ 6: .gitignore 確認

以下が含まれていることを確認:

```
# dependencies
/node_modules

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

---

## 完了条件

- [x] `npm run dev` でローカルサーバーが起動し、http://localhost:3000 でページが表示される
- [x] `npm run type-check` でTypeScriptコンパイルエラーがない
- [x] `npm run lint` でESLintエラーがない
- [x] `npm run build` でビルドが成功する
- [x] TypeScript strict mode が有効になっている

---

## テスト方法

### 1. 開発サーバー起動テスト

```bash
npm run dev
# ブラウザで http://localhost:3000 にアクセス
# Next.js のデフォルトページが表示されることを確認
```

### 2. 型チェック

```bash
npm run type-check
# エラーが0件であることを確認
```

### 3. Lint チェック

```bash
npm run lint
# エラーが0件であることを確認
```

### 4. ビルド確認

```bash
npm run build
# ビルドが成功し、.next ディレクトリが生成されることを確認
```

### 5. strict mode 確認

`tsconfig.json` の `compilerOptions.strict` が `true` であることを目視確認

---

## 参照設計書セクション

- DESIGN-FE-2026-001 セクション2.1: 技術スタック
- DESIGN-FE-2026-001 セクション3: プロジェクト構成

---

## 成果物

- 初期化済みNext.js 15プロジェクト
- TypeScript strict mode設定済み
- ESLint/Prettier設定済み

---

## 次のタスク

- phase1-002-tailwind-setup.md: Tailwind CSS v4 + shadcn/ui セットアップ
- phase1-003-drizzle-setup.md: Drizzle ORM + Neon 接続設定（並行実行可能）
