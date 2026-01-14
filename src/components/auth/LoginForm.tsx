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
    } catch {
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
                <span className="animate-spin mr-2">&#9676;</span>
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
