import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// モック
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/storage', () => ({
  generateUploadUrl: vi.fn(),
  generateVideoKey: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { generateUploadUrl, generateVideoKey } from '@/lib/storage';

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: object) => {
    return new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as unknown as ReturnType<typeof auth>);

    const request = createRequest({
      filename: 'test.mp4',
      contentType: 'video/mp4',
      size: 1024,
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
      filename: 'test.mp4',
      contentType: 'video/mp4',
      size: 1024,
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('should return 400 when filename is missing', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '1', email: 'admin@example.com', role: 'admin' },
    } as unknown as ReturnType<typeof auth>);

    const request = createRequest({
      contentType: 'video/mp4',
      size: 1024,
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when contentType is not video/mp4', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '1', email: 'admin@example.com', role: 'admin' },
    } as unknown as ReturnType<typeof auth>);

    const request = createRequest({
      filename: 'test.avi',
      contentType: 'video/avi',
      size: 1024,
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.message).toContain('MP4形式のみ');
  });

  it('should return 400 when file size exceeds 500MB', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '1', email: 'admin@example.com', role: 'admin' },
    } as unknown as ReturnType<typeof auth>);

    const request = createRequest({
      filename: 'large.mp4',
      contentType: 'video/mp4',
      size: 600 * 1024 * 1024, // 600MB
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.message).toContain('500MB以下');
  });

  it('should return upload URL for valid request', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: '1', email: 'admin@example.com', role: 'admin' },
    } as unknown as ReturnType<typeof auth>);

    vi.mocked(generateVideoKey).mockReturnValue('videos/test-project/12345-test.mp4');
    vi.mocked(generateUploadUrl).mockResolvedValue({
      uploadUrl: 'https://r2.example.com/signed-url',
      key: 'videos/test-project/12345-test.mp4',
      expiresAt: '2026-01-15T00:00:00.000Z',
    });

    const request = createRequest({
      filename: 'test.mp4',
      contentType: 'video/mp4',
      size: 10 * 1024 * 1024, // 10MB
      projectId: 'test-project',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.uploadUrl).toBe('https://r2.example.com/signed-url');
    expect(json.data.fileKey).toBe('videos/test-project/12345-test.mp4');
    expect(json.data.expiresAt).toBe('2026-01-15T00:00:00.000Z');
  });

  it('should use temp project ID when projectId is not provided', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123', email: 'admin@example.com', role: 'admin' },
    } as unknown as ReturnType<typeof auth>);

    vi.mocked(generateVideoKey).mockReturnValue('videos/temp-user-123/12345-test.mp4');
    vi.mocked(generateUploadUrl).mockResolvedValue({
      uploadUrl: 'https://r2.example.com/signed-url',
      key: 'videos/temp-user-123/12345-test.mp4',
      expiresAt: '2026-01-15T00:00:00.000Z',
    });

    const request = createRequest({
      filename: 'test.mp4',
      contentType: 'video/mp4',
      size: 1024,
    });

    await POST(request);

    expect(generateVideoKey).toHaveBeenCalledWith('temp-user-123', 'test.mp4');
  });
});
