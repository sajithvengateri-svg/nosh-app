// TODO: Implement User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
}

export type UserRole = 'owner' | 'admin' | 'manager' | 'chef' | 'staff' | 'viewer';

export interface UserPermission {
  id: string;
  name: string;
  description: string;
}
