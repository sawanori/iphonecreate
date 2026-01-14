/**
 * video.service.ts のユニットテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// DBモックの型定義
type MockDb = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

// DBをモック
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// スキーマをモック
vi.mock('@/lib/db/schema', () => ({
  videoProjects: { id: 'id', createdBy: 'created_by', createdAt: 'created_at' },
  videoNodes: { id: 'id', projectId: 'project_id' },
  choices: { id: 'id', nodeId: 'node_id' },
  branchConfigs: { id: 'id', nodeId: 'node_id' },
  branchEdges: { id: 'id', projectId: 'project_id' },
}));

describe('video.service', () => {
  let db: MockDb;

  beforeEach(async () => {
    vi.clearAllMocks();
    const dbModule = await import('@/lib/db');
    db = dbModule.db as unknown as MockDb;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getProjects', () => {
    it('should return all projects when no userId provided', async () => {
      const mockProjects = [
        { id: 'project-1', title: 'Project 1' },
        { id: 'project-2', title: 'Project 2' },
      ];

      const mockOrderBy = vi.fn().mockResolvedValue(mockProjects);
      const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      db.select.mockReturnValue({ from: mockFrom });

      const { getProjects } = await import('../video.service');
      const result = await getProjects();

      expect(result).toEqual(mockProjects);
      expect(db.select).toHaveBeenCalled();
    });

    it('should filter by userId when provided', async () => {
      const mockProjects = [{ id: 'project-1', title: 'Project 1' }];

      const mockOrderBy = vi.fn().mockResolvedValue(mockProjects);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      db.select.mockReturnValue({ from: mockFrom });

      const { getProjects } = await import('../video.service');
      const result = await getProjects('user-123');

      expect(result).toEqual(mockProjects);
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('getProject', () => {
    it('should return project when found', async () => {
      const mockProject = { id: 'project-1', title: 'Project 1' };

      const mockLimit = vi.fn().mockResolvedValue([mockProject]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      db.select.mockReturnValue({ from: mockFrom });

      const { getProject } = await import('../video.service');
      const result = await getProject('project-1');

      expect(result).toEqual(mockProject);
    });

    it('should return null when project not found', async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      db.select.mockReturnValue({ from: mockFrom });

      const { getProject } = await import('../video.service');
      const result = await getProject('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createProject', () => {
    it('should create and return new project', async () => {
      const mockProject = {
        id: 'new-project-id',
        title: 'New Project',
        createdBy: 'user-123',
      };

      const mockReturning = vi.fn().mockResolvedValue([mockProject]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      db.insert.mockReturnValue({ values: mockValues });

      const { createProject } = await import('../video.service');
      const result = await createProject({
        title: 'New Project',
        createdBy: 'user-123',
      });

      expect(result).toEqual(mockProject);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should create project with optional description', async () => {
      const mockProject = {
        id: 'new-project-id',
        title: 'New Project',
        description: 'Test description',
        createdBy: 'user-123',
      };

      const mockReturning = vi.fn().mockResolvedValue([mockProject]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      db.insert.mockReturnValue({ values: mockValues });

      const { createProject } = await import('../video.service');
      const result = await createProject({
        title: 'New Project',
        description: 'Test description',
        createdBy: 'user-123',
      });

      expect(result).toEqual(mockProject);
    });
  });

  describe('updateProject', () => {
    it('should update and return project', async () => {
      const mockProject = {
        id: 'project-1',
        title: 'Updated Title',
      };

      const mockReturning = vi.fn().mockResolvedValue([mockProject]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      db.update.mockReturnValue({ set: mockSet });

      const { updateProject } = await import('../video.service');
      const result = await updateProject('project-1', { title: 'Updated Title' });

      expect(result).toEqual(mockProject);
      expect(db.update).toHaveBeenCalled();
    });

    it('should return null when project not found', async () => {
      const mockReturning = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      db.update.mockReturnValue({ set: mockSet });

      const { updateProject } = await import('../video.service');
      const result = await updateProject('non-existent', { title: 'Updated Title' });

      expect(result).toBeNull();
    });
  });

  describe('deleteProject', () => {
    it('should delete project', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      db.delete.mockReturnValue({ where: mockWhere });

      const { deleteProject } = await import('../video.service');
      await deleteProject('project-1');

      expect(db.delete).toHaveBeenCalled();
    });
  });
});
