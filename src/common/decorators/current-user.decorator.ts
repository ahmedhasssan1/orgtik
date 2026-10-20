import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, User } from '../interfaces/user.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
