# Phase 3 完了検証

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | phase3-completion |
| フェーズ | Phase 3: 認証機能 |
| 作成日 | 2026-01-14 |
| 想定工数 | 0.5日 |
| 検証レベル | L2（統合） |

---

## 概要

Phase 3 の全タスクが完了していることを確認し、認証機能が正常に動作することを検証する。ログインから権限別画面遷移までの一連フローを確認する。

---

## 前提条件

### 依存タスク
- phase3-001-authjs-setup.md
- phase3-002-user-schema.md
- phase3-003-login-page.md
- phase3-004-middleware.md
- phase3-005-role-routing.md

---

## 完了タスクチェックリスト

### phase3-001: Auth.js v5 設定
- [ ] Auth.js v5 がインストールされている
- [ ] Credentials Provider が設定されている
- [ ] JWT セッション（8時間有効）が設定されている

### phase3-002: ユーザースキーマ定義
- [ ] users テーブルが作成されている
- [ ] roleEnum（admin, viewer）が定義されている
- [ ] bcrypt パスワードハッシュ化が動作する
- [ ] テストユーザーが作成されている

### phase3-003: ログイン画面実装
- [ ] ログインページが表示される
- [ ] AC-AUTH-001: メール/パスワードでログインできる
- [ ] バリデーションエラーが表示される

### phase3-004: Middleware 認証ガード
- [ ] Middleware が作成されている
- [ ] 未認証ユーザーがリダイレクトされる
- [ ] AC-AUTH-004: 8時間でセッションがタイムアウトする

### phase3-005: 権限別ルーティング
- [ ] AC-AUTH-002: 管理者は管理画面にアクセスできる
- [ ] AC-AUTH-003: 視聴者は管理画面にアクセスできない
- [ ] AuthGuard/RoleGuard コンポーネントが動作する

---

## E2E検証手順

### 1. ログインフロー確認

```bash
npm run dev
```

**シナリオA: 管理者ログイン**
```
1. http://localhost:3000/login にアクセス
2. admin@example.com / password123 でログイン
3. トップページにリダイレクトされる
4. /editor にアクセス → 正常表示
5. /watch/test にアクセス → 正常表示
```

**シナリオB: 視聴者ログイン**
```
1. http://localhost:3000/login にアクセス
2. viewer@example.com / password123 でログイン
3. トップページにリダイレクトされる
4. /editor にアクセス → /unauthorized にリダイレクト
5. /watch/test にアクセス → 正常表示
```

**シナリオC: 未認証アクセス**
```
1. ログアウト状態で /watch/test にアクセス
2. /login?callbackUrl=/watch/test にリダイレクト
3. ログイン後、/watch/test に戻る
```

### 2. セッション検証

```
1. ログイン
2. ブラウザの Cookie を確認
   - next-auth.session-token が存在する
3. 8時間後（または maxAge 設定後）
   - セッションが切れてログインページにリダイレクト
```

### 3. バリデーション確認

```
1. 空のフォームで「ログイン」をクリック
   - エラーメッセージが表示される
2. 無効なメールアドレスを入力
   - バリデーションエラーが表示される
3. 間違った認証情報でログイン
   - 「メールアドレスまたはパスワードが正しくありません」が表示される
```

### 4. レート制限確認（Upstash 設定時）

```bash
# 短時間に大量のリクエスト
for i in {1..100}; do curl http://localhost:3000/login; done

# 429 Too Many Requests が返ることを確認
```

---

## 受入条件達成状況

### 認証・権限

- [ ] AC-AUTH-001: メール/パスワードでログインできる
- [ ] AC-AUTH-002: 管理者は管理画面にアクセスできる
- [ ] AC-AUTH-003: 視聴者は管理画面にアクセスできない
- [ ] AC-AUTH-004: 8時間でセッションがタイムアウトする

---

## 成果物確認

### 必須ファイル一覧

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   └── login/
│   │       └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   └── unauthorized/
│       └── page.tsx
├── components/
│   └── auth/
│       ├── index.ts
│       ├── LoginForm.tsx
│       ├── AuthGuard.tsx
│       └── RoleGuard.tsx
├── hooks/
│   └── useAuth.ts
├── lib/
│   ├── auth/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── password.ts
│   │   └── guards.ts
│   └── db/
│       ├── repositories/
│       │   └── user.repository.ts
│       ├── schema/
│       │   └── users.ts
│       └── seed.ts
├── middleware.ts
└── types/
    └── next-auth.d.ts
```

---

## Phase 3 完了条件

- [ ] 全タスクのチェックリストが完了している
- [ ] ログイン→権限別画面遷移の動作確認完了
- [ ] セッションタイムアウト動作確認完了
- [ ] 不正アクセス時のエラーハンドリング確認完了
- [ ] 全受入条件を達成している

---

## 次のフェーズへの引き継ぎ事項

### Phase 4 で使用する成果物
- 認証ガード: 管理画面のアクセス制御
- useAuth フック: ユーザー情報の取得
- ユーザーリポジトリ: 動画プロジェクトの作成者情報

### 注意事項
- 管理画面は AdminGuard で保護
- API ルートは auth() で認証チェックが必要
- 動画プロジェクトの作成者は session.user.id を使用

---

## 問題発生時の対処

### ログインできない場合
1. テストユーザーが DB に存在するか確認
   ```bash
   npm run db:studio
   ```
2. パスワードハッシュが正しいか確認
3. AUTH_SECRET が設定されているか確認

### セッションが保持されない場合
1. Cookie が設定されているか確認
2. AUTH_URL が正しいか確認
3. HTTPS 環境での Secure Cookie 設定を確認

### 権限チェックが動作しない場合
1. JWT コールバックで role が設定されているか確認
2. session コールバックで role が含まれているか確認
3. middleware.ts のルート設定を確認

---

## 承認

- [ ] Phase 3 完了を確認
- [ ] Phase 4 開始準備完了
