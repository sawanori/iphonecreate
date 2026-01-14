/**
 * branch.service.ts のユニットテスト
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
  videoNodes: { id: 'id', projectId: 'project_id' },
  choices: { id: 'id', nodeId: 'node_id' },
  branchConfigs: { id: 'id', nodeId: 'node_id' },
  branchEdges: { id: 'id', projectId: 'project_id' },
}));

describe('branch.service', () => {
  let db: MockDb;

  beforeEach(async () => {
    vi.clearAllMocks();
    const dbModule = await import('@/lib/db');
    db = dbModule.db as unknown as MockDb;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createNode', () => {
    it('should create and return new node', async () => {
      const mockNode = {
        id: 'node-1',
        projectId: 'project-1',
        type: 'video',
        title: 'Test Node',
        positionX: 100,
        positionY: 200,
      };

      const mockReturning = vi.fn().mockResolvedValue([mockNode]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      db.insert.mockReturnValue({ values: mockValues });

      const { createNode } = await import('../branch.service');
      const result = await createNode({
        projectId: 'project-1',
        type: 'video',
        title: 'Test Node',
        positionX: 100,
        positionY: 200,
      });

      expect(result).toEqual(mockNode);
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('getNode', () => {
    it('should return node when found', async () => {
      const mockNode = { id: 'node-1', title: 'Test Node' };

      const mockLimit = vi.fn().mockResolvedValue([mockNode]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      db.select.mockReturnValue({ from: mockFrom });

      const { getNode } = await import('../branch.service');
      const result = await getNode('node-1');

      expect(result).toEqual(mockNode);
    });

    it('should return null when node not found', async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      db.select.mockReturnValue({ from: mockFrom });

      const { getNode } = await import('../branch.service');
      const result = await getNode('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateNode', () => {
    it('should update and return node', async () => {
      const mockNode = { id: 'node-1', title: 'Updated Node' };

      const mockReturning = vi.fn().mockResolvedValue([mockNode]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      db.update.mockReturnValue({ set: mockSet });

      const { updateNode } = await import('../branch.service');
      const result = await updateNode('node-1', { title: 'Updated Node' });

      expect(result).toEqual(mockNode);
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('deleteNode', () => {
    it('should delete node', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      db.delete.mockReturnValue({ where: mockWhere });

      const { deleteNode } = await import('../branch.service');
      await deleteNode('node-1');

      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe('saveChoices', () => {
    it('should delete existing choices and insert new ones', async () => {
      const mockChoices = [
        { id: 'choice-1', nodeId: 'node-1', text: 'Choice A', order: 0 },
        { id: 'choice-2', nodeId: 'node-1', text: 'Choice B', order: 1 },
      ];

      // Mock delete
      const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
      db.delete.mockReturnValue({ where: mockDeleteWhere });

      // Mock insert
      const mockReturning = vi.fn().mockResolvedValue(mockChoices);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      db.insert.mockReturnValue({ values: mockValues });

      const { saveChoices } = await import('../branch.service');
      const result = await saveChoices('node-1', [
        { text: 'Choice A', order: 0 },
        { text: 'Choice B', order: 1 },
      ]);

      expect(result).toEqual(mockChoices);
      expect(db.delete).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
    });

    it('should return empty array when no choices provided', async () => {
      const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
      db.delete.mockReturnValue({ where: mockDeleteWhere });

      const { saveChoices } = await import('../branch.service');
      const result = await saveChoices('node-1', []);

      expect(result).toEqual([]);
      expect(db.delete).toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('saveBranchConfig', () => {
    it('should create new config when not exists', async () => {
      const mockConfig = {
        id: 'config-1',
        nodeId: 'node-1',
        timeLimit: 15,
      };

      // Mock select (no existing config)
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      db.select.mockReturnValue({ from: mockFrom });

      // Mock insert
      const mockReturning = vi.fn().mockResolvedValue([mockConfig]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      db.insert.mockReturnValue({ values: mockValues });

      const { saveBranchConfig } = await import('../branch.service');
      const result = await saveBranchConfig('node-1', { timeLimit: 15 });

      expect(result).toEqual(mockConfig);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should update existing config', async () => {
      const existingConfig = {
        id: 'config-1',
        nodeId: 'node-1',
        timeLimit: 10,
      };
      const updatedConfig = {
        id: 'config-1',
        nodeId: 'node-1',
        timeLimit: 20,
      };

      // Mock select (existing config)
      const mockLimit = vi.fn().mockResolvedValue([existingConfig]);
      const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
      db.select.mockReturnValue({ from: mockFrom });

      // Mock update
      const mockReturning = vi.fn().mockResolvedValue([updatedConfig]);
      const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      db.update.mockReturnValue({ set: mockSet });

      const { saveBranchConfig } = await import('../branch.service');
      const result = await saveBranchConfig('node-1', { timeLimit: 20 });

      expect(result).toEqual(updatedConfig);
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('saveEdges', () => {
    it('should delete existing edges and insert new ones', async () => {
      const mockEdges = [
        {
          id: 'edge-1',
          projectId: 'project-1',
          sourceNodeId: 'node-1',
          targetNodeId: 'node-2',
        },
      ];

      // Mock delete
      const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
      db.delete.mockReturnValue({ where: mockDeleteWhere });

      // Mock insert
      const mockReturning = vi.fn().mockResolvedValue(mockEdges);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      db.insert.mockReturnValue({ values: mockValues });

      const { saveEdges } = await import('../branch.service');
      const result = await saveEdges('project-1', [
        { sourceNodeId: 'node-1', targetNodeId: 'node-2' },
      ]);

      expect(result).toEqual(mockEdges);
      expect(db.delete).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
    });

    it('should return empty array when no edges provided', async () => {
      const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
      db.delete.mockReturnValue({ where: mockDeleteWhere });

      const { saveEdges } = await import('../branch.service');
      const result = await saveEdges('project-1', []);

      expect(result).toEqual([]);
      expect(db.delete).toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('getEdges', () => {
    it('should return edges for project', async () => {
      const mockEdges = [
        { id: 'edge-1', projectId: 'project-1' },
        { id: 'edge-2', projectId: 'project-1' },
      ];

      const mockWhere = vi.fn().mockResolvedValue(mockEdges);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      db.select.mockReturnValue({ from: mockFrom });

      const { getEdges } = await import('../branch.service');
      const result = await getEdges('project-1');

      expect(result).toEqual(mockEdges);
    });
  });
});
