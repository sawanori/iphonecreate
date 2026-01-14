import type { UserRole } from '@/types';

declare module 'next-auth' {
  interface User {
    id: string;
    role: UserRole;
  }

  interface Session {
    user: User & {
      id: string;
      role: UserRole;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
