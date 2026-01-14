import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 権限不足エラーページ
 * 管理者専用ルートにアクセス権限がない場合に表示
 */
export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600">
            アクセス権限がありません
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            このページにアクセスする権限がありません。 管理者権限が必要です。
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link href="/">トップページへ</Link>
            </Button>
            <Button asChild>
              <Link href="/login">ログインページへ</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
