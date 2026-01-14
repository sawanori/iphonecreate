# タスク: R2 ストレージ接続

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase4-003 |
| フェーズ | Phase 4: 管理画面 |
| 作成日 | 2026-01-14 |
| 想定工数 | 1日 |
| 検証レベル | L1（単体） |

---

## 概要

Cloudflare R2 ストレージへの接続設定を行う。AWS S3 互換クライアントを使用し、署名付きURL生成機能を実装する。

---

## 前提条件

### 依存タスク
- phase3-completion.md（Phase 3 が完了していること）

### 前提成果物
- 認証機能が実装されていること

### 環境変数
```
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com
```

---

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/lib/storage/r2.ts` | 新規作成 |
| `src/lib/storage/signed-url.ts` | 新規作成 |
| `src/lib/storage/index.ts` | 新規作成 |
| `.env.local` | 更新 |

---

## 実装詳細

### ステップ 1: AWS S3 Client インストール

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### ステップ 2: 環境変数追加

`.env.local` に追加:

```
# Cloudflare R2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=interactive-video-storage
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

### ステップ 3: R2 クライアント作成

`src/lib/storage/r2.ts`:

```typescript
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
function validateConfig() {
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
 * R2 クライアントを取得
 */
export function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = createR2Client();
  }
  return r2Client;
}

/**
 * バケット名を取得
 */
export function getBucketName(): string {
  return process.env.R2_BUCKET_NAME!;
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
```

### ステップ 4: 署名付きURL生成

`src/lib/storage/signed-url.ts`:

```typescript
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
  const baseName = videoKey.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'thumb';
  return `thumbnails/${projectId}/${baseName}.jpg`;
}
```

### ステップ 5: インデックスファイル作成

`src/lib/storage/index.ts`:

```typescript
// R2 クライアント
export {
  getR2Client,
  getBucketName,
  getPublicUrl,
  uploadFile,
  getFile,
  deleteFile,
  fileExists,
  listFiles,
} from './r2';

// 署名付きURL
export {
  generateUploadUrl,
  generateDownloadUrl,
  generateVideoKey,
  generateThumbnailKey,
  type GenerateUploadUrlOptions,
  type GenerateDownloadUrlOptions,
} from './signed-url';
```

---

## 完了条件

- [x] AWS S3 Client がインストールされている
- [x] R2 バケットに接続できる
- [x] 署名付きURL生成が動作する
- [ ] 環境変数が設定されている

---

## テスト方法

### 1. 接続テスト用APIルート作成

`src/app/api/test/storage/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { listFiles, generateUploadUrl, generateVideoKey } from '@/lib/storage';

export async function GET() {
  try {
    // ファイル一覧取得テスト
    const files = await listFiles('videos/');

    return NextResponse.json({
      status: 'ok',
      filesCount: files.length,
      files: files.slice(0, 5), // 最初の5件のみ
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // 署名付きURL生成テスト
    const key = generateVideoKey('test-project', 'test-video.mp4');
    const result = await generateUploadUrl({
      key,
      contentType: 'video/mp4',
      expiresIn: 300, // 5分
    });

    return NextResponse.json({
      status: 'ok',
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

### 2. 動作確認

```bash
npm run dev

# 接続テスト
curl http://localhost:3000/api/test/storage
# {"status":"ok","filesCount":0,"files":[]}

# 署名付きURL生成テスト
curl -X POST http://localhost:3000/api/test/storage
# {"status":"ok","uploadUrl":"https://...","key":"videos/...","expiresAt":"..."}
```

### 3. アップロードテスト

```bash
# 生成された署名付きURLを使用してアップロード
curl -X PUT "生成されたuploadUrl" \
  -H "Content-Type: video/mp4" \
  --data-binary @test-video.mp4
```

---

## 参照設計書セクション

- DESIGN-BE-2026-001 セクション8.1: ストレージ構成
- DESIGN-BE-2026-001 セクション8.2: 署名付きURL

---

## 成果物

- `src/lib/storage/r2.ts`: R2 クライアント
- `src/lib/storage/signed-url.ts`: 署名付きURL生成
- `src/lib/storage/index.ts`: エクスポート用インデックス

---

## 注意事項

- R2 の認証情報は厳重に管理
- 署名付きURLの有効期限は最小限に設定
- 本番環境ではCORSの設定が必要

---

## 次のタスク

- phase4-004-video-upload.md: 動画アップロード機能
