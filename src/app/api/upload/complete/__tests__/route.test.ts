import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// モック
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/storage', () => ({
  fileExists: vi.fn(),
  getPublicUrl: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { fileExists, getPublicUrl } from '@/lib/storage';

describe('POST /api/upload/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: object) => {
    return new NextRequest('http://localhost:3000/api/upload/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as unknown as ReturnType<typeof auth>);

    const request = createRequest({
      fileKey: 'videos/test-project/12345-test.mp4',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 403 when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '1', email: 'user@example.com', role: 'viewer' },
    } as unknown as ReturnType<typeof auth>);

    const request = createRequest({
      fileKey: 'videos/test-project/12345-test.mp4',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('should return 400 when fileKey is missing', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '1', email: 'admin@example.com', role: 'admin' },
    } as unknown as ReturnType<typeof auth>);

    const request = createRequest({});

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 when file does not exist', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '1', email: 'admin@example.com', role: 'admin' },
    } as unknown as ReturnType<typeof auth>);

    vi.mocked(fileExists).mockResolvedValue(false);

    const request = createRequest({
      fileKey: 'videos/test-project/non-existent.mp4',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('should return video URL for valid request', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '1', email: 'admin@example.com', role: 'admin' },
    } as unknown as ReturnType<typeof auth>);

    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(getPublicUrl).mockReturnValue('https://cdn.example.com/videos/test-project/12345-test.mp4');

    const request = createRequest({
      fileKey: 'videos/test-project/12345-test.mp4',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.videoUrl).toBe('https://cdn.example.com/videos/test-project/12345-test.mp4');
    expect(json.data.thumbnailUrl).toBe(null);
    expect(json.data.metadata).toEqual({
      duration: 0,
      width: 0,
      height: 0,
    });
  });
});
