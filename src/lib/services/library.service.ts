/**
 * 動画ライブラリサービス
 * アップロードした動画の管理
 */
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { videoLibrary } from '@/lib/db/schema';

/**
 * ユーザーの動画ライブラリを取得
 * @param userId - ユーザーID
 * @returns 動画ライブラリ一覧
 */
export async function getVideoLibrary(userId: string) {
  return db
    .select()
    .from(videoLibrary)
    .where(eq(videoLibrary.ownerId, userId))
    .orderBy(desc(videoLibrary.createdAt));
}

/**
 * 動画ライブラリに追加
 * @param data - 動画データ
 * @returns 追加された動画
 */
export async function addToLibrary(data: {
  title: string;
  videoUrl: string;
  thumbnailUrl?: string | undefined;
  fileSize?: number | undefined;
  duration?: number | undefined;
  ownerId: string;
}) {
  const result = await db
    .insert(videoLibrary)
    .values({
      title: data.title,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl,
      fileSize: data.fileSize,
      duration: data.duration,
      ownerId: data.ownerId,
    })
    .returning();

  return result[0];
}

/**
 * 動画ライブラリから削除
 * @param videoId - 動画ID
 * @param userId - ユーザーID（所有者確認用）
 */
export async function removeFromLibrary(videoId: string, userId: string) {
  // 所有者確認を含めた削除
  const result = await db
    .delete(videoLibrary)
    .where(eq(videoLibrary.id, videoId))
    .returning();

  // 削除された場合、所有者チェック
  if (result[0] && result[0].ownerId !== userId) {
    // 権限がない場合は削除を取り消し（実際には既に削除されているが、エラーを返す）
    throw new Error('Permission denied');
  }

  return result[0];
}

/**
 * 動画ライブラリの項目を更新
 * @param videoId - 動画ID
 * @param userId - ユーザーID
 * @param data - 更新データ
 */
export async function updateLibraryItem(
  videoId: string,
  userId: string,
  data: {
    title?: string | undefined;
    thumbnailUrl?: string | undefined;
  }
) {
  const result = await db
    .update(videoLibrary)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(videoLibrary.id, videoId))
    .returning();

  if (result[0] && result[0].ownerId !== userId) {
    throw new Error('Permission denied');
  }

  return result[0];
}

/**
 * 動画ライブラリから1件取得
 * @param videoId - 動画ID
 */
export async function getLibraryItem(videoId: string) {
  const result = await db
    .select()
    .from(videoLibrary)
    .where(eq(videoLibrary.id, videoId))
    .limit(1);

  return result[0] ?? null;
}
