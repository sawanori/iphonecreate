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
  // 早期バリデーション
  if (!videoUrl || videoUrl.trim() === '') {
    console.error('[Thumbnail] Empty video URL provided');
    return Promise.reject(new Error('Empty video URL'));
  }

  console.log('[Thumbnail] Starting generateVideoThumbnail with URL:', videoUrl);

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    let isCleanedUp = false;

    // クリーンアップ関数（一度だけ実行）
    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.onerror = null;
      video.oncanplaythrough = null;
      video.src = '';
      video.load(); // srcを空にした後にloadを呼んでリセット
    };

    // CORSが設定されていない場合のフォールバック
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    // タイムアウト設定（20秒）
    const timeout = setTimeout(() => {
      console.warn('[Thumbnail] Timeout: Video loading took too long');
      cleanup();
      reject(new Error('Thumbnail generation timeout'));
    }, 20000);

    video.onseeked = () => {
      clearTimeout(timeout);
      console.log('[Thumbnail] Video seeked, capturing frame...');

      try {
        // キャンバスサイズを計算（アスペクト比維持）
        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width === 0 || height === 0) {
          console.warn('[Thumbnail] Video dimensions are 0, cannot capture');
          cleanup();
          reject(new Error('Video dimensions are 0'));
          return;
        }

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
          cleanup();
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(video, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            cleanup();

            if (blob) {
              console.log('[Thumbnail] Successfully generated thumbnail blob, size:', blob.size);
              resolve(blob);
            } else {
              console.warn('[Thumbnail] Failed to generate blob');
              reject(new Error('Failed to generate thumbnail blob'));
            }
          },
          'image/jpeg',
          0.85
        );
      } catch (error) {
        console.error('[Thumbnail] Canvas error:', error);
        cleanup();
        reject(error);
      }
    };

    video.onloadedmetadata = () => {
      console.log(`[Thumbnail] Metadata loaded: ${video.videoWidth}x${video.videoHeight}, duration: ${video.duration}s`);
      // メタデータ読み込み後、指定時間にシーク
      // 動画の長さより長い場合は1秒にフォールバック
      const targetTime = video.duration > seekTime ? seekTime : Math.min(1, video.duration / 2);
      video.currentTime = targetTime;
    };

    video.oncanplaythrough = () => {
      console.log('[Thumbnail] Video can play through');
    };

    video.onerror = () => {
      // クリーンアップ済みの場合は無視（ループ防止）
      if (isCleanedUp) return;

      clearTimeout(timeout);
      const errorMsg = video.error?.message || 'Unknown error';
      console.error('[Thumbnail] Video error:', errorMsg, 'Code:', video.error?.code);
      cleanup();
      reject(new Error(`Failed to load video: ${errorMsg}`));
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
  console.log('[Thumbnail] Starting generateAndUploadThumbnail for:', videoUrl);
  try {
    const blob = await generateVideoThumbnail(videoUrl);
    console.log('[Thumbnail] Blob generated, size:', blob.size);
    const thumbnailUrl = await uploadThumbnail(blob, projectId);
    console.log('[Thumbnail] Upload successful:', thumbnailUrl);
    return thumbnailUrl;
  } catch (error) {
    console.error('[Thumbnail] Failed to generate/upload thumbnail:', error);
    // CORSエラーの場合は特別なメッセージを出す
    if (error instanceof Error) {
      if (error.message.includes('tainted') || error.message.includes('CORS') || error.message.includes('cross-origin')) {
        console.error('[Thumbnail] CORS issue detected. Please configure CORS on R2 bucket.');
      }
    }
    return undefined;
  }
}
