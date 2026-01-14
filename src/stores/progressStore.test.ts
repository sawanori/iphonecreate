/**
 * progressStore テスト
 * @description 進捗ストアの単体テスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProgressStore } from './progressStore';

// モックfetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('progressStore', () => {
  beforeEach(() => {
    // ストアをリセット
    useProgressStore.getState().reset();
    mockFetch.mockClear();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useProgressStore.getState();

      expect(state.progressList).toEqual([]);
      expect(state.summary).toBeNull();
      expect(state.selectedProgress).toBeNull();
      expect(state.choiceHistory).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setProgressList', () => {
    it('should update progressList', () => {
      const mockProgress = [
        {
          id: 'p1',
          userId: 'u1',
          projectId: 'proj1',
          status: 'in_progress' as const,
          currentNodeId: 'node1',
          totalWatchTime: 300,
          completionRate: 50,
          startedAt: '2026-01-14T00:00:00Z',
          completedAt: null,
          lastAccessedAt: '2026-01-14T01:00:00Z',
          createdAt: '2026-01-14T00:00:00Z',
          updatedAt: '2026-01-14T01:00:00Z',
        },
      ];

      useProgressStore.getState().setProgressList(mockProgress);

      expect(useProgressStore.getState().progressList).toEqual(mockProgress);
    });
  });

  describe('setSummary', () => {
    it('should update summary', () => {
      const mockSummary = {
        totalProjects: 10,
        completedProjects: 5,
        inProgressProjects: 3,
        totalWatchTime: 3600,
      };

      useProgressStore.getState().setSummary(mockSummary);

      expect(useProgressStore.getState().summary).toEqual(mockSummary);
    });
  });

  describe('setSelectedProgress', () => {
    it('should update selectedProgress', () => {
      const mockProgress = {
        id: 'p1',
        userId: 'u1',
        projectId: 'proj1',
        status: 'completed' as const,
        currentNodeId: null,
        totalWatchTime: 600,
        completionRate: 100,
        startedAt: '2026-01-14T00:00:00Z',
        completedAt: '2026-01-14T02:00:00Z',
        lastAccessedAt: '2026-01-14T02:00:00Z',
        createdAt: '2026-01-14T00:00:00Z',
        updatedAt: '2026-01-14T02:00:00Z',
      };

      useProgressStore.getState().setSelectedProgress(mockProgress);

      expect(useProgressStore.getState().selectedProgress).toEqual(mockProgress);
    });

    it('should clear selectedProgress when set to null', () => {
      const mockProgress = {
        id: 'p1',
        userId: 'u1',
        projectId: 'proj1',
        status: 'completed' as const,
        currentNodeId: null,
        totalWatchTime: 600,
        completionRate: 100,
        startedAt: '2026-01-14T00:00:00Z',
        completedAt: '2026-01-14T02:00:00Z',
        lastAccessedAt: '2026-01-14T02:00:00Z',
        createdAt: '2026-01-14T00:00:00Z',
        updatedAt: '2026-01-14T02:00:00Z',
      };

      useProgressStore.getState().setSelectedProgress(mockProgress);
      useProgressStore.getState().setSelectedProgress(null);

      expect(useProgressStore.getState().selectedProgress).toBeNull();
    });
  });

  describe('setChoiceHistory', () => {
    it('should update choiceHistory', () => {
      const mockHistory = [
        {
          id: 'ch1',
          progressId: 'p1',
          nodeId: 'node1',
          choiceId: 'choice1',
          responseTime: 5,
          isTimeout: false,
          selectedAt: '2026-01-14T00:01:00Z',
        },
      ];

      useProgressStore.getState().setChoiceHistory(mockHistory);

      expect(useProgressStore.getState().choiceHistory).toEqual(mockHistory);
    });
  });

  describe('setIsLoading', () => {
    it('should update isLoading', () => {
      useProgressStore.getState().setIsLoading(true);
      expect(useProgressStore.getState().isLoading).toBe(true);

      useProgressStore.getState().setIsLoading(false);
      expect(useProgressStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should update error', () => {
      useProgressStore.getState().setError('Test error');
      expect(useProgressStore.getState().error).toBe('Test error');

      useProgressStore.getState().setError(null);
      expect(useProgressStore.getState().error).toBeNull();
    });
  });

  describe('fetchProgressList', () => {
    it('should fetch progress list successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          progress: [
            {
              id: 'p1',
              userId: 'u1',
              projectId: 'proj1',
              status: 'in_progress',
              currentNodeId: 'node1',
              totalWatchTime: 300,
              completionRate: 50,
              startedAt: '2026-01-14T00:00:00Z',
              completedAt: null,
              lastAccessedAt: '2026-01-14T01:00:00Z',
              createdAt: '2026-01-14T00:00:00Z',
              updatedAt: '2026-01-14T01:00:00Z',
            },
          ],
          summary: {
            totalProjects: 10,
            completedProjects: 5,
            inProgressProjects: 3,
            totalWatchTime: 3600,
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      await useProgressStore.getState().fetchProgressList();

      expect(mockFetch).toHaveBeenCalledWith('/api/progress?summary=true');
      expect(useProgressStore.getState().progressList).toEqual(
        mockResponse.data.progress
      );
      expect(useProgressStore.getState().summary).toEqual(
        mockResponse.data.summary
      );
      expect(useProgressStore.getState().isLoading).toBe(false);
      expect(useProgressStore.getState().error).toBeNull();
    });

    it('should handle API error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: { message: 'API Error' },
          }),
      });

      await useProgressStore.getState().fetchProgressList();

      expect(useProgressStore.getState().error).toBe('API Error');
      expect(useProgressStore.getState().isLoading).toBe(false);
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await useProgressStore.getState().fetchProgressList();

      expect(useProgressStore.getState().error).toBe('Network error');
      expect(useProgressStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchProgressDetail', () => {
    it('should fetch progress detail successfully', async () => {
      const mockProgressResponse = {
        success: true,
        data: {
          progress: {
            id: 'p1',
            userId: 'u1',
            projectId: 'proj1',
            status: 'in_progress',
            currentNodeId: 'node1',
            totalWatchTime: 300,
            completionRate: 50,
            startedAt: '2026-01-14T00:00:00Z',
            completedAt: null,
            lastAccessedAt: '2026-01-14T01:00:00Z',
            createdAt: '2026-01-14T00:00:00Z',
            updatedAt: '2026-01-14T01:00:00Z',
          },
        },
      };

      const mockHistoryResponse = {
        success: true,
        data: {
          history: [
            {
              id: 'ch1',
              progressId: 'p1',
              nodeId: 'node1',
              choiceId: 'choice1',
              responseTime: 5,
              isTimeout: false,
              selectedAt: '2026-01-14T00:01:00Z',
            },
          ],
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockProgressResponse),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockHistoryResponse),
        });

      await useProgressStore.getState().fetchProgressDetail('proj1');

      expect(mockFetch).toHaveBeenCalledWith('/api/progress/proj1');
      expect(mockFetch).toHaveBeenCalledWith('/api/progress/proj1/choice');
      expect(useProgressStore.getState().selectedProgress).toEqual(
        mockProgressResponse.data.progress
      );
      expect(useProgressStore.getState().choiceHistory).toEqual(
        mockHistoryResponse.data.history
      );
      expect(useProgressStore.getState().isLoading).toBe(false);
    });

    it('should handle API error in progress detail fetch', async () => {
      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ success: false }),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ success: true, data: { history: [] } }),
        });

      await useProgressStore.getState().fetchProgressDetail('proj1');

      expect(useProgressStore.getState().error).toBe('Detail fetch failed');
      expect(useProgressStore.getState().isLoading).toBe(false);
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await useProgressStore.getState().fetchProgressDetail('proj1');

      expect(useProgressStore.getState().error).toBe('Network error');
      expect(useProgressStore.getState().isLoading).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      // Set some state
      useProgressStore.getState().setIsLoading(true);
      useProgressStore.getState().setError('Some error');
      useProgressStore.getState().setProgressList([
        {
          id: 'p1',
          userId: 'u1',
          projectId: 'proj1',
          status: 'completed',
          currentNodeId: null,
          totalWatchTime: 600,
          completionRate: 100,
          startedAt: '2026-01-14T00:00:00Z',
          completedAt: '2026-01-14T02:00:00Z',
          lastAccessedAt: '2026-01-14T02:00:00Z',
          createdAt: '2026-01-14T00:00:00Z',
          updatedAt: '2026-01-14T02:00:00Z',
        },
      ]);

      // Reset
      useProgressStore.getState().reset();

      // Verify initial state
      const state = useProgressStore.getState();
      expect(state.progressList).toEqual([]);
      expect(state.summary).toBeNull();
      expect(state.selectedProgress).toBeNull();
      expect(state.choiceHistory).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
