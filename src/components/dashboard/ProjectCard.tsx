'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    isPublished: boolean;
    createdAt: Date;
    thumbnailUrl?: string | null;
  };
  index: number;
  baseUrl: string;
}

const gradients = [
  'from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)]',
  'from-[oklch(0.80_0.12_165)] to-[oklch(0.45_0.15_165)]',
  'from-[oklch(0.45_0.15_165)] to-[oklch(0.60_0.13_165)]',
  'from-[oklch(0.60_0.13_165)] to-[oklch(0.80_0.12_165)]',
  'from-[oklch(0.80_0.12_165)] to-[oklch(0.60_0.13_165)]',
];

export function ProjectCard({ project, index, baseUrl }: ProjectCardProps) {
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
    <div className="p-3 sm:p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl sm:rounded-2xl hover:shadow-md transition-all group">
      {/* Mobile Layout */}
      <div className="flex flex-col gap-3 sm:hidden">
        <div className="flex items-center gap-3">
          {project.thumbnailUrl ? (
            <div className="h-10 w-16 rounded-lg overflow-hidden shrink-0">
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className={cn(
                'h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold shadow-lg shrink-0',
                gradients[index % gradients.length]
              )}
            >
              {project.title[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
            <p className="text-xs text-gray-500">
              {new Date(project.createdAt).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'px-2.5 py-1 text-xs font-semibold rounded-lg',
              project.isPublished
                ? 'bg-[oklch(0.90_0.08_165)] text-[oklch(0.35_0.12_165)]'
                : 'bg-gray-100 text-gray-600'
            )}
          >
            {project.isPublished ? '公開中' : '下書き'}
          </span>
          <div className="flex gap-1">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-lg text-xs h-8 px-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>視聴URL・QRコード</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <QRCodeSVG value={watchUrl} size={180} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">視聴URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={watchUrl}
                        className="flex-1 px-3 py-2 text-sm bg-gray-50 border rounded-lg truncate"
                      />
                      <Button size="sm" onClick={handleCopyUrl}>
                        {copied ? 'コピー済' : 'コピー'}
                      </Button>
                    </div>
                  </div>
                  {!project.isPublished && (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      このプロジェクトは非公開です。視聴するには公開設定が必要です。
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button asChild size="sm" variant="outline" className="rounded-lg text-xs h-8 px-3">
              <Link href={`/editor/${project.id}`}>編集</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex items-center gap-4">
          {project.thumbnailUrl ? (
            <div className="h-12 w-20 rounded-xl overflow-hidden shrink-0 transition-transform group-hover:scale-110">
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className={cn(
                'h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform group-hover:scale-110',
                gradients[index % gradients.length]
              )}
            >
              {project.title[0].toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{project.title}</h3>
            <p className="text-sm text-gray-500">
              {new Date(project.createdAt).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-xl',
              project.isPublished
                ? 'bg-[oklch(0.90_0.08_165)] text-[oklch(0.35_0.12_165)]'
                : 'bg-gray-100 text-gray-600'
            )}
          >
            {project.isPublished ? '公開中' : '下書き'}
          </span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl border-2 hover:bg-gray-50 transition-all">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                QR
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
          <Button asChild size="sm" variant="outline" className="rounded-xl border-2 hover:bg-gray-50 transition-all">
            <Link href={`/editor/${project.id}`}>編集</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
