/**
 * 動画サムネイル生成ユーティリティ
 * 動画の1シーンをキャプチャしてBlobとして返す
 */

/**
 * 動画URLからサムネイルを生成
 * @param videoUrl - 動画URL
 * @param seekTime - キャプチャする時間（秒、デフォルト: 1秒）
 * @param maxWidth - 最大幅（デフォルト: 640px）
 * @returns サムネイルのBlob
 */
export async function generateVideoThumbnail(
  videoUrl: string,
  seekTime = 1,
  maxWidth = 640
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    // タイムアウト設定（15秒）
    const timeout = setTimeout(() => {
      video.src = '';
      reject(new Error('Thumbnail generation timeout'));
    }, 15000);

    video.onseeked = () => {
      clearTimeout(timeout);

      try {
        // キャンバスサイズを計算（アスペクト比維持）
        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(video, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            // クリーンアップ
            video.src = '';

            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to generate thumbnail blob'));
            }
          },
          'image/jpeg',
          0.85
        );
      } catch (error) {
        video.src = '';
        reject(error);
      }
    };

    video.onloadedmetadata = () => {
      // メタデータ読み込み後、指定時間にシーク
      // 動画の長さより長い場合は1秒にフォールバック
      const targetTime = video.duration > seekTime ? seekTime : Math.min(1, video.duration / 2);
      video.currentTime = targetTime;
    };

    video.onerror = () => {
      clearTimeout(timeout);
      video.src = '';
      reject(new Error('Failed to load video for thumbnail generation'));
    };

    // 動画読み込み開始
    video.src = videoUrl;
    video.load();
  });
}

/**
 * サムネイルをR2にアップロード
 * @param blob - サムネイルのBlob
 * @param projectId - プロジェクトID
 * @returns アップロードされたサムネイルのURL
 */
export async function uploadThumbnail(
  blob: Blob,
  projectId: string
): Promise<string> {
  // 1. 署名付きURLを取得
  const response = await fetch('/api/upload/thumbnail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      contentType: 'image/jpeg',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get thumbnail upload URL');
  }

  const { uploadUrl, thumbnailUrl } = await response.json();

  // 2. R2にアップロード
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload thumbnail to storage');
  }

  return thumbnailUrl;
}

/**
 * 動画からサムネイルを生成してアップロード
 * 失敗した場合はundefinedを返す（エラーをスロー せず）
 * @param videoUrl - 動画URL
 * @param projectId - プロジェクトID
 * @returns サムネイルURLまたはundefined
 */
export async function generateAndUploadThumbnail(
  videoUrl: string,
  projectId: string
): Promise<string | undefined> {
  try {
    const blob = await generateVideoThumbnail(videoUrl);
    const thumbnailUrl = await uploadThumbnail(blob, projectId);
    return thumbnailUrl;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to generate thumbnail:', error);
    return undefined;
  }
}
