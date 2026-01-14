/**
 * データベースシードスクリプト
 * テストユーザーを作成
 * 対応設計書: DESIGN-BE-2026-001 セクション6.2
 *
 * 実行方法: npm run db:seed
 */
import { db } from './index';
import { users } from './schema';
import { hashPassword } from '@/lib/auth/password';

async function seed() {
  // eslint-disable-next-line no-console -- Seed script logging
  console.log('Seeding database...');

  // 管理者ユーザー
  const adminPassword = await hashPassword('password123');
  await db
    .insert(users)
    .values({
      email: 'admin@example.com',
      name: '管理者',
      passwordHash: adminPassword,
      role: 'admin',
    })
    .onConflictDoNothing();

  // eslint-disable-next-line no-console -- Seed script logging
  console.log('Created admin user: admin@example.com');

  // 視聴者ユーザー
  const viewerPassword = await hashPassword('password123');
  await db
    .insert(users)
    .values({
      email: 'viewer@example.com',
      name: '視聴者',
      passwordHash: viewerPassword,
      role: 'viewer',
    })
    .onConflictDoNothing();

  // eslint-disable-next-line no-console -- Seed script logging
  console.log('Created viewer user: viewer@example.com');

  // 本番用管理者ユーザー
  const prodAdminPassword = await hashPassword('noritaka8');
  await db
    .insert(users)
    .values({
      email: 'snp.inc.info@gmail.com',
      name: '管理者',
      passwordHash: prodAdminPassword,
      role: 'admin',
    })
    .onConflictDoNothing();

  // eslint-disable-next-line no-console -- Seed script logging
  console.log('Created production admin user: snp.inc.info@gmail.com');

  // 本番用視聴者ユーザー（別メールアドレス）
  const prodViewerPassword = await hashPassword('noritaka8');
  await db
    .insert(users)
    .values({
      email: 'snp.inc.info+viewer@gmail.com',
      name: '視聴者',
      passwordHash: prodViewerPassword,
      role: 'viewer',
    })
    .onConflictDoNothing();

  // eslint-disable-next-line no-console -- Seed script logging
  console.log('Created production viewer user: snp.inc.info+viewer@gmail.com');

  // eslint-disable-next-line no-console -- Seed script logging
  console.log('Seeding completed!');
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    // eslint-disable-next-line no-console -- Seed script error logging
    console.error('Seeding failed:', error);
    process.exit(1);
  });
