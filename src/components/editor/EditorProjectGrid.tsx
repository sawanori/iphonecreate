'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { EditorProjectCard } from './EditorProjectCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Project {
  id: string;
  title: string;
  isPublished: boolean;
  createdAt: Date;
  thumbnailUrl?: string | null;
}

interface EditorProjectGridProps {
  projects: Project[];
}

export function EditorProjectGrid({ projects: initialProjects }: EditorProjectGridProps) {
  const [baseUrl, setBaseUrl] = useState('');
  const [projects, setProjects] = useState(initialProjects);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  // プロジェクト削除時のハンドラー
  const handleDelete = useCallback((projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }, []);

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-gray-500 mb-4">
            プロジェクトがありません。最初のプロジェクトを作成してください。
          </p>
          <Button asChild>
            <Link href="/editor/new">プロジェクト作成</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <EditorProjectCard
          key={project.id}
          project={project}
          baseUrl={baseUrl}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
