# R2 CORS設定手順

動画アップロード機能を有効にするため、Cloudflare R2バケットにCORS設定が必要です。

## 設定手順

1. [Cloudflareダッシュボード](https://dash.cloudflare.com/)にログイン
2. 左メニューから **R2** を選択
3. **iphonecreate** バケットをクリック
4. **設定** タブを開く
5. **CORS ポリシー** セクションで「ポリシーを追加」をクリック
6. 以下のJSONをコピペして保存

## CORS設定JSON

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://本番ドメイン.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "HEAD"
    ],
    "AllowedHeaders": [
      "content-type"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

## 注意事項

- `https://本番ドメイン.com` は実際の本番ドメインに置き換えてください
- 複数のドメインがある場合は `AllowedOrigins` 配列に追加してください
- 設定後、数分で反映されます
