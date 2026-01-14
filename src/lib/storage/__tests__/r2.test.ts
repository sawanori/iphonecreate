import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getR2Client,
  resetR2Client,
  getBucketName,
  getPublicUrl,
} from '../r2';

describe('R2 Storage Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset the singleton client before each test
    resetR2Client();
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('getR2Client', () => {
    it('should throw error when R2_ACCOUNT_ID is missing', () => {
      process.env.R2_ACCESS_KEY_ID = 'test-access-key';
      process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key';
      process.env.R2_BUCKET_NAME = 'test-bucket';
      delete process.env.R2_ACCOUNT_ID;

      expect(() => getR2Client()).toThrow('Missing R2 configuration: R2_ACCOUNT_ID');
    });

    it('should throw error when R2_ACCESS_KEY_ID is missing', () => {
      process.env.R2_ACCOUNT_ID = 'test-account';
      process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key';
      process.env.R2_BUCKET_NAME = 'test-bucket';
      delete process.env.R2_ACCESS_KEY_ID;

      expect(() => getR2Client()).toThrow('Missing R2 configuration: R2_ACCESS_KEY_ID');
    });

    it('should throw error when R2_SECRET_ACCESS_KEY is missing', () => {
      process.env.R2_ACCOUNT_ID = 'test-account';
      process.env.R2_ACCESS_KEY_ID = 'test-access-key';
      process.env.R2_BUCKET_NAME = 'test-bucket';
      delete process.env.R2_SECRET_ACCESS_KEY;

      expect(() => getR2Client()).toThrow('Missing R2 configuration: R2_SECRET_ACCESS_KEY');
    });

    it('should throw error when R2_BUCKET_NAME is missing', () => {
      process.env.R2_ACCOUNT_ID = 'test-account';
      process.env.R2_ACCESS_KEY_ID = 'test-access-key';
      process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key';
      delete process.env.R2_BUCKET_NAME;

      expect(() => getR2Client()).toThrow('Missing R2 configuration: R2_BUCKET_NAME');
    });

    it('should throw error listing all missing config values', () => {
      delete process.env.R2_ACCOUNT_ID;
      delete process.env.R2_ACCESS_KEY_ID;
      delete process.env.R2_SECRET_ACCESS_KEY;
      delete process.env.R2_BUCKET_NAME;

      expect(() => getR2Client()).toThrow(
        'Missing R2 configuration: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME'
      );
    });

    it('should create client when all config values are present', () => {
      process.env.R2_ACCOUNT_ID = 'test-account';
      process.env.R2_ACCESS_KEY_ID = 'test-access-key';
      process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key';
      process.env.R2_BUCKET_NAME = 'test-bucket';

      const client = getR2Client();
      expect(client).toBeDefined();
    });

    it('should return same client instance (singleton)', () => {
      process.env.R2_ACCOUNT_ID = 'test-account';
      process.env.R2_ACCESS_KEY_ID = 'test-access-key';
      process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key';
      process.env.R2_BUCKET_NAME = 'test-bucket';

      const client1 = getR2Client();
      const client2 = getR2Client();
      expect(client1).toBe(client2);
    });
  });

  describe('getBucketName', () => {
    it('should return bucket name when set', () => {
      process.env.R2_BUCKET_NAME = 'my-test-bucket';

      const bucketName = getBucketName();
      expect(bucketName).toBe('my-test-bucket');
    });

    it('should throw error when bucket name is not set', () => {
      delete process.env.R2_BUCKET_NAME;

      expect(() => getBucketName()).toThrow('R2_BUCKET_NAME is not set');
    });
  });

  describe('getPublicUrl', () => {
    it('should return full public URL', () => {
      process.env.R2_PUBLIC_URL = 'https://pub-xxx.r2.dev';

      const url = getPublicUrl('videos/project-1/video.mp4');
      expect(url).toBe('https://pub-xxx.r2.dev/videos/project-1/video.mp4');
    });

    it('should throw error when R2_PUBLIC_URL is not set', () => {
      delete process.env.R2_PUBLIC_URL;

      expect(() => getPublicUrl('videos/test.mp4')).toThrow('R2_PUBLIC_URL is not set');
    });

    it('should handle keys with special characters', () => {
      process.env.R2_PUBLIC_URL = 'https://pub-xxx.r2.dev';

      const url = getPublicUrl('videos/project-1/test file.mp4');
      expect(url).toBe('https://pub-xxx.r2.dev/videos/project-1/test file.mp4');
    });
  });
});
