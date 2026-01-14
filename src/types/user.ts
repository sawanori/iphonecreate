/**
 * ユーザー関連の型定義
 * 対応設計書: DESIGN-FE-2026-001 セクション9
 */

/**
 * ユーザーロール
 */
export type UserRole = 'admin' | 'viewer';

/**
 * ユーザー
 */
export type User = {
  /** ユーザーID */
  id: string;
  /** メールアドレス */
  email: string;
  /** 表示名 */
  name: string;
  /** ロール */
  role: UserRole;
  /** 作成日時 */
  createdAt: string;
  /** 最終ログイン日時 */
  lastLoginAt: string | null;
};

/**
 * セッション情報
 */
export type Session = {
  /** ユーザー情報 */
  user: User;
  /** セッション有効期限 */
  expires: string;
};

/**
 * 認証状態
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * ログインリクエスト
 */
export type LoginRequest = {
  /** メールアドレス */
  email: string;
  /** パスワード */
  password: string;
};

/**
 * ログインレスポンス
 */
export type LoginResponse = {
  /** ユーザー情報 */
  user: User;
  /** アクセストークン */
  accessToken: string;
};

/**
 * 権限チェック結果
 */
export type PermissionCheck = {
  /** 許可されているか */
  allowed: boolean;
  /** 拒否理由（許可されていない場合） */
  reason?: string;
};
