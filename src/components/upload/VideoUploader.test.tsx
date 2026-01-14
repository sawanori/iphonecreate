/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VideoUploader } from './VideoUploader';

// Fetch mock
const mockFetch = vi.fn();
global.fetch = mockFetch;

// XMLHttpRequest mock
const mockXHR = {
  open: vi.fn(),
  send: vi.fn(),
  setRequestHeader: vi.fn(),
  upload: {
    addEventListener: vi.fn(),
  },
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  status: 200,
};

vi.stubGlobal(
  'XMLHttpRequest',
  vi.fn(() => mockXHR)
);

describe('VideoUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockXHR.status = 200;
    mockXHR.onload = null;
    mockXHR.onerror = null;
  });

  it('should render drag and drop zone', () => {
    render(<VideoUploader />);

    expect(screen.getByText(/MP4ファイルをドラッグ&ドロップ/)).toBeInTheDocument();
    expect(screen.getByText('ファイルを選択')).toBeInTheDocument();
  });

  it('should render file size and format restrictions', () => {
    render(<VideoUploader />);

    expect(screen.getByText(/最大500MB、MP4形式のみ/)).toBeInTheDocument();
  });

  it('should validate file type and reject non-MP4 files', async () => {
    const onError = vi.fn();
    render(<VideoUploader onError={onError} />);

    const file = new File(['video content'], 'test.avi', { type: 'video/avi' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('MP4形式のみアップロード可能です');
    });
  });

  it('should validate file size and reject files larger than 500MB', async () => {
    const onError = vi.fn();
    render(<VideoUploader onError={onError} />);

    // Create a mock file with size > 500MB
    const largeFile = new File(['x'.repeat(100)], 'large.mp4', { type: 'video/mp4' });
    Object.defineProperty(largeFile, 'size', { value: 600 * 1024 * 1024 });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('ファイルサイズは500MB以下にしてください');
    });
  });

  it('should accept valid MP4 file under 500MB and call upload API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            uploadUrl: 'https://r2.example.com/upload',
            fileKey: 'videos/test/file.mp4',
            expiresAt: '2026-01-15T00:00:00Z',
          },
        }),
    });

    render(<VideoUploader />);

    const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for upload URL request
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/upload', expect.any(Object));
    });

    // Verify request body contains correct data
    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(requestBody.filename).toBe('test.mp4');
    expect(requestBody.contentType).toBe('video/mp4');
    expect(requestBody.size).toBe(10 * 1024 * 1024);
  });

  it('should handle drag over state', () => {
    const { container } = render(<VideoUploader />);

    const dropZone = container.querySelector('[class*="border-dashed"]');
    expect(dropZone).toBeInTheDocument();

    fireEvent.dragOver(dropZone!);
    expect(dropZone).toHaveClass('border-blue-500');
  });

  it('should reset drag state on drag leave', () => {
    const { container } = render(<VideoUploader />);

    const dropZone = container.querySelector('[class*="border-dashed"]');
    expect(dropZone).toBeInTheDocument();

    fireEvent.dragOver(dropZone!);
    fireEvent.dragLeave(dropZone!);

    expect(dropZone).not.toHaveClass('border-blue-500');
  });

  it('should show reset button after upload error', async () => {
    const onError = vi.fn();
    render(<VideoUploader onError={onError} />);

    // Create a file with invalid type to trigger error
    const file = new File(['video content'], 'test.avi', { type: 'video/avi' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('別のファイルをアップロード')).toBeInTheDocument();
    });
  });

  it('should apply additional className', () => {
    const { container } = render(<VideoUploader className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
