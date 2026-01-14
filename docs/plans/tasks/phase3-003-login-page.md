# タスク: ログイン画面実装

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase3-003 |
| フェーズ | Phase 3: 認証機能 |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

ログイン画面を実装する。React Hook Form と Zod によるバリデーション、エラーメッセージ表示、ログイン処理を実装する。

---

## 前提条件

### 依存タスク
- phase3-002-user-schema.md（ユーザースキーマが定義されていること）

### 前提成果物
- `src/lib/auth/index.ts`
- `src/lib/db/repositories/user.repository.ts`
- shadcn/ui コンポーネント（Input, Button, Card）

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/(auth)/login/page.tsx` | 新規作成 |
| `src/app/(auth)/layout.tsx` | 新規作成 |
| `src/components/auth/LoginForm.tsx` | 新規作成 |
| `src/components/auth/index.ts` | 新規作成 |

---

## 実装詳細

### ステップ 1: React Hook Form インストール

```bash
npm install react-hook-form @hookform/resolvers
```

### ステップ 2: LoginForm コンポーネント作成

`src/components/auth/LoginForm.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * ログインフォームスキーマ
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .min(8, 'パスワードは8文字以上で入力してください'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * LoginForm コンポーネントのProps
 */
export interface LoginFormProps {
  /** 追加のクラス名 */
  className?: string;
}

/**
 * ログインフォームコンポーネント
 */
export function LoginForm({ className }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('メールアドレスまたはパスワードが正しくありません');
        return;
      }

      // ログイン成功
      router.push(callbackUrl);
      router.refresh();
    } catch (e) {
      setError('ログイン中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          ログイン
        </CardTitle>
        <CardDescription className="text-center">
          メールアドレスとパスワードを入力してください
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* エラーメッセージ */}
          {error && (
            <div
              className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* メールアドレス */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              メールアドレス
            </label>
            <Input
              id="email"
              type="email"
              placeholder="example@example.com"
              autoComplete="email"
              disabled={isLoading}
              {...register('email')}
              className={cn(errors.email && 'border-red-500')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* パスワード */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              パスワード
            </label>
            <Input
              id="password"
              type="password"
              placeholder="パスワード"
              autoComplete="current-password"
              disabled={isLoading}
              {...register('password')}
              className={cn(errors.password && 'border-red-500')}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">◌</span>
                ログイン中...
              </>
            ) : (
              'ログイン'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

### ステップ 3: auth コンポーネントインデックス作成

`src/components/auth/index.ts`:

```typescript
export { LoginForm } from './LoginForm';
export type { LoginFormProps } from './LoginForm';
```

### ステップ 4: auth レイアウト作成

`src/app/(auth)/layout.tsx`:

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '認証 | Interactive Video Platform',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      {children}
    </div>
  );
}
```

### ステップ 5: ログインページ作成

`src/app/(auth)/login/page.tsx`:

```typescript
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'ログイン | Interactive Video Platform',
  description: 'アカウントにログインしてください',
};

export default async function LoginPage() {
  // 既にログイン済みの場合はリダイレクト
  const session = await auth();
  if (session) {
    redirect('/');
  }

  return (
    <div className="w-full max-w-md">
      <LoginForm />

      {/* 開発用：テストアカウント情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-sm">
          <p className="font-semibold text-yellow-800 dark:text-yellow-200">
            テストアカウント
          </p>
          <ul className="mt-2 space-y-1 text-yellow-700 dark:text-yellow-300">
            <li>管理者: admin@example.com / password123</li>
            <li>視聴者: viewer@example.com / password123</li>
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## 完了条件

- [x] ログインページ `/login` が表示される
- [x] AC-AUTH-001: メール/パスワードでログインできる
- [x] バリデーションエラーが適切に表示される
- [x] ログイン失敗時にエラーメッセージが表示される
- [x] ログイン成功時にリダイレクトされる

---

## テスト方法

### 1. ページ表示テスト

```bash
npm run dev
# http://localhost:3000/login にアクセス

# 確認項目:
# - ログインフォームが表示される
# - テストアカウント情報が表示される（開発時のみ）
```

### 2. バリデーションテスト

```
1. 空の状態で「ログイン」をクリック
   - エラーメッセージが表示される

2. 無効なメールアドレスを入力
   - 「有効なメールアドレスを入力してください」が表示される

3. 8文字未満のパスワードを入力
   - 「パスワードは8文字以上で入力してください」が表示される
```

### 3. ログインテスト

```
1. 正しい認証情報でログイン
   - admin@example.com / password123
   - ログイン成功後、トップページにリダイレクト

2. 間違った認証情報でログイン
   - 「メールアドレスまたはパスワードが正しくありません」が表示される
```

### 4. セッション確認

```bash
# ログイン後、ブラウザの開発者ツールで確認:
# - Cookie に next-auth.session-token が設定されている
# - Application > Storage > Cookies で確認
```

### 5. リダイレクト確認

```
1. 未認証状態で保護されたページにアクセス
2. ログインページにリダイレクトされる
3. ログイン成功後、元のページに戻る
```

---

## 参照設計書セクション

- DESIGN-FE-2026-001 セクション5.4: 認証画面コンポーネント

---

## 成果物

- `src/app/(auth)/login/page.tsx`: ログインページ
- `src/app/(auth)/layout.tsx`: 認証レイアウト
- `src/components/auth/LoginForm.tsx`: ログインフォームコンポーネント
- `src/components/auth/index.ts`: エクスポート用インデックス

---

## 注意事項

- パスワードは入力フィールドで type="password" を使用
- autoComplete 属性でブラウザの自動入力を有効化
- CSRF 対策は Auth.js が自動で行う

---

## 次のタスク

- phase3-004-middleware.md: Middleware 認証ガード
