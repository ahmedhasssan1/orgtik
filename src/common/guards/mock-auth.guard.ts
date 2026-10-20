import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';
import type { AuthenticatedRequest, User } from '../interfaces/user.interface';

@Injectable()
export class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = request.header('x-user-role');

    if (!role) {
      throw new UnauthorizedException('Provide the x-user-role header.');
    }

    if ((role as UserRole) === UserRole.ADMIN) {
      request.user = { id: 'admin', role: UserRole.ADMIN } satisfies User;
      return true;
    }

    request.user = { id: role, role: UserRole.AGENT } satisfies User;
    return true;
  }
}
