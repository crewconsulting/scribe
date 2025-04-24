export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLoginAt: string | null;
}

export interface ActivityLog {
  id: number;
  timestamp: string;
  user: string;
  action: 'create' | 'update' | 'delete' | 'login';
  details: string;
  ipAddress: string;
}