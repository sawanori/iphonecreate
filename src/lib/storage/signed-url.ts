import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client, getBucketName } from './r2';

/**
 * アップロード用署名付きURL生成オプション
 */
export interface GenerateUploadUrlOptions {
  /** ファイルキー */
  key: string;
  /** コンテンツタイプ */
  contentType: string;
  /** 有効期限（秒） */
  expiresIn?: number;
  /** 最大ファイルサイズ（バイト） */
  maxSize?: number;
}

/**
 * ダウンロード用署名付きURL生成オプション
 */
export interface GenerateDownloadUrlOptions {
  /** ファイルキー */
  key: string;
  /** 有効期限（秒） */
  expiresIn?: number;
}

/**
 * アップロード用署名付きURLを生成
 */
export async function generateUploadUrl({
  key,
  contentType,
  expiresIn = 3600, // デフォルト1時間
}: GenerateUploadUrlOptions): Promise<{
  uploadUrl: string;
  key: string;
  expiresAt: string;
}> {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    uploadUrl,
    key,
    expiresAt,
  };
}

/**
 * ダウンロード用署名付きURLを生成
 */
export async function generateDownloadUrl({
  key,
  expiresIn = 3600,
}: GenerateDownloadUrlOptions): Promise<{
  downloadUrl: string;
  expiresAt: string;
}> {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const downloadUrl = await getSignedUrl(client, command, { expiresIn });
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    downloadUrl,
    expiresAt,
  };
}

/**
 * 動画アップロード用のキーを生成
 */
export function generateVideoKey(
  projectId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `videos/${projectId}/${timestamp}-${sanitizedFilename}`;
}

/**
 * サムネイルアップロード用のキーを生成
 */
export function generateThumbnailKey(
  projectId: string,
  videoKey: string
): string {
  const filename = videoKey.split('/').pop() ?? '';
  const baseName = filename.replace(/\.[^.]+$/, '') || 'thumb';
  return `thumbnails/${projectId}/${baseName}.jpg`;
}
