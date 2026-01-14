'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProjectCard } from './ProjectCard';
import { Button } from '@/components/ui/button';

interface Project {
  id: string;
  title: string;
  isPublished: boolean;
  createdAt: Date;
}

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    // Get the base URL from the browser
    setBaseUrl(window.location.origin);
  }, []);

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="mx-auto mb-4 h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-gray-100 flex items-center justify-center">
          <svg className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">プロジェクトがありません</p>
        <p className="text-gray-400 text-sm mt-1">最初のプロジェクトを作成しましょう</p>
        <Button
          asChild
          className="mt-4 bg-gradient-to-r from-[oklch(0.45_0.15_165)] to-[oklch(0.80_0.12_165)] hover:opacity-90 text-white rounded-xl font-semibold shadow-lg transition-all hover:scale-105"
        >
          <Link href="/editor/new">プロジェクトを作成</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {projects.slice(0, 5).map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          index={index}
          baseUrl={baseUrl}
        />
      ))}
    </div>
  );
}
