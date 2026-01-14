/**
 * @vitest-environment jsdom
 */
/**
 * ProgressCard コンポーネントテスト
 * @description 進捗カードの表示と機能のテスト
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressCard } from './ProgressCard';
import type { UserProgressData } from '@/stores/progressStore';

// モックのuseRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const createMockProgress = (
  overrides: Partial<UserProgressData> = {}
): UserProgressData => ({
  id: 'progress-1',
  userId: 'user-1',
  projectId: 'project-1',
  status: 'in_progress',
  currentNodeId: 'node-1',
  totalWatchTime: 300,
  completionRate: 50,
  startedAt: '2026-01-14T00:00:00Z',
  completedAt: null,
  lastAccessedAt: '2026-01-14T01:00:00Z',
  createdAt: '2026-01-14T00:00:00Z',
  updatedAt: '2026-01-14T01:00:00Z',
  ...overrides,
});

describe('ProgressCard', () => {
  describe('rendering', () => {
    it('should render project title when provided', () => {
      const progress = createMockProgress();
      render(<ProgressCard progress={progress} projectTitle="Test Project" />);

      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('should render projectId when title is not provided', () => {
      const progress = createMockProgress({ projectId: 'my-project-id' });
      render(<ProgressCard progress={progress} />);

      expect(screen.getByText('my-project-id')).toBeInTheDocument();
    });

    it('should render completion rate', () => {
      const progress = createMockProgress({ completionRate: 75 });
      render(<ProgressCard progress={progress} />);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should render progress bar', () => {
      const progress = createMockProgress({ completionRate: 50 });
      render(<ProgressCard progress={progress} />);

      // Progress componentが存在することを確認
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('status display', () => {
    it('should display not_started status', () => {
      const progress = createMockProgress({ status: 'not_started' });
      render(<ProgressCard progress={progress} />);

      expect(screen.getByText(/not started/i)).toBeInTheDocument();
    });

    it('should display in_progress status', () => {
      const progress = createMockProgress({ status: 'in_progress' });
      render(<ProgressCard progress={progress} />);

      expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    });

    it('should display completed status', () => {
      const progress = createMockProgress({ status: 'completed' });
      render(<ProgressCard progress={progress} />);

      expect(screen.getByText(/completed/i)).toBeInTheDocument();
    });
  });

  describe('watch time display', () => {
    it('should format seconds correctly', () => {
      const progress = createMockProgress({ totalWatchTime: 45 });
      render(<ProgressCard progress={progress} />);

      expect(screen.getByText('45s')).toBeInTheDocument();
    });

    it('should format minutes and seconds correctly', () => {
      const progress = createMockProgress({ totalWatchTime: 125 });
      render(<ProgressCard progress={progress} />);

      expect(screen.getByText('2m 5s')).toBeInTheDocument();
    });

    it('should format hours, minutes and seconds correctly', () => {
      const progress = createMockProgress({ totalWatchTime: 3665 });
      render(<ProgressCard progress={progress} />);

      expect(screen.getByText('1h 1m 5s')).toBeInTheDocument();
    });
  });

  describe('last accessed date', () => {
    it('should display formatted last accessed date', () => {
      const progress = createMockProgress({
        lastAccessedAt: '2026-01-14T10:30:00Z',
      });
      render(<ProgressCard progress={progress} />);

      // 日付表示を確認（ロケールによる変動があるため部分一致）
      expect(screen.getByText(/2026/)).toBeInTheDocument();
    });
  });

  describe('action button', () => {
    it('should render continue watching button for in_progress', () => {
      const progress = createMockProgress({ status: 'in_progress' });
      render(<ProgressCard progress={progress} />);

      expect(
        screen.getByRole('link', { name: /continue watching/i })
      ).toBeInTheDocument();
    });

    it('should render watch again button for completed', () => {
      const progress = createMockProgress({ status: 'completed' });
      render(<ProgressCard progress={progress} />);

      expect(
        screen.getByRole('link', { name: /watch again/i })
      ).toBeInTheDocument();
    });

    it('should render start watching button for not_started', () => {
      const progress = createMockProgress({ status: 'not_started' });
      render(<ProgressCard progress={progress} />);

      expect(
        screen.getByRole('link', { name: /start watching/i })
      ).toBeInTheDocument();
    });

    it('should link to watch page with correct projectId', () => {
      const progress = createMockProgress({ projectId: 'test-project' });
      render(<ProgressCard progress={progress} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/watch/test-project');
    });
  });

  describe('styling', () => {
    it('should apply custom className', () => {
      const progress = createMockProgress();
      const { container } = render(
        <ProgressCard progress={progress} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
