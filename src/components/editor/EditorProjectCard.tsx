'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface EditorProjectCardProps {
  project: {
    id: string;
    title: string;
    isPublished: boolean;
    createdAt: Date;
    thumbnailUrl?: string | null;
  };
  baseUrl: string;
}

export function EditorProjectCard({ project, baseUrl }: EditorProjectCardProps) {
  const [copied, setCopied] = useState(false);
  const watchUrl = `${baseUrl}/watch/${project.id}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(watchUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg truncate">{project.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
          {project.thumbnailUrl ? (
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-gray-400">サムネイルなし</span>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <span
            className={cn(
              'px-2 py-1 text-xs rounded',
              project.isPublished
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            )}
          >
            {project.isPublished ? '公開中' : '下書き'}
          </span>
          <span className="text-sm text-gray-500">
            {new Date(project.createdAt).toLocaleDateString('ja-JP')}
          </span>
        </div>

        <div className="flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/editor/${project.id}`}>編集</Link>
          </Button>

          {/* QRコードダイアログ */}
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{project.title} - 視聴URL・QRコード</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-center p-6 bg-white rounded-xl border">
                  <QRCodeSVG value={watchUrl} size={200} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">視聴URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={watchUrl}
                      className="flex-1 px-3 py-2 text-sm bg-gray-50 border rounded-lg"
                    />
                    <Button onClick={handleCopyUrl}>
                      {copied ? 'コピー済!' : 'コピー'}
                    </Button>
                  </div>
                </div>
                {!project.isPublished && (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    このプロジェクトは非公開です。視聴するには公開設定が必要です。
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {project.isPublished && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/watch/${project.id}`} target="_blank">
                プレビュー
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
