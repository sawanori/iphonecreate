'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { VideoUploader } from '@/components/upload';
import { Upload, Library, Check, Trash2, Loader2 } from 'lucide-react';
import { generateAndUploadThumbnail } from '@/lib/utils/video-thumbnail';

/**
 * 動画ライブラリ項目の型
 */
interface LibraryVideo {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

/**
 * VideoSelector props
 */
interface VideoSelectorProps {
  projectId: string;
  currentVideoUrl?: string | undefined;
  onVideoSelect: (videoUrl: string, thumbnailUrl?: string, aspectRatio?: 'landscape' | 'portrait') => void;
  onClose: () => void;
}

/**
 * 動画選択コンポーネント
 * 新規アップロードまたはライブラリから選択
 */
export function VideoSelector({
  projectId,
  currentVideoUrl,
  onVideoSelect,
  onClose,
}: VideoSelectorProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [libraryVideos, setLibraryVideos] = useState<LibraryVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);

  // ライブラリを取得
  const fetchLibrary = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/library');
      if (response.ok) {
        const { data } = await response.json();
        setLibraryVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Failed to fetch library:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ライブラリタブに切り替え時に取得
  useEffect(() => {
    if (activeTab === 'library') {
      fetchLibrary();
    }
  }, [activeTab, fetchLibrary]);

  // アップロード完了時
  const handleUploadComplete = async (result: { videoUrl: string; fileKey: string }) => {
    console.log('[VideoSelector] Upload complete:', result);

    // サムネイル生成を有効化
    const ENABLE_THUMBNAIL_GENERATION = true;

    let thumbnailUrl: string | undefined;
    let aspectRatio: 'landscape' | 'portrait' | undefined;

    if (ENABLE_THUMBNAIL_GENERATION && result.videoUrl) {
      setIsGeneratingThumbnail(true);
      setThumbnailError(null);

      try {
        const thumbnailResult = await generateAndUploadThumbnail(result.videoUrl, projectId);
        if (thumbnailResult) {
          thumbnailUrl = thumbnailResult.thumbnailUrl;
          aspectRatio = thumbnailResult.aspectRatio;
        } else {
          setThumbnailError('サムネイル生成に失敗しました。動画は正常にアップロードされています。');
        }
      } catch (error) {
        console.warn('[VideoSelector] Failed to generate thumbnail:', error);
        setThumbnailError('サムネイル生成に失敗しました。');
      }
      setIsGeneratingThumbnail(false);
    }

    // ライブラリに追加
    const title = newVideoTitle.trim() || `動画 ${new Date().toLocaleString('ja-JP')}`;
    try {
      const libraryData: { title: string; videoUrl: string; thumbnailUrl?: string } = {
        title,
        videoUrl: result.videoUrl,
      };
      // thumbnailUrlがある場合のみ追加（nullはZodエラーになる）
      if (thumbnailUrl) {
        libraryData.thumbnailUrl = thumbnailUrl;
      }
      await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(libraryData),
      });
    } catch (error) {
      console.error('Failed to add to library:', error);
    }

    setIsGeneratingThumbnail(false);

    // サムネイルなしでも閉じる（ユーザーが明示的に閉じるまで待つ場合はここをコメントアウト）
    onVideoSelect(result.videoUrl, thumbnailUrl, aspectRatio);
    onClose();
  };

  // ライブラリから選択
  const handleLibrarySelect = () => {
    const video = libraryVideos.find((v) => v.id === selectedVideoId);
    if (video) {
      onVideoSelect(video.videoUrl, video.thumbnailUrl || undefined);
      onClose();
    }
  };

  // ライブラリから削除
  const handleDeleteFromLibrary = async (videoId: string) => {
    if (!confirm('この動画をライブラリから削除しますか？')) return;

    try {
      const response = await fetch(`/api/library/${videoId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setLibraryVideos((prev) => prev.filter((v) => v.id !== videoId));
        if (selectedVideoId === videoId) {
          setSelectedVideoId(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete from library:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'library')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            新規アップロード
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="w-4 h-4" />
            動画倉庫から
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium block mb-2">動画タイトル（任意）</label>
            <Input
              value={newVideoTitle}
              onChange={(e) => setNewVideoTitle(e.target.value)}
              placeholder="動画のタイトルを入力"
              disabled={isGeneratingThumbnail}
            />
          </div>
          <VideoUploader
            projectId={projectId}
            onUploadComplete={handleUploadComplete}
          />
          {isGeneratingThumbnail && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>サムネイルを生成中...</span>
            </div>
          )}
          {thumbnailError && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300">{thumbnailError}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : libraryVideos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Library className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>動画倉庫に動画がありません</p>
              <p className="text-sm mt-1">新規アップロードタブから動画を追加してください</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                {libraryVideos.map((video) => (
                  <Card
                    key={video.id}
                    className={`cursor-pointer transition-all ${
                      selectedVideoId === video.id
                        ? 'ring-2 ring-primary'
                        : 'hover:shadow-md'
                    } ${
                      currentVideoUrl === video.videoUrl
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : ''
                    }`}
                    onClick={() => setSelectedVideoId(video.id)}
                  >
                    <CardContent className="p-2">
                      <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded mb-2 flex items-center justify-center relative">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">サムネイルなし</span>
                        )}
                        {selectedVideoId === video.id && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center rounded">
                            <Check className="w-8 h-8 text-primary" />
                          </div>
                        )}
                        {currentVideoUrl === video.videoUrl && (
                          <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                            使用中
                          </div>
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-medium truncate flex-1">{video.title}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFromLibrary(video.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                onClick={handleLibrarySelect}
                disabled={!selectedVideoId}
                className="w-full"
              >
                選択した動画を使用
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
