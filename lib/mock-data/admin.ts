import { User, ActivityLog } from '@/types/admin';

export const mockUsers: User[] = [
  {
    id: '1',
    name: '山田 太郎',
    email: 'yamada@example.com',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-04-16T09:30:00Z',
  },
  {
    id: '2',
    name: '鈴木 花子',
    email: 'suzuki@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2024-02-15T00:00:00Z',
    lastLoginAt: '2024-04-15T14:20:00Z',
  },
  {
    id: '3',
    name: '佐藤 次郎',
    email: 'sato@example.com',
    role: 'viewer',
    status: 'inactive',
    createdAt: '2024-03-01T00:00:00Z',
    lastLoginAt: null,
  },
];

export const mockActivityLogs: ActivityLog[] = [
  {
    id: 1,
    timestamp: '2024-04-16T10:30:00Z',
    user: '山田 太郎',
    action: 'create',
    details: '新規ユーザーを作成しました',
    ipAddress: '192.168.1.100',
  },
  {
    id: 2,
    timestamp: '2024-04-16T10:15:00Z',
    user: '鈴木 花子',
    action: 'update',
    details: '取引情報を更新しました',
    ipAddress: '192.168.1.101',
  },
  {
    id: 3,
    timestamp: '2024-04-16T10:00:00Z',
    user: '山田 太郎',
    action: 'login',
    details: 'ログインしました',
    ipAddress: '192.168.1.100',
  },
  {
    id: 4,
    timestamp: '2024-04-15T15:30:00Z',
    user: '佐藤 次郎',
    action: 'delete',
    details: '取引を削除しました',
    ipAddress: '192.168.1.102',
  },
];