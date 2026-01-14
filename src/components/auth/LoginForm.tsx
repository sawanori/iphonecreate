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
 * Login form schema
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Please enter your email address')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Please enter your password')
    .min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * LoginForm component Props
 */
export interface LoginFormProps {
  /** Additional class name */
  className?: string;
}

/**
 * Login form component with pop design
 */
export function LoginForm({ className }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

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
        setError('Invalid email or password');
        return;
      }

      // Login successful
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn(
      'w-full max-w-md border-0 bg-white rounded-3xl overflow-hidden',
      className
    )}
    style={{
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    }}
    >
      {/* Decorative header gradient */}
      <div className="h-2 w-full bg-gradient-to-r from-[oklch(0.75_0.18_25)] via-[oklch(0.65_0.22_295)] to-[oklch(0.78_0.16_195)]" />

      <CardHeader className="space-y-2 pt-8 pb-4">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] shadow-lg shadow-[oklch(0.75_0.18_25)]/30">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <CardTitle className="text-2xl font-bold text-center text-gray-900">
          Welcome Back!
        </CardTitle>
        <CardDescription className="text-center text-gray-500">
          Sign in to continue to your dashboard
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5 px-8">
          {/* Error message */}
          {error && (
            <div
              className="p-4 text-sm text-[oklch(0.60_0.22_25)] bg-[oklch(0.95_0.05_25)] border-2 border-[oklch(0.85_0.10_25)] rounded-2xl flex items-center gap-3"
              role="alert"
            >
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          {/* Email input */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-semibold text-gray-700"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isLoading}
                {...register('email')}
                className={cn(
                  'h-14 pl-12 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[oklch(0.75_0.18_25)] focus:bg-white focus:ring-4 focus:ring-[oklch(0.75_0.18_25)]/10 transition-all',
                  errors.email && 'border-[oklch(0.60_0.22_25)] focus:border-[oklch(0.60_0.22_25)] focus:ring-[oklch(0.60_0.22_25)]/10'
                )}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-[oklch(0.60_0.22_25)] flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password input */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isLoading}
                {...register('password')}
                className={cn(
                  'h-14 pl-12 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[oklch(0.75_0.18_25)] focus:bg-white focus:ring-4 focus:ring-[oklch(0.75_0.18_25)]/10 transition-all',
                  errors.password && 'border-[oklch(0.60_0.22_25)] focus:border-[oklch(0.60_0.22_25)] focus:ring-[oklch(0.60_0.22_25)]/10'
                )}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-[oklch(0.60_0.22_25)] flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 px-8 pb-8 pt-4">
          <Button
            type="submit"
            className="w-full h-14 bg-gradient-to-r from-[oklch(0.75_0.18_25)] to-[oklch(0.65_0.22_295)] hover:opacity-90 text-white text-lg font-semibold rounded-2xl shadow-lg shadow-[oklch(0.75_0.18_25)]/30 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Sign In
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            )}
          </Button>

          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <a href="#" className="font-semibold text-[oklch(0.65_0.22_295)] hover:text-[oklch(0.75_0.18_25)] transition-colors">
              Sign up for free
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
