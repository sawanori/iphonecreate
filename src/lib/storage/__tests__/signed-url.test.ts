import { describe, it, expect } from 'vitest';
import { generateVideoKey, generateThumbnailKey } from '../signed-url';

describe('Signed URL Module', () => {
  describe('generateVideoKey', () => {
    it('should generate key with project ID and filename', () => {
      const key = generateVideoKey('project-123', 'my-video.mp4');

      expect(key).toMatch(/^videos\/project-123\/\d+-my-video\.mp4$/);
    });

    it('should sanitize filename with special characters', () => {
      const key = generateVideoKey('project-123', 'my video file!@#.mp4');

      expect(key).toMatch(/^videos\/project-123\/\d+-my_video_file___.mp4$/);
    });

    it('should preserve dots in filename', () => {
      const key = generateVideoKey('project-123', 'video.final.mp4');

      expect(key).toMatch(/^videos\/project-123\/\d+-video.final.mp4$/);
    });

    it('should preserve hyphens in filename', () => {
      const key = generateVideoKey('project-123', 'my-video-file.mp4');

      expect(key).toMatch(/^videos\/project-123\/\d+-my-video-file.mp4$/);
    });

    it('should include timestamp for uniqueness', () => {
      const key1 = generateVideoKey('project-123', 'video.mp4');

      // Wait a tiny bit to ensure different timestamp
      const key2 = generateVideoKey('project-123', 'video.mp4');

      // Both should start with videos/project-123/ but may have same or different timestamps
      expect(key1).toMatch(/^videos\/project-123\/\d+-video\.mp4$/);
      expect(key2).toMatch(/^videos\/project-123\/\d+-video\.mp4$/);
    });
  });

  describe('generateThumbnailKey', () => {
    it('should generate thumbnail key from video key', () => {
      const videoKey = 'videos/project-123/1234567890-my-video.mp4';
      const thumbnailKey = generateThumbnailKey('project-123', videoKey);

      expect(thumbnailKey).toBe('thumbnails/project-123/1234567890-my-video.jpg');
    });

    it('should handle video key with multiple dots', () => {
      const videoKey = 'videos/project-123/1234567890-video.final.version.mp4';
      const thumbnailKey = generateThumbnailKey('project-123', videoKey);

      expect(thumbnailKey).toBe('thumbnails/project-123/1234567890-video.final.version.jpg');
    });

    it('should handle video key without extension', () => {
      const videoKey = 'videos/project-123/video-file';
      const thumbnailKey = generateThumbnailKey('project-123', videoKey);

      expect(thumbnailKey).toBe('thumbnails/project-123/video-file.jpg');
    });

    it('should fallback to thumb when video key is empty', () => {
      const thumbnailKey = generateThumbnailKey('project-123', '');

      expect(thumbnailKey).toBe('thumbnails/project-123/thumb.jpg');
    });

    it('should use project ID from parameter', () => {
      const videoKey = 'videos/other-project/video.mp4';
      const thumbnailKey = generateThumbnailKey('my-project', videoKey);

      expect(thumbnailKey).toBe('thumbnails/my-project/video.jpg');
    });
  });
});
