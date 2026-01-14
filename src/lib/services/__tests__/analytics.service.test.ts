/**
 * analytics.service.ts のユニットテスト
 * 対応設計書: DESIGN-BE-2026-001 セクション5.6
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// DBモックの型定義
type MockDb = {
  select: ReturnType<typeof vi.fn>;
};

// DBをモック
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

// スキーマをモック
vi.mock('@/lib/db/schema', () => ({
  userProgress: {
    id: 'id',
    userId: 'user_id',
    projectId: 'project_id',
    status: 'status',
    totalWatchTime: 'total_watch_time',
    completionRate: 'completion_rate',
  },
  choiceHistory: {
    id: 'id',
    progressId: 'progress_id',
    nodeId: 'node_id',
    choiceId: 'choice_id',
    responseTime: 'response_time',
    isTimeout: 'is_timeout',
  },
  videoProjects: { id: 'id' },
  videoNodes: { id: 'id', projectId: 'project_id', title: 'title' },
  choices: { id: 'id', nodeId: 'node_id', text: 'text' },
}));

describe('analytics.service', () => {
  let db: MockDb;

  beforeEach(async () => {
    vi.clearAllMocks();
    const dbModule = await import('@/lib/db');
    db = dbModule.db as unknown as MockDb;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getOverallAnalytics', () => {
    it('should return overall analytics with completion rate', async () => {
      // AC-ANALYTICS-001: 管理者は全体の完了率を取得できる
      const mockProgressStats = [
        {
          total: 100,
          completed: 75,
          inProgress: 20,
          totalWatchTime: 36000,
        },
      ];

      const mockProjectStats = [
        {
          projectId: 'project-1',
          totalViews: 50,
          completed: 40,
          avgWatchTime: 300,
        },
        {
          projectId: 'project-2',
          totalViews: 50,
          completed: 35,
          avgWatchTime: 250,
        },
      ];

      // First call - progress stats
      const mockFrom1 = vi.fn().mockResolvedValue(mockProgressStats);
      // Second call - project stats
      const mockGroupBy = vi.fn().mockResolvedValue(mockProjectStats);
      const mockFrom2 = vi.fn().mockReturnValue({ groupBy: mockGroupBy });

      db.select
        .mockReturnValueOnce({ from: mockFrom1 })
        .mockReturnValueOnce({ from: mockFrom2 });

      const { getOverallAnalytics } = await import('../analytics.service');
      const result = await getOverallAnalytics();

      expect(result).toMatchObject({
        totalViews: 100,
        completedViews: 75,
        inProgressViews: 20,
        overallCompletionRate: 75,
        totalWatchTime: 36000,
      });
      expect(result.projectStats).toHaveLength(2);
    });

    it('should return zero completion rate when no views', async () => {
      const mockProgressStats = [
        {
          total: 0,
          completed: 0,
          inProgress: 0,
          totalWatchTime: 0,
        },
      ];

      const mockProjectStats: unknown[] = [];

      const mockFrom1 = vi.fn().mockResolvedValue(mockProgressStats);
      const mockGroupBy = vi.fn().mockResolvedValue(mockProjectStats);
      const mockFrom2 = vi.fn().mockReturnValue({ groupBy: mockGroupBy });

      db.select
        .mockReturnValueOnce({ from: mockFrom1 })
        .mockReturnValueOnce({ from: mockFrom2 });

      const { getOverallAnalytics } = await import('../analytics.service');
      const result = await getOverallAnalytics();

      expect(result.overallCompletionRate).toBe(0);
      expect(result.totalViews).toBe(0);
    });
  });

  describe('getProjectAnalytics', () => {
    it('should return project-specific analytics with choice trends', async () => {
      // AC-ANALYTICS-002: 動画別の選択傾向データを取得できる
      const mockBasicStats = [
        {
          totalViews: 50,
          completed: 40,
          avgWatchTime: 300,
          avgCompletionRate: 80,
        },
      ];

      const mockNodes = [
        { id: 'node-1', projectId: 'project-1', title: 'Node 1' },
        { id: 'node-2', projectId: 'project-1', title: 'Node 2' },
      ];

      const mockChoices = [
        { id: 'choice-1', nodeId: 'node-1', text: 'Choice A' },
        { id: 'choice-2', nodeId: 'node-1', text: 'Choice B' },
      ];

      const mockChoiceStats = [
        { selectCount: 30, avgResponseTime: 5.5, timeoutCount: 2 },
      ];

      // Setup mock chain for basic stats
      const mockWhere1 = vi.fn().mockResolvedValue(mockBasicStats);
      const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 });

      // Setup mock chain for nodes
      const mockWhere2 = vi.fn().mockResolvedValue(mockNodes);
      const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });

      // Setup mock chain for choices (called multiple times)
      const mockWhere3 = vi.fn().mockResolvedValue(mockChoices);
      const mockFrom3 = vi.fn().mockReturnValue({ where: mockWhere3 });

      // Setup mock chain for choice stats (called multiple times)
      const mockWhere4 = vi.fn().mockResolvedValue(mockChoiceStats);
      const mockFrom4 = vi.fn().mockReturnValue({ where: mockWhere4 });

      db.select
        .mockReturnValueOnce({ from: mockFrom1 }) // basic stats
        .mockReturnValueOnce({ from: mockFrom2 }) // nodes
        .mockReturnValueOnce({ from: mockFrom3 }) // choices for node-1
        .mockReturnValueOnce({ from: mockFrom4 }) // choice stats for choice-1
        .mockReturnValueOnce({ from: mockFrom4 }) // choice stats for choice-2
        .mockReturnValueOnce({ from: mockFrom3 }) // choices for node-2
        .mockReturnValueOnce({ from: mockFrom4 }) // choice stats
        .mockReturnValueOnce({ from: mockFrom4 }); // choice stats

      const { getProjectAnalytics } = await import('../analytics.service');
      const result = await getProjectAnalytics('project-1');

      expect(result).toMatchObject({
        projectId: 'project-1',
        totalViews: 50,
        completionRate: 80,
      });
    });

    it('should return zero completion rate when no views', async () => {
      const mockBasicStats = [
        {
          totalViews: 0,
          completed: 0,
          avgWatchTime: 0,
          avgCompletionRate: 0,
        },
      ];

      const mockNodes: unknown[] = [];

      const mockWhere1 = vi.fn().mockResolvedValue(mockBasicStats);
      const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 });

      const mockWhere2 = vi.fn().mockResolvedValue(mockNodes);
      const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });

      db.select
        .mockReturnValueOnce({ from: mockFrom1 })
        .mockReturnValueOnce({ from: mockFrom2 });

      const { getProjectAnalytics } = await import('../analytics.service');
      const result = await getProjectAnalytics('project-1');

      expect(result.completionRate).toBe(0);
      expect(result.totalViews).toBe(0);
      expect(result.nodeAnalytics).toEqual([]);
    });
  });

  describe('getChoiceTrends', () => {
    it('should return choice trends with timeout rate', async () => {
      const mockTrends = [
        {
          choiceId: 'choice-1',
          nodeId: 'node-1',
          selectCount: 100,
          avgResponseTime: 5.2,
          timeoutRate: 10,
        },
        {
          choiceId: 'choice-2',
          nodeId: 'node-1',
          selectCount: 80,
          avgResponseTime: 4.8,
          timeoutRate: 5,
        },
      ];

      const mockGroupBy = vi.fn().mockResolvedValue(mockTrends);
      const mockWhere = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
      const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });
      db.select.mockReturnValue({ from: mockFrom });

      const { getChoiceTrends } = await import('../analytics.service');
      const result = await getChoiceTrends('project-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        choiceId: 'choice-1',
        nodeId: 'node-1',
        selectCount: 100,
      });
    });
  });
});
