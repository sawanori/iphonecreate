import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

/**
 * R2 クライアントの設定を検証
 */
function validateConfig(): void {
  const required = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing R2 configuration: ${missing.join(', ')}`);
  }
}

/**
 * R2 S3 クライアントを作成
 */
function createR2Client(): S3Client {
  validateConfig();

  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

// シングルトンインスタンス
let r2Client: S3Client | null = null;

/**
 * R2 クライアントを取得（シングルトン）
 */
export function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = createR2Client();
  }
  return r2Client;
}

/**
 * R2 クライアントをリセット（テスト用）
 */
export function resetR2Client(): void {
  r2Client = null;
}

/**
 * バケット名を取得
 */
export function getBucketName(): string {
  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME is not set');
  }
  return bucketName;
}

/**
 * パブリックURLを取得
 */
export function getPublicUrl(key: string): string {
  const baseUrl = process.env.R2_PUBLIC_URL;
  if (!baseUrl) {
    throw new Error('R2_PUBLIC_URL is not set');
  }
  return `${baseUrl}/${key}`;
}

/**
 * ファイルをアップロード
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType: string
): Promise<string> {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await client.send(command);

  return getPublicUrl(key);
}

/**
 * ファイルを取得
 */
export async function getFile(key: string): Promise<{
  body: ReadableStream | null;
  contentType: string | undefined;
}> {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await client.send(command);

  return {
    body: response.Body as ReadableStream | null,
    contentType: response.ContentType,
  };
}

/**
 * ファイルを削除
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await client.send(command);
}

/**
 * ファイルの存在確認
 */
export async function fileExists(key: string): Promise<boolean> {
  const client = getR2Client();
  const bucket = getBucketName();

  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * ファイル一覧を取得
 */
export async function listFiles(prefix?: string): Promise<
  Array<{
    key: string;
    size: number;
    lastModified: Date;
  }>
> {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  });

  const response = await client.send(command);

  return (
    response.Contents?.map((item) => ({
      key: item.Key!,
      size: item.Size!,
      lastModified: item.LastModified!,
    })) ?? []
  );
}
