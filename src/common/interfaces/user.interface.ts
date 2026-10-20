import type { Request } from 'express';
import { UserRole } from '../enums/user-role.enum';

export interface User {
  id: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: User;
}
