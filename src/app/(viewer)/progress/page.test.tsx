/**
 * @vitest-environment jsdom
 */
/**
 * Progress Page テスト
 * @description 進捗表示ページの単体テスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressPage from './page';
import { useProgressStore } from '@/stores/progressStore';
import type { UserProgressData, ProgressSummaryData } from '@/stores/progressStore';

// Mock useProgressStore
vi.mock('@/stores/progressStore', () => ({
  useProgressStore: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockUseProgressStore = vi.mocked(useProgressStore);

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

const createMockSummary = (
  overrides: Partial<ProgressSummaryData> = {}
): ProgressSummaryData => ({
  totalProjects: 10,
  completedProjects: 5,
  inProgressProjects: 3,
  totalWatchTime: 3600,
  ...overrides,
});

describe('ProgressPage', () => {
  const mockFetchProgressList = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should display loading spinner when isLoading is true', () => {
      mockUseProgressStore.mockReturnValue({
        progressList: [],
        summary: null,
        isLoading: true,
        error: null,
        fetchProgressList: mockFetchProgressList,
      } as unknown as ReturnType<typeof useProgressStore>);

      const { container } = render(<ProgressPage />);

      // ローディングスピナーが表示されることを確認
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display error message when error exists', () => {
      mockUseProgressStore.mockReturnValue({
        progressList: [],
        summary: null,
        isLoading: false,
        error: 'Test error message',
        fetchProgressList: mockFetchProgressList,
      } as unknown as ReturnType<typeof useProgressStore>);

      render(<ProgressPage />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should display empty message when no progress exists', () => {
      mockUseProgressStore.mockReturnValue({
        progressList: [],
        summary: null,
        isLoading: false,
        error: null,
        fetchProgressList: mockFetchProgressList,
      } as unknown as ReturnType<typeof useProgressStore>);

      render(<ProgressPage />);

      expect(screen.getByText(/no viewing history/i)).toBeInTheDocument();
    });
  });

  describe('summary display', () => {
    it('should display summary cards when summary exists', () => {
      const mockSummary = createMockSummary({
        totalProjects: 10,
        completedProjects: 5,
        inProgressProjects: 3,
        totalWatchTime: 3600,
      });

      mockUseProgressStore.mockReturnValue({
        progressList: [],
        summary: mockSummary,
        isLoading: false,
        error: null,
        fetchProgressList: mockFetchProgressList,
      } as unknown as ReturnType<typeof useProgressStore>);

      render(<ProgressPage />);

      // 総コンテンツ数
      expect(screen.getByText('10')).toBeInTheDocument();
      // 完了
      expect(screen.getByText('5')).toBeInTheDocument();
      // 進行中
      expect(screen.getByText('3')).toBeInTheDocument();
      // 総視聴時間（60分）
      expect(screen.getByText('60m')).toBeInTheDocument();
    });

    it('should display summary labels', () => {
      const mockSummary = createMockSummary();

      mockUseProgressStore.mockReturnValue({
        progressList: [],
        summary: mockSummary,
        isLoading: false,
        error: null,
        fetchProgressList: mockFetchProgressList,
      } as unknown as ReturnType<typeof useProgressStore>);

      render(<ProgressPage />);

      expect(screen.getByText('Total Contents')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Total Watch Time')).toBeInTheDocument();
    });
  });

  describe('progress list display', () => {
    it('should display progress cards', () => {
      const mockProgressList = [
        createMockProgress({ id: 'p1', projectId: 'Project 1' }),
        createMockProgress({ id: 'p2', projectId: 'Project 2', status: 'completed' }),
      ];

      mockUseProgressStore.mockReturnValue({
        progressList: mockProgressList,
        summary: createMockSummary(),
        isLoading: false,
        error: null,
        fetchProgressList: mockFetchProgressList,
      } as unknown as ReturnType<typeof useProgressStore>);

      render(<ProgressPage />);

      expect(screen.getByText('Project 1')).toBeInTheDocument();
      expect(screen.getByText('Project 2')).toBeInTheDocument();
    });

    it('should display different statuses', () => {
      const mockProgressList = [
        createMockProgress({ id: 'p1', status: 'not_started' }),
        createMockProgress({ id: 'p2', status: 'in_progress' }),
        createMockProgress({ id: 'p3', status: 'completed' }),
      ];

      mockUseProgressStore.mockReturnValue({
        progressList: mockProgressList,
        summary: createMockSummary(),
        isLoading: false,
        error: null,
        fetchProgressList: mockFetchProgressList,
      } as unknown as ReturnType<typeof useProgressStore>);

      render(<ProgressPage />);

      // Use getAllByText for statuses that may appear multiple times
      // "In Progress" appears in both summary card title and status badge
      expect(screen.getByText('Not Started')).toBeInTheDocument();
      expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('data fetching', () => {
    it('should call fetchProgressList on mount', () => {
      mockUseProgressStore.mockReturnValue({
        progressList: [],
        summary: null,
        isLoading: false,
        error: null,
        fetchProgressList: mockFetchProgressList,
      } as unknown as ReturnType<typeof useProgressStore>);

      render(<ProgressPage />);

      expect(mockFetchProgressList).toHaveBeenCalled();
    });
  });

  describe('page title', () => {
    it('should display page title', () => {
      mockUseProgressStore.mockReturnValue({
        progressList: [],
        summary: null,
        isLoading: false,
        error: null,
        fetchProgressList: mockFetchProgressList,
      } as unknown as ReturnType<typeof useProgressStore>);

      render(<ProgressPage />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Learning Progress'
      );
    });
  });
});
