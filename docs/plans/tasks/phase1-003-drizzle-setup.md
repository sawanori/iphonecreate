# タスク: Drizzle ORM + Neon 接続設定

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase1-003 |
| フェーズ | Phase 1: プロジェクト基盤 |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

Drizzle ORM をインストールし、Neon PostgreSQL データベースへの接続設定を行う。マイグレーション環境を構築し、接続テストを実施する。

---

## 前提条件

### 依存タスク
- phase1-001-nextjs-setup.md（Next.js プロジェクト初期化が完了していること）

### 前提成果物
- `package.json` が存在すること
- Neon データベースが作成済みであること（接続文字列が利用可能）

### 環境変数
```
DATABASE_URL=postgres://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require
```

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `drizzle.config.ts` | 新規作成 |
| `src/lib/db/index.ts` | 新規作成 |
| `src/lib/db/schema/index.ts` | 新規作成 |
| `.env.local` | 新規作成 |
| `.env.example` | 新規作成 |

---

## 実装詳細

### ステップ 1: パッケージインストール

```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit dotenv
```

### ステップ 2: 環境変数ファイル作成

`.env.local`:

```
# Database
DATABASE_URL=postgres://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require
```

`.env.example`:

```
# Database
DATABASE_URL=postgres://user:password@host/dbname?sslmode=require
```

### ステップ 3: Drizzle 設定ファイル作成

`drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export default defineConfig({
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
```

### ステップ 4: データベース接続設定

`src/lib/db/index.ts`:

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });

// 接続テスト用関数
export async function testConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as test`;
    return result[0]?.test === 1;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}
```

### ステップ 5: スキーマ初期ファイル作成

`src/lib/db/schema/index.ts`:

```typescript
// スキーマファイルのエントリーポイント
// 各スキーマファイルは後続タスクで追加される

// 例: export * from './users';
// 例: export * from './videos';
// 例: export * from './progress';

// テスト用の一時テーブル
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const testTable = pgTable('_test', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### ステップ 6: package.json スクリプト追加

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:drop": "drizzle-kit drop"
  }
}
```

### ステップ 7: 接続テスト用APIルート（オプション）

`src/app/api/health/db/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function GET() {
  try {
    const isConnected = await testConnection();

    if (isConnected) {
      return NextResponse.json({
        status: 'ok',
        message: 'Database connection successful'
      });
    } else {
      return NextResponse.json(
        { status: 'error', message: 'Database connection failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

---

## 完了条件

- [x] Drizzle ORM がインストールされている
- [x] `drizzle.config.ts` が正しく設定されている
- [ ] データベース接続が成功する（環境変数設定後に検証）
- [ ] `npm run db:studio` で Drizzle Studio が起動する（環境変数設定後に検証）
- [ ] マイグレーションコマンドが動作する（環境変数設定後に検証）

---

## テスト方法

### 1. パッケージインストール確認

```bash
npm list drizzle-orm @neondatabase/serverless drizzle-kit
# インストール済みパッケージが表示されることを確認
```

### 2. Drizzle Studio 起動テスト

```bash
npm run db:studio
# ブラウザで https://local.drizzle.studio が開くことを確認
```

### 3. マイグレーション生成テスト

```bash
npm run db:generate
# drizzle/ ディレクトリにマイグレーションファイルが生成されることを確認
```

### 4. スキーマプッシュテスト

```bash
npm run db:push
# データベースにスキーマが反映されることを確認
```

### 5. API接続テスト（開発サーバー起動後）

```bash
npm run dev
# 別ターミナルで:
curl http://localhost:3000/api/health/db
# {"status":"ok","message":"Database connection successful"} が返ることを確認
```

---

## 参照設計書セクション

- DESIGN-BE-2026-001 セクション2.1: 技術スタック（Drizzle ORM）
- DESIGN-BE-2026-001 セクション11.3: データベース設定

---

## 成果物

- Drizzle ORM 設定ファイル
- Neon データベース接続設定
- マイグレーション環境
- 接続テスト用ユーティリティ

---

## 注意事項

- `.env.local` は `.gitignore` に含まれていることを確認
- 本番環境では環境変数を Vercel の環境変数設定で管理
- 接続プーリングは Neon の serverless driver が自動管理

---

## 次のタスク

- phase1-004-utils.md: 共通ユーティリティ実装
